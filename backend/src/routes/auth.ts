import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimit';

const router = Router();

// Normalize email options - don't remove dots from Gmail
const normalizeEmailOptions = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Veuillez fournir un email valide')
      .normalizeEmail(normalizeEmailOptions),
    body('password')
      .isLength({ min: 10 })
      .withMessage('Le mot de passe doit contenir au moins 10 caractères')
      .matches(/[A-Z]/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule')
      .matches(/[0-9]/)
      .withMessage('Le mot de passe doit contenir au moins un chiffre')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Veuillez fournir un email valide')
      .normalizeEmail(normalizeEmailOptions),
    body('password')
      .notEmpty()
      .withMessage('Le mot de passe est requis'),
  ],
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.me);

// POST /api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

// DELETE /api/auth/account - Delete user account
router.delete('/account', authenticateToken, authController.deleteAccount);

// PUT /api/auth/password - Change password
router.put(
  '/password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Le mot de passe actuel est requis'),
    body('newPassword')
      .isLength({ min: 10 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 10 caractères')
      .matches(/[A-Z]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule')
      .matches(/[0-9]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins un chiffre')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins un caractère spécial'),
  ],
  authController.changePassword
);

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authController.resendVerification);

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('password')
      .isLength({ min: 10 })
      .withMessage('Le mot de passe doit contenir au moins 10 caractères')
      .matches(/[A-Z]/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule')
      .matches(/[0-9]/)
      .withMessage('Le mot de passe doit contenir au moins un chiffre')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  ],
  authController.resetPassword
);

export default router;
