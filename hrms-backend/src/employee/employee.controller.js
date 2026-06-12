const Employee = require('./employee.model');
const { Department, Designation, Location } = require('./org.model');
const User = require('../auth/user.model');
const AuditLog = require('../auth/auditLog.model');

// Auto-generate Employee ID per tenant
const generateEmployeeId = async (tenantId) => {
  const count = await Employee.countDocuments({ tenantId });
  const num = String(count + 1).padStart(4, '0');
  return `EMP${num}`;
};

// Audit helper
const audit = async (tenantId, userId, action, resourceId, oldValue, newValue, req) => {
  try {
    await AuditLog.create({
      tenantId, userId, action, module: 'employee',
      resourceId, resourceType: 'Employee',
      oldValue, newValue,
      ipAddress: req.ip,
    });
  } catch (e) {}
};

// @POST /api/employees — Create employee
exports.createEmployee = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const employeeId = await generateEmployeeId(tenantId);

    ['department','designation','location','reportingManager','shift','maritalStatus'].forEach(f => { if (req.body[f] === '') delete req.body[f]; });

    const employee = await Employee.create({
      ...req.body,
      tenantId,
      employeeId,
      createdBy: req.user._id,
    });

    // Create user account for the employee
    const user = await User.create({
      tenantId,
      employeeId: employee._id,
      email: employee.officialEmail,
      password: `Hrms@${employeeId}`, // Temp password, employee must change
      role: req.body.role || 'employee',
    });

    employee.userId = user._id;
    await employee.save();

    await audit(tenantId, req.user._id, 'CREATE_EMPLOYEE', employee._id, null, employee, req);

    res.status(201).json({
      success: true,
      message: `Employee ${employeeId} created successfully`,
      data: employee
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/employees — Directory with filters
exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      page = 1, limit = 20, search, department, location,
      designation, status = 'active', employmentType
    } = req.query;

    const filter = { tenantId, isDeleted: false };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (location) filter.location = location;
    if (designation) filter.designation = designation;
    if (employmentType) filter.employmentType = employmentType;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { officialEmail: { $regex: search, $options: 'i' } },
      ];
    }

    // Managers can only see their team
    if (req.user.role === 'manager') {
      filter.reportingManager = req.user.employeeId;
    }

    const total = await Employee.countDocuments(filter);
    const employees = await Employee.find(filter)
      .populate('department', 'name')
      .populate('designation', 'name')
      .populate('location', 'name city')
      .populate('reportingManager', 'firstName lastName employeeId photo')
      .select('-bankDetails -pan -aadhaar -uan -esic')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: employees,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/employees/:id — Get single employee
exports.getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const employee = await Employee.findOne({ _id: id, tenantId, isDeleted: false })
      .populate('department', 'name code')
      .populate('designation', 'name level')
      .populate('location', 'name city state country timezone')
      .populate('reportingManager', 'firstName lastName employeeId photo officialEmail')
      .populate('shift', 'name startTime endTime');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Employees can only see their own sensitive data
    let data = employee.toJSON();
    if (req.user.role === 'employee' && req.user.employeeId?.toString() !== id) {
      delete data.bankDetails;
      delete data.pan;
      delete data.aadhaar;
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/employees/:id — Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const existing = await Employee.findOne({ _id: id, tenantId });
    if (!existing) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Sensitive fields require approval (bank, statutory)
    const sensitiveFields = ['bankDetails', 'pan', 'aadhaar', 'uan'];
    const hasSensitiveChange = sensitiveFields.some(f => req.body[f]);
    if (hasSensitiveChange && req.user.role !== 'hr_admin') {
      return res.status(403).json({
        success: false,
        message: 'Changes to sensitive fields require HR Admin approval'
      });
    }

    const oldValue = existing.toJSON();
    const updated = await Employee.findOneAndUpdate(
      { _id: id, tenantId },
      { ...req.body },
      { new: true, runValidators: true }
    );

    await audit(tenantId, req.user._id, 'UPDATE_EMPLOYEE', id, oldValue, updated, req);

    res.json({ success: true, message: 'Employee updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/employees/org-chart — Org chart with circular check
exports.getOrgChart = async (req, res) => {
  try {
    const employees = await Employee.find({ tenantId: req.tenantId, status: 'active', isDeleted: false })
      .select('firstName lastName employeeId photo designation department reportingManager')
      .populate('designation', 'name')
      .populate('department', 'name');

    // Build tree
    const map = {};
    employees.forEach(e => { map[e._id] = { ...e.toJSON(), children: [] }; });

    const roots = [];
    employees.forEach(e => {
      if (e.reportingManager && map[e.reportingManager]) {
        map[e.reportingManager].children.push(map[e._id]);
      } else {
        roots.push(map[e._id]);
      }
    });

    res.json({ success: true, data: roots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/employees/:id/exit — Offboard employee
exports.exitEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { exitDate, exitReason, exitType } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { status: 'resigned', exitDate, exitReason, exitType },
      { new: true }
    );
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Deactivate user account
    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    await audit(req.tenantId, req.user._id, 'EXIT_EMPLOYEE', id, null, { exitDate, exitReason, exitType }, req);

    res.json({ success: true, message: 'Employee exit processed', data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- Org structure endpoints ---
exports.createDepartment = async (req, res) => {
  try {
    const dept = await Department.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ tenantId: req.tenantId, isActive: true })
      .populate('head', 'firstName lastName');
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const desig = await Designation.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: desig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: designations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const loc = await Location.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: loc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

