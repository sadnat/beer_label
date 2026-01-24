import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured } from './emailService';

const SALT_ROUNDS = 12;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
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

export const generateToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign({ userId, email }, secret, options);
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
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

  const result = await query(
    `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_token_expires)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, email_verified, created_at`,
    [email.toLowerCase(), passwordHash, emailVerified, emailVerified ? null : verificationToken, emailVerified ? null : verificationExpires]
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
     RETURNING id, email, email_verified, created_at`,
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
    'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
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
