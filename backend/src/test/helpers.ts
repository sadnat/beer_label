import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../middleware/auth';

// ============================================
// Test Constants
// ============================================
export const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-only';

// ============================================
// Token Generation Helpers
// ============================================

/**
 * Generate a valid JWT token for testing
 */
export const generateTestToken = (
  userId: string,
  email: string,
  role: UserRole = 'user'
): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign({ userId, email, role }, TEST_JWT_SECRET, options);
};

/**
 * Generate an expired JWT token for testing
 */
export const generateExpiredToken = (
  userId: string = '550e8400-e29b-41d4-a716-446655440001',
  email: string = 'test@example.com',
  role: UserRole = 'user'
): string => {
  const options: SignOptions = {
    expiresIn: '-1s', // Already expired
  };

  return jwt.sign({ userId, email, role }, TEST_JWT_SECRET, options);
};

/**
 * Generate a token signed with a different secret (invalid)
 */
export const generateInvalidToken = (
  userId: string = '550e8400-e29b-41d4-a716-446655440001',
  email: string = 'test@example.com',
  role: UserRole = 'user'
): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign({ userId, email, role }, 'wrong-secret', options);
};

/**
 * Generate a malformed token
 */
export const generateMalformedToken = (): string => {
  return 'not.a.valid.jwt.token';
};

// ============================================
// Request Mock Helpers
// ============================================

/**
 * Create a mock Express request object
 */
export const createMockRequest = (overrides: Record<string, unknown> = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  user: undefined,
  ip: '127.0.0.1',
  ...overrides,
});

/**
 * Create a mock Express response object
 */
export const createMockResponse = () => {
  const res: Record<string, unknown> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res as {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
    end: jest.Mock;
    setHeader: jest.Mock;
  };
};

/**
 * Create a mock Express next function
 */
export const createMockNext = () => jest.fn();

// ============================================
// Test Data Helpers
// ============================================

/**
 * Generate a random UUID for testing
 */
export const generateTestUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate a random email for testing
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${random}@example.com`;
};

/**
 * Wait for a specified number of milliseconds
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Check if a string is a valid UUID
 */
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Check if a string is a valid JWT
 */
export const isValidJWT = (str: string): boolean => {
  const parts = str.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

// ============================================
// Password Helpers
// ============================================

/**
 * A known password and its bcrypt hash for testing
 * Password: 'password123'
 */
export const KNOWN_PASSWORD = 'password123';
export const KNOWN_PASSWORD_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5FerJDYf/1KZm';

// ============================================
// Date Helpers
// ============================================

/**
 * Create a date in the past
 */
export const pastDate = (daysAgo: number = 1): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

/**
 * Create a date in the future
 */
export const futureDate = (daysAhead: number = 1): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
};

// ============================================
// IP Address Helpers
// ============================================
export const TEST_IP_ADDRESS = '127.0.0.1';
export const TEST_IP_V6 = '::1';
