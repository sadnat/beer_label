/* eslint-disable @typescript-eslint/no-var-requires */

// ============================================
// Environment Variables for Tests
// ============================================
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SMTP_HOST = '';
process.env.SMTP_PORT = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.APP_URL = 'http://localhost:5173';

// ============================================
// Database Mock
// ============================================
jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  },
}));

// ============================================
// Email Service Mock
// ============================================
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve(true)),
  isEmailConfigured: jest.fn(() => false),
}));

// ============================================
// Console Suppression (optional for cleaner test output)
// ============================================
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Suppress specific log messages during tests
beforeAll(() => {
  console.error = jest.fn((...args: unknown[]) => {
    const message = args[0];
    // Allow certain errors through for debugging
    if (typeof message === 'string' && message.includes('CRITICAL')) {
      originalConsoleError.apply(console, args);
    }
  });

  // Suppress general logging during tests
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// ============================================
// Global Test Cleanup
// ============================================
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ============================================
// Global Test Timeout
// ============================================
jest.setTimeout(10000);
