const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user.model');
const Tenant = require('./tenant.model');
const AuditLog = require('./auditLog.model');

// Generate tokens
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

// Helper: log audit
const audit = async (tenantId, userId, action, module, req, extra = {}) => {
  try {
    await AuditLog.create({
      tenantId, userId, action, module,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      ...extra
    });
  } catch (e) { /* non-blocking */ }
};

// @POST /api/auth/register-tenant — Create new tenant + admin user
exports.registerTenant = async (req, res) => {
  try {
    const { companyName, adminEmail, adminPassword, adminName } = req.body;

    // Check if tenant slug already exists
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(409).json({ success: false, message: 'Company already registered' });
    }

    // Create tenant
    const tenant = await Tenant.create({
      name: companyName,
      slug,
      adminEmail,
    });

    // Create admin user
    const user = await User.create({
      tenantId: tenant._id,
      email: adminEmail,
      password: adminPassword,
      role: 'hr_admin',
    });

    const { accessToken, refreshToken } = generateTokens(user._id, tenant._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    await audit(tenant._id, user._id, 'REGISTER_TENANT', 'auth', req, { status: 'success' });

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug },
        user: { id: user._id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;

    // Find tenant
    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Find user
    const user = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() })
      .select('+password +refreshToken +failedLoginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account lock
    if (user.isLocked) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await audit(tenant._id, user._id, 'LOGIN_BLOCKED', 'auth', req, { status: 'failure' });
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${remaining} minutes.`
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await audit(tenant._id, user._id, 'LOGIN_FAILED', 'auth', req, { status: 'failure' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Reset failed attempts
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
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          tenantId: tenant._id,
          tenantName: tenant.name,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.userId, tenantId: decoded.tenantId })
      .select('+refreshToken');

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

// @POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    await audit(req.tenantId, req.user._id, 'LOGOUT', 'auth', req);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, tenantSlug } = req.body;
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) return res.status(404).json({ success: false, message: 'Organization not found' });

    const user = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    // TODO: Send email with reset link
    // await sendResetEmail(email, resetToken, tenant.slug);

    await audit(tenant._id, user._id, 'FORGOT_PASSWORD', 'auth', req);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};