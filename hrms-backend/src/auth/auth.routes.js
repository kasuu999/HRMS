const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../common/middleware/auth.middleware');

router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;