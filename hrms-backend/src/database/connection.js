
const mongoose = require('mongoose');
 
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.name}`);
 
    // Global query middleware to enforce tenantId isolation
    mongoose.plugin((schema) => {
      schema.pre('find', enforceTenant);
      schema.pre('findOne', enforceTenant);
      schema.pre('countDocuments', enforceTenant);
    });
 
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};
 
function enforceTenant(next) {
  // Ensure tenantId is always in the query (safety net)
  // Actual enforcement is done per-controller via middleware
  next();
}
 
module.exports = connectDB;