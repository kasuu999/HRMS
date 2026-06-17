const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user.model');
const Tenant = require('./tenant.model');
const AuditLog = require('./auditLog.model');

const generateTokens = (userId, tenantId, role) => {
  const accessToken = jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, tenantId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const audit = async (tenantId, userId, action, module, req, extra = {}) => {
  try {
    await AuditLog.create({
      tenantId, userId, action, module,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      ...extra
    });
  } catch (e) {}
};

// KEY FIX: Creates Employee record for admin on registration
exports.registerTenant = async (req, res) => {
  try {
    const { companyName, adminEmail, adminPassword, adminName } = req.body;

    if (!companyName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'companyName, adminEmail and adminPassword are required' });
    }

    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(409).json({ success: false, message: 'Company already registered' });
    }

    const tenant = await Tenant.create({ name: companyName, slug, adminEmail });

    // Parse admin name
    const nameParts = (adminName || adminEmail.split('@')[0]).split(' ');
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Create Employee record (needed for attendance/leave)
    const Employee = require('../employee/employee.model');
    const empCount = await Employee.countDocuments({ tenantId: tenant._id });
    const employeeId = `EMP${String(empCount + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      tenantId: tenant._id,
      employeeId,
      firstName,
      lastName,
      officialEmail: adminEmail,
      dateOfJoining: new Date(),
      employmentType: 'full_time',
      status: 'active',
    });

    const user = await User.create({
      tenantId: tenant._id,
      employeeId: employee._id,
      email: adminEmail,
      password: adminPassword,
      role: 'hr_admin',
    });

    employee.userId = user._id;
    await employee.save();

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    await audit(tenant._id, user._id, 'REGISTER_TENANT', 'auth', req, { status: 'success' });

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug },
        user: { id: user._id, email: user.email, role: user.role, tenantName: tenant.name },
        accessToken,
        refreshToken,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Employee self-registration: join existing tenant
exports.registerEmployee = async (req, res) => {
  try {
    const { tenantSlug, firstName, lastName, email, password, phone } = req.body;

    if (!tenantSlug || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'tenantSlug, firstName, lastName, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Organization not found. Check the slug and try again.' });

    // Check if email already exists in this tenant
    const existingUser = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered in this organization' });
    }

    // Create Employee record
    const Employee = require('../employee/employee.model');
    const empCount = await Employee.countDocuments({ tenantId: tenant._id });
    const employeeIdStr = `EMP${String(empCount + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      tenantId: tenant._id,
      employeeId: employeeIdStr,
      firstName,
      lastName,
      officialEmail: email,
      phone: phone || undefined,
      dateOfJoining: new Date(),
      employmentType: 'full_time',
      status: 'active',
    });

    // Create User with 'employee' role
    const user = await User.create({
      tenantId: tenant._id,
      employeeId: employee._id,
      email: email.toLowerCase(),
      password,
      role: 'employee',
    });

    employee.userId = user._id;
    await employee.save();

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    await audit(tenant._id, user._id, 'REGISTER_EMPLOYEE', 'auth', req, { status: 'success' });

    // Send welcome notification
    try {
      const { createNotification } = require('../notifications/notification.service');
      await createNotification({
        tenantId: tenant._id, userId: user._id,
        title: 'Welcome to ' + tenant.name + '! 🎉',
        message: `Hi ${firstName}, your account has been created successfully. You can now mark attendance, apply for leave, and more.`,
        type: 'success', module: 'auth',
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        user: { id: user._id, email: user.email, role: user.role, tenantId: tenant._id, tenantName: tenant.name },
        accessToken,
        refreshToken,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;

    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Organization not found' });

    const user = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() })
      .select('+password +refreshToken +failedLoginAttempts +lockUntil');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await audit(tenant._id, user._id, 'LOGIN_BLOCKED', 'auth', req, { status: 'failure' });
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${remaining} minutes.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await audit(tenant._id, user._id, 'LOGIN_FAILED', 'auth', req, { status: 'failure' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.failedLoginAttempts > 0) {
      await user.updateOne({ $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await audit(tenant._id, user._id, 'LOGIN', 'auth', req, { status: 'success' });

    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, role: user.role, tenantId: tenant._id, tenantName: tenant.name },
        accessToken,
        refreshToken,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.userId, tenantId: decoded.tenantId }).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.tenantId, user.role);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    await audit(req.tenantId, req.user._id, 'LOGOUT', 'auth', req);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, tenantSlug } = req.body;
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) return res.status(404).json({ success: false, message: 'Organization not found' });

    const user = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    await audit(tenant._id, user._id, 'FORGOT_PASSWORD', 'auth', req);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const Tenant = require('./tenant.model');
    const tenant = await Tenant.findById(req.user.tenantId).select('name slug');
    const userData = req.user.toObject ? req.user.toObject() : { ...req.user };
    userData.tenantName = tenant?.name || '';
    userData.tenantSlug = tenant?.slug || '';
    res.json({ success: true, data: userData });
  } catch (err) {
    res.json({ success: true, data: req.user });
  }
};