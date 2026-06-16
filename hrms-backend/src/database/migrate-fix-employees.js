/**
 * Migration: Fix existing admin users who don't have Employee records
 * Run: node src/database/migrate-fix-employees.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
};

const run = async () => {
  await connectDB();

  const User = require('../modules/auth/user.model');
  const Employee = require('../modules/employee/employee.model');
  const Tenant = require('../modules/auth/tenant.model');

  // Find all users who have no employeeId linked
  const usersWithoutEmployee = await User.find({ employeeId: { $exists: false } });
  console.log(`Found ${usersWithoutEmployee.length} users without employee records`);

  for (const user of usersWithoutEmployee) {
    try {
      // Check if employee already exists with same email
      let emp = await Employee.findOne({ tenantId: user.tenantId, officialEmail: user.email });

      if (!emp) {
        const tenant = await Tenant.findById(user.tenantId);
        const empCount = await Employee.countDocuments({ tenantId: user.tenantId });
        const employeeId = `EMP${String(empCount + 1).padStart(4, '0')}`;

        // Parse name from email
        const namePart = user.email.split('@')[0].replace(/[._-]/g, ' ');
        const parts = namePart.split(' ');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Admin';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';

        emp = await Employee.create({
          tenantId: user.tenantId,
          employeeId,
          firstName,
          lastName,
          officialEmail: user.email,
          dateOfJoining: user.createdAt || new Date(),
          employmentType: 'full_time',
          status: 'active',
          userId: user._id,
        });

        console.log(`✅ Created Employee ${employeeId} for ${user.email}`);
      } else {
        console.log(`ℹ️  Employee already exists for ${user.email} — linking`);
      }

      // Link user → employee
      await User.findByIdAndUpdate(user._id, { employeeId: emp._id });
      // Link employee → user
      if (!emp.userId) {
        await Employee.findByIdAndUpdate(emp._id, { userId: user._id });
      }

      console.log(`🔗 Linked user ${user.email} ↔ employee ${emp.employeeId}`);
    } catch (err) {
      console.error(`❌ Failed for ${user.email}:`, err.message);
    }
  }

  console.log('\n✅ Migration complete');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });