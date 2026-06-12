const mongoose = require('mongoose');

// Department
const departmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: String,
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Designation
const designationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true, trim: true },
  level: Number, // seniority level
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
designationSchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Location
const locationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true, trim: true },
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  pincode: String,
  timezone: { type: String, default: 'Asia/Kolkata' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  Department: mongoose.model('Department', departmentSchema),
  Designation: mongoose.model('Designation', designationSchema),
  Location: mongoose.model('Location', locationSchema),
};