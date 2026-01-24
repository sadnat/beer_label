import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { AuthRequest } from '../middleware/auth';

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
      res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
      return;
    }

    // Create user
    const { user, verificationSent } = await authService.createUser(email, password);

    // Generate token with role
    const token = authService.generateToken(user.id, user.email, user.role);

    // Response based on whether email verification is required
    if (user.email_verified) {
      // No email verification required (SMTP not configured)
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
        },
        token,
        message: 'Compte créé avec succès',
      });
    } else {
      // Email verification required - DON'T return token
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
        },
        // No token - user must verify email first
        message: verificationSent
          ? 'Compte créé. Veuillez vérifier votre email pour activer votre compte.'
          : 'Compte créé mais l\'envoi de l\'email de vérification a échoué.',
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

    // Generate token with role
    const token = authService.generateToken(user.id, user.email, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        role: user.role,
      },
      token,
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

export const logout = async (_req: Request, res: Response): Promise<void> => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for API consistency
  res.json({ message: 'Déconnexion réussie' });
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

    const deleted = await authService.deleteUser(req.user.userId);

    if (!deleted) {
      res.status(404).json({ error: 'Compte non trouvé' });
      return;
    }

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

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};
