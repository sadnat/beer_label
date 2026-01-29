import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateVerificationToken,
  createUser,
  verifyEmail,
  findUserByEmail,
  findUserById,
  deleteUser,
  changePassword,
  validateLogin,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} from '../authService';
import {
  mockQueryResponse,
  mockUser,
  mockUnverifiedUser,
  mockBannedUser,
  setupDatabaseMock,
} from '../../test/mocks/database';
import { TEST_JWT_SECRET, KNOWN_PASSWORD, KNOWN_PASSWORD_HASH } from '../../test/helpers';

// Mock bcrypt for faster tests
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('authService', () => {
  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = setupDatabaseMock();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword('password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(result).toBe(hashedPassword);
    });

    it('should use SALT_ROUNDS of 12', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await hashPassword('test');

      expect(bcrypt.hash).toHaveBeenCalledWith('test', 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword('password123', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hash');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword('wrong', 'hash');

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user-id', 'test@example.com', 'user');

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user info in token payload', () => {
      const token = generateToken('user-id', 'test@example.com', 'admin');
      const decoded = jwt.verify(token, TEST_JWT_SECRET) as { userId: string; email: string; role: string };

      expect(decoded.userId).toBe('user-id');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('admin');
    });

    it('should throw error if JWT_SECRET is not defined', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => generateToken('id', 'email', 'user')).toThrow('JWT_SECRET is not defined');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a random hex string', () => {
      const token = generateVerificationToken();

      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('should create a new user', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: 'new-user-id',
        email: 'new@example.com',
        email_verified: true,
        role: 'user',
        created_at: new Date(),
      }]));

      const result = await createUser('new@example.com', 'password123');

      expect(queryMock).toHaveBeenCalled();
      expect(result.user.email).toBe('new@example.com');
    });

    it('should normalize email to lowercase', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: 'id',
        email: 'test@example.com',
        email_verified: true,
        role: 'user',
        created_at: new Date(),
      }]));

      await createUser('TEST@EXAMPLE.COM', 'password');

      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test@example.com'])
      );
    });

    it('should set email_verified to true when SMTP not configured', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: 'id',
        email: 'test@example.com',
        email_verified: true,
        role: 'user',
        created_at: new Date(),
      }]));

      const result = await createUser('test@example.com', 'password');

      expect(result.verificationSent).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: mockUnverifiedUser.id,
        email: mockUnverifiedUser.email,
        email_verified: true,
        role: 'user',
        created_at: new Date(),
      }]));

      const result = await verifyEmail('valid-token');

      expect(result).not.toBeNull();
      expect(result?.email_verified).toBe(true);
    });

    it('should return null for invalid or expired token', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await verifyEmail('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockUser]));

      const result = await findUserByEmail('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe(mockUser.email);
    });

    it('should normalize email to lowercase', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockUser]));

      await findUserByEmail('TEST@EXAMPLE.COM');

      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        ['test@example.com']
      );
    });

    it('should return null if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{
        id: mockUser.id,
        email: mockUser.email,
        email_verified: mockUser.email_verified,
        role: mockUser.role,
        created_at: mockUser.created_at,
      }]));

      const result = await findUserById(mockUser.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockUser.id);
    });

    it('should return null if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await findUserById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 1));

      const result = await deleteUser(mockUser.id);

      expect(result).toBe(true);
      expect(queryMock).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        [mockUser.id]
      );
    });

    it('should return false if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 0));

      const result = await deleteUser('nonexistent-id');

      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ password_hash: KNOWN_PASSWORD_HASH }]))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      const result = await changePassword(mockUser.id, KNOWN_PASSWORD, 'newPassword123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await changePassword('nonexistent', 'old', 'new');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Utilisateur non trouvé');
    });

    it('should fail if current password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      queryMock.mockResolvedValue(mockQueryResponse([{ password_hash: KNOWN_PASSWORD_HASH }]));

      const result = await changePassword(mockUser.id, 'wrongPassword', 'newPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mot de passe actuel incorrect');
    });
  });

  describe('validateLogin', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should validate login successfully', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockUser]));

      const result = await validateLogin('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(mockUser.email);
    });

    it('should fail if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await validateLogin('notfound@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email ou mot de passe incorrect');
    });

    it('should fail if user is banned', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockBannedUser]));

      const result = await validateLogin('banned@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockBannedUser.ban_reason);
    });

    it('should fail if password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      queryMock.mockResolvedValue(mockQueryResponse([mockUser]));

      const result = await validateLogin('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email ou mot de passe incorrect');
    });

    it('should require email verification', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockUnverifiedUser]));

      const result = await validateLogin('unverified@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.error).toContain('vérifier votre email');
    });

    it('should return user role in successful login', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      queryMock.mockResolvedValue(mockQueryResponse([adminUser]));

      const result = await validateLogin('admin@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('admin');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should return false if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await resendVerificationEmail('notfound@example.com');

      expect(result).toBe(false);
    });

    it('should return false if user already verified', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockUser]));

      const result = await resendVerificationEmail('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('should return true even if user not found (security)', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await requestPasswordReset('notfound@example.com');

      expect(result).toBe(true);
    });

    it('should update reset token for existing user', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([mockUser]))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      await requestPasswordReset('test@example.com');

      expect(queryMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    });

    it('should reset password with valid token', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{ id: mockUser.id }], 1));

      const result = await resetPassword('valid-token', 'newPassword123');

      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 0));

      const result = await resetPassword('invalid-token', 'newPassword');

      expect(result).toBe(false);
    });
  });
});
