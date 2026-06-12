const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: String, required: true }, // auto-generated e.g. EMP001

  // Personal
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
  nationality: String,
  photo: String, // S3/local path

  // Contact
  personalEmail: String,
  officialEmail: { type: String, required: true },
  phone: String,
  alternatePhone: String,
  currentAddress: {
    street: String, city: String, state: String, country: String, pincode: String
  },
  permanentAddress: {
    street: String, city: String, state: String, country: String, pincode: String
  },
  emergencyContact: {
    name: String, relation: String, phone: String
  },

  // Employment
  dateOfJoining: { type: Date, required: true },
  confirmationDate: Date,
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern', 'probation'],
    default: 'full_time'
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  grade: String,
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Bank & Statutory
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountType: String,
  },
  pan: String,
  aadhaar: String,
  uan: String, // Universal Account Number (PF)
  esic: String,
  pfNumber: String,

  // Professional background
  education: [{
    degree: String, institution: String, year: Number, percentage: String
  }],
  previousExperience: [{
    company: String, role: String, fromDate: Date, toDate: Date, description: String
  }],
  skills: [String],
  certifications: [{
    name: String, issuer: String, issueDate: Date, expiryDate: Date, certificateUrl: String
  }],

  // Documents
  documents: [{
    type: String, // 'offer_letter', 'contract', 'id_proof', 'certificate', etc.
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],

  // Lifecycle
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated', 'absconded'],
    default: 'active'
  },
  exitDate: Date,
  exitReason: String,
  exitType: { type: String, enum: ['resignation', 'termination', 'retirement', 'absconding'] },
  noticePeriodDays: Number,

  // Metadata
  isDeleted: { type: Boolean, default: false }, // soft delete
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

// Compound unique indexes
employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, officialEmail: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, department: 1 });
employeeSchema.index({ tenantId: 1, status: 1 });

// Virtual: full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);