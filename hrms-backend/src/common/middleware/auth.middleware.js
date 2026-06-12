
const jwt = require('jsonwebtoken');
const User = require('../../auth/user.model');
 
// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
 
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    const user = await User.findOne({
      _id: decoded.userId,
      tenantId: decoded.tenantId,
      isActive: true
    }).select('-password -refreshToken');
 
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
 
    // Attach user and tenantId to every request
    req.user = user;
    req.tenantId = user.tenantId; // CRITICAL: enforce tenant isolation
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
 
// Role-based access control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};
 
// Tenant isolation guard - ensures all queries are scoped
const tenantScope = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({ success: false, message: 'Tenant context missing' });
  }
  next();
};
 
module.exports = { authenticate, authorize, tenantScope };
