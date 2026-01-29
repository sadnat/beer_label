import express, { Express } from 'express';
import request from 'supertest';
import authRoutes from '../auth';
import { mockQueryResponse, mockUser, mockUnverifiedUser, mockBannedUser, setupDatabaseMock } from '../../test/mocks/database';
import { generateTestToken, KNOWN_PASSWORD_HASH } from '../../test/helpers';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock email service
jest.mock('../../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  isEmailConfigured: jest.fn().mockReturnValue(false),
}));

describe('Auth Routes Integration', () => {
  let app: Express;
  let queryMock: jest.Mock;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock = setupDatabaseMock();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // 1. findUserByEmail returns empty (user doesn't exist)
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));
      // 2. createUser INSERT returns new user
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        id: 'new-user-id',
        email: 'new@example.com',
        email_verified: true,
        role: 'user',
        created_at: new Date(),
      }]));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('new@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // findUserByEmail returns existing user
      queryMock.mockResolvedValueOnce(mockQueryResponse([mockUser]));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('existe déjà');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // validateLogin calls findUserByEmail
      queryMock.mockResolvedValue(mockQueryResponse([{
        ...mockUser,
        password_hash: KNOWN_PASSWORD_HASH,
      }]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValueOnce(false);

      queryMock.mockResolvedValue(mockQueryResponse([{
        ...mockUser,
        password_hash: KNOWN_PASSWORD_HASH,
      }]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'password123' });

      expect(response.status).toBe(401);
    });

    it('should return 403 with verification required for unverified email', async () => {
      // validateLogin returns user with email_verified = false
      queryMock.mockResolvedValue(mockQueryResponse([{
        ...mockUnverifiedUser,
        password_hash: KNOWN_PASSWORD_HASH,
      }]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unverified@example.com', password: 'password123' });

      // Controller returns 403 for requiresVerification
      expect(response.status).toBe(403);
      expect(response.body.requiresVerification).toBe(true);
    });

    it('should return 401 for banned user', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        ...mockBannedUser,
        password_hash: KNOWN_PASSWORD_HASH,
      }]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'banned@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(mockBannedUser.ban_reason);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');

      // 1. Auth middleware: check if user is banned
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. findUserById
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        id: mockUser.id,
        email: mockUser.email,
        email_verified: true,
        role: 'user',
        created_at: mockUser.created_at,
      }]));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');
      queryMock.mockResolvedValue(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // verifyEmail UPDATE query
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: mockUser.id,
        email: mockUser.email,
        email_verified: true,
        role: 'user',
        created_at: mockUser.created_at,
      }]));

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-verification-token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 400 for invalid token', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email', async () => {
      // 1. findUserByEmail
      queryMock.mockResolvedValueOnce(mockQueryResponse([mockUnverifiedUser]));
      // 2. UPDATE verification token
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'unverified@example.com' });

      expect(response.status).toBe(200);
    });

    it('should return 200 even for non-existent user (security)', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'notfound@example.com' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should delete user account', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');

      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. deleteUser
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');

      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. changePassword: get password_hash
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ password_hash: KNOWN_PASSWORD_HASH }]));
      // 3. changePassword: UPDATE password
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'password123', newPassword: 'newPassword456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for incorrect current password', async () => {
      const bcrypt = require('bcrypt');
      // Auth middleware doesn't use bcrypt, only changePassword does
      // Set bcrypt.compare to return false for the password verification
      bcrypt.compare.mockResolvedValueOnce(false);

      const token = generateTestToken(mockUser.id, mockUser.email, 'user');

      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. changePassword: get password_hash
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ password_hash: KNOWN_PASSWORD_HASH }]));

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newPassword456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('incorrect');
    });

    it('should return 400 for short new password', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');
      queryMock.mockResolvedValue(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'password123', newPassword: 'short' });

      expect(response.status).toBe(400);
    });
  });
});
