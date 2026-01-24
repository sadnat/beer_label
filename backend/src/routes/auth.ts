import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

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
  [
    body('email')
      .isEmail()
      .withMessage('Veuillez fournir un email valide')
      .normalizeEmail(normalizeEmailOptions),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
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

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authController.resendVerification);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  ],
  authController.resetPassword
);

export default router;
