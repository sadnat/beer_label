import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured } from './emailService';
import { UserRole } from '../middleware/auth';

const SALT_ROUNDS = 12;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: Date | null;
  verification_token: string | null;
  verification_token_expires: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  email_verified: boolean;
  role: UserRole;
  created_at: Date;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string, email: string, role: UserRole): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign({ userId, email, role }, secret, options);
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if email should be auto-promoted to admin
const shouldBeAdmin = (email: string): boolean => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
};

export const createUser = async (
  email: string,
  password: string
): Promise<{ user: UserPublic; verificationSent: boolean }> => {
  const passwordHash = await hashPassword(password);
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // If email is not configured, set email as verified immediately
  const emailVerified = !isEmailConfigured();

  // Check if this email should be auto-promoted to admin
  const role: UserRole = shouldBeAdmin(email) ? 'admin' : 'user';

  const result = await query(
    `INSERT INTO users (email, password_hash, email_verified, role, verification_token, verification_token_expires)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, email_verified, role, created_at`,
    [email.toLowerCase(), passwordHash, emailVerified, role, emailVerified ? null : verificationToken, emailVerified ? null : verificationExpires]
  );

  const user = result.rows[0];

  // Send verification email if SMTP is configured
  let verificationSent = false;
  if (!emailVerified) {
    verificationSent = await sendVerificationEmail(email, verificationToken);
  }

  return { user, verificationSent };
};

export const verifyEmail = async (token: string): Promise<UserPublic | null> => {
  const result = await query(
    `UPDATE users
     SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
     WHERE verification_token = $1 AND verification_token_expires > NOW()
     RETURNING id, email, email_verified, role, created_at`,
    [token]
  );

  return result.rows[0] || null;
};

export const resendVerificationEmail = async (email: string): Promise<boolean> => {
  const user = await findUserByEmail(email);
  if (!user || user.email_verified) {
    return false;
  }

  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await query(
    `UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3`,
    [verificationToken, verificationExpires, user.id]
  );

  return await sendVerificationEmail(email, verificationToken);
};

export const requestPasswordReset = async (email: string): Promise<boolean> => {
  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if user exists
    return true;
  }

  const resetToken = generateVerificationToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
    [resetToken, resetExpires, user.id]
  );

  return await sendPasswordResetEmail(email, resetToken);
};

export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  const passwordHash = await hashPassword(newPassword);

  const result = await query(
    `UPDATE users
     SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
     WHERE password_reset_token = $2 AND password_reset_expires > NOW()
     RETURNING id`,
    [passwordHash, token]
  );

  return result.rowCount !== null && result.rowCount > 0;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<UserPublic | null> => {
  const result = await query(
    'SELECT id, email, email_verified, role, created_at FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  // Projects are deleted automatically via CASCADE
  const result = await query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  // Get user with password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  const user = result.rows[0];

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) {
    return { success: false, error: 'Mot de passe actuel incorrect' };
  }

  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { success: true };
};

// Login helper that checks ban status and returns role
export const validateLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserPublic; error?: string; requiresVerification?: boolean }> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return { success: false, error: 'Email ou mot de passe incorrect' };
  }

  // Check if banned
  if (user.is_banned) {
    return {
      success: false,
      error: user.ban_reason || 'Votre compte a été suspendu.',
    };
  }

  // Verify password
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    return { success: false, error: 'Email ou mot de passe incorrect' };
  }

  // Check email verification
  if (!user.email_verified) {
    return {
      success: false,
      requiresVerification: true,
      error: 'Veuillez vérifier votre email avant de vous connecter.',
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      role: user.role,
      created_at: user.created_at,
    },
  };
};
