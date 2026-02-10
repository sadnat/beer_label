import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { AuthRequest } from '../middleware/auth';

// Cookie configuration
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/auth/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Helper to set auth cookies
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);
};

// Helper to clear auth cookies
const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/api/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth/' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      // Return identical response to prevent email enumeration
      res.status(201).json({
        message: 'Si cette adresse est disponible, un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.',
        requiresVerification: true,
      });
      return;
    }

    // Create user
    const { user, verificationSent } = await authService.createUser(email, password);

    // Response based on whether email verification is required
    if (user.email_verified) {
      // No email verification required (SMTP not configured)
      // Set auth cookies
      const accessToken = authService.generateAccessToken(user.id, user.email, user.role);
      const { token: refreshToken } = await authService.generateRefreshToken(user.id);
      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
        },
        message: 'Compte créé avec succès',
      });
    } else {
      // Email verification required - DON'T set cookies
      // Use a generic message to prevent email enumeration
      res.status(201).json({
        message: 'Si cette adresse est disponible, un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.',
        requiresVerification: true,
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    // Use validateLogin which checks ban status, password, and email verification
    const result = await authService.validateLogin(email, password);

    if (!result.success) {
      if (result.requiresVerification) {
        res.status(403).json({
          error: result.error,
          requiresVerification: true,
          email: email,
        });
      } else {
        res.status(401).json({ error: result.error });
      }
      return;
    }

    const user = result.user!;

    // Generate tokens and set cookies
    const accessToken = authService.generateAccessToken(user.id, user.email, user.role);
    const { token: refreshToken } = await authService.generateRefreshToken(user.id);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const user = await authService.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Revoke the refresh token from DB
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    clearAuthCookies(res);

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    // Clear cookies even on error
    clearAuthCookies(res);
    res.json({ message: 'Déconnexion réussie' });
  }
};

// Refresh access token using refresh token cookie
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token manquant' });
      return;
    }

    // Validate the refresh token
    const user = await authService.validateRefreshToken(refreshToken);

    if (!user) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Refresh token invalide ou expiré' });
      return;
    }

    // Generate new access token
    const newAccessToken = authService.generateAccessToken(user.id, user.email, user.role);

    // Set the new access token cookie
    res.cookie(ACCESS_TOKEN_COOKIE, newAccessToken, accessTokenCookieOptions);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    clearAuthCookies(res);
    res.status(401).json({ error: 'Erreur lors du rafraîchissement du token' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token de vérification requis' });
    return;
  }

  try {
    const user = await authService.verifyEmail(token);

    if (!user) {
      res.status(400).json({ error: 'Token invalide ou expiré' });
      return;
    }

    res.json({
      message: 'Email vérifié avec succès',
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email requis' });
    return;
  }

  try {
    const sent = await authService.resendVerificationEmail(email);

    // Always return success to prevent email enumeration
    res.json({
      message: sent
        ? 'Email de vérification envoyé'
        : 'Si un compte existe avec cet email, un email de vérification a été envoyé',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email requis' });
    return;
  }

  try {
    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { token, password } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token de réinitialisation requis' });
    return;
  }

  try {
    const success = await authService.resetPassword(token, password);

    if (!success) {
      res.status(400).json({ error: 'Token invalide ou expiré' });
      return;
    }

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    // Revoke all refresh tokens before deleting
    await authService.revokeAllRefreshTokens(req.user.userId);

    const deleted = await authService.deleteUser(req.user.userId);

    if (!deleted) {
      res.status(404).json({ error: 'Compte non trouvé' });
      return;
    }

    // Clear cookies
    clearAuthCookies(res);

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Generate new tokens after password change (old refresh tokens are revoked in authService)
    const accessToken = authService.generateAccessToken(req.user.userId, req.user.email, req.user.role);
    const { token: refreshToken } = await authService.generateRefreshToken(req.user.userId);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};
