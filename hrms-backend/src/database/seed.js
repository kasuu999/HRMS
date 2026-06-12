require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connection');

// Import models
const Tenant = require('../auth/tenant.model');
const User = require('../auth/user.model');
const Employee = require('../employee/employee.model');
const { Shift } = require('../modules/attendance/attendance.model');
const { Department, Designation, Location } = require('../employee/org.model');
const { LeaveType, LeaveBalance } = require('../leave/leave.model');

const seed = async () => {
  try {
    // Connect to Database
    await connectDB();
    console.log('🌱 Starting DB Seeding...');

    // Drop obsolete index if it exists in MongoDB Atlas
    try {
      await mongoose.connection.collection('users').dropIndex('phone_1');
      console.log('✅ Dropped obsolete index phone_1 from users');
    } catch (e) {
      // Ignore if index doesn't exist or already dropped
    }

    // Find and delete existing acme-corp tenant and its data to make the seed idempotent
    const existingTenant = await Tenant.findOne({ slug: 'acme-corp' });
    if (existingTenant) {
      console.log('🗑 Removing existing acme-corp tenant and scoping data...');
      const tenantId = existingTenant._id;
      
      await User.deleteMany({ tenantId });
      await Employee.deleteMany({ tenantId });
      await Shift.deleteMany({ tenantId });
      await Department.deleteMany({ tenantId });
      await Designation.deleteMany({ tenantId });
      await Location.deleteMany({ tenantId });
      await LeaveType.deleteMany({ tenantId });
      await LeaveBalance.deleteMany({ tenantId });
      await Tenant.deleteOne({ _id: tenantId });
      
      console.log('🗑 Scoped data cleared.');
    }

    // 1. Create Tenant
    const tenant = await Tenant.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      adminEmail: 'admin@company.com',
    });
    console.log(`✅ Seeded Tenant: ${tenant.name} (${tenant.slug})`);

    // 2. Create Org Structure
    const department = await Department.create({
      tenantId: tenant._id,
      name: 'Engineering',
      code: 'ENG',
      description: 'Software Engineering Department',
    });
    console.log(`✅ Seeded Department: ${department.name}`);

    const designation = await Designation.create({
      tenantId: tenant._id,
      name: 'Software Engineer',
      level: 1,
    });
    console.log(`✅ Seeded Designation: ${designation.name}`);

    const location = await Location.create({
      tenantId: tenant._id,
      name: 'Bangalore Headquarters',
      code: 'BLR-HQ',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      timezone: 'IST',
    });
    console.log(`✅ Seeded Location: ${location.name}`);

    // 3. Create Shift
    const shift = await Shift.create({
      tenantId: tenant._id,
      name: 'General Shift',
      type: 'fixed',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      weeklyOffs: ['sat', 'sun'],
    });
    console.log(`✅ Seeded Shift: ${shift.name}`);

    // 4. Create Leave Types
    const leaveTypes = await LeaveType.create([
      {
        tenantId: tenant._id,
        name: 'Casual Leave',
        code: 'CL',
        type: 'casual',
        maxBalancePerYear: 12,
        color: '#4CAF50',
      },
      {
        tenantId: tenant._id,
        name: 'Sick Leave',
        code: 'SL',
        type: 'sick',
        maxBalancePerYear: 10,
        color: '#F44336',
      },
      {
        tenantId: tenant._id,
        name: 'Earned Leave',
        code: 'EL',
        type: 'earned',
        maxBalancePerYear: 15,
        color: '#2196F3',
      }
    ]);
    console.log('✅ Seeded Leave Types (CL, SL, EL)');

    // 5. Create Employee
    const employee = await Employee.create({
      tenantId: tenant._id,
      employeeId: 'EMP0001',
      firstName: 'Admin',
      lastName: 'User',
      officialEmail: 'admin@company.com',
      dateOfJoining: new Date('2026-01-01'),
      employmentType: 'full_time',
      department: department._id,
      designation: designation._id,
      location: location._id,
      shift: shift._id,
      status: 'active',
    });
    console.log(`✅ Seeded Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);

    // 6. Create User and Link to Employee
    const user = await User.create({
      tenantId: tenant._id,
      employeeId: employee._id,
      email: 'admin@company.com',
      password: 'password123',
      role: 'hr_admin',
      isActive: true,
    });
    console.log(`✅ Seeded User: ${user.email} (Role: ${user.role})`);

    // Update Employee with User Reference
    employee.userId = user._id;
    await employee.save();

    // 7. Seed Leave Balances for Employee
    await LeaveBalance.create(
      leaveTypes.map(lt => ({
        tenantId: tenant._id,
        employeeId: employee._id,
        leaveType: lt._id,
        year: 2026,
        totalEntitled: lt.maxBalancePerYear,
        balance: lt.maxBalancePerYear,
        taken: 0,
      }))
    );
    console.log('✅ Seeded Leave Balances for the Employee');

    console.log('🌿 DB Seeding Completed Successfully! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seed();

