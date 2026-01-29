import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth';
import {
  mockQueryResponse,
  mockUser,
  mockAdminUser,
  mockBannedUser,
  setupDatabaseMock,
} from '../../test/mocks/database';
import {
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  generateMalformedToken,
  createMockRequest,
  createMockResponse,
  createMockNext,
} from '../../test/helpers';

describe('auth middleware', () => {
  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = setupDatabaseMock();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should pass valid token and set user on request', async () => {
      const token = generateTestToken(mockUser.id, mockUser.email, 'user');
      queryMock.mockResolvedValue(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(mockUser.id);
      expect(req.user?.email).toBe(mockUser.email);
      expect(req.user?.role).toBe('user');
    });

    it('should return 401 if no token provided', async () => {
      const req = createMockRequest({
        headers: {},
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token d'authentification requis" });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is malformed', async () => {
      const req = createMockRequest({
        headers: { authorization: 'InvalidFormat' },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is expired', async () => {
      const expiredToken = generateExpiredToken();

      const req = createMockRequest({
        headers: { authorization: `Bearer ${expiredToken}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide ou expiré' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if token is signed with wrong secret', async () => {
      const invalidToken = generateInvalidToken();

      const req = createMockRequest({
        headers: { authorization: `Bearer ${invalidToken}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide ou expiré' });
    });

    it('should return 403 if token is malformed', async () => {
      const malformedToken = generateMalformedToken();

      const req = createMockRequest({
        headers: { authorization: `Bearer ${malformedToken}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 401 if user not found in database', async () => {
      const token = generateTestToken('nonexistent-id', 'ghost@example.com', 'user');
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Utilisateur non trouvé' });
    });

    it('should return 403 if user is banned', async () => {
      const token = generateTestToken(mockBannedUser.id, mockBannedUser.email, 'user');
      queryMock.mockResolvedValue(mockQueryResponse([{
        is_banned: true,
        ban_reason: mockBannedUser.ban_reason,
      }]));

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Compte suspendu',
        reason: mockBannedUser.ban_reason,
      });
    });

    it('should return default ban message if no reason provided', async () => {
      const token = generateTestToken(mockBannedUser.id, mockBannedUser.email, 'user');
      queryMock.mockResolvedValue(mockQueryResponse([{
        is_banned: true,
        ban_reason: null,
      }]));

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Compte suspendu',
        reason: 'Votre compte a été suspendu.',
      });
    });

    it('should handle admin tokens correctly', async () => {
      const token = generateTestToken(mockAdminUser.id, mockAdminUser.email, 'admin');
      queryMock.mockResolvedValue(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(req.user?.role).toBe('admin');
    });
  });

  describe('requireAdmin', () => {
    it('should pass if user has admin role', () => {
      const req = createMockRequest({
        user: { userId: mockAdminUser.id, email: mockAdminUser.email, role: 'admin' },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no user on request', () => {
      const req = createMockRequest({}) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentification requise' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
      const req = createMockRequest({
        user: { userId: mockUser.id, email: mockUser.email, role: 'user' },
      }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res as unknown as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Accès réservé aux administrateurs' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should not modify request object', () => {
      const userPayload = { userId: mockAdminUser.id, email: mockAdminUser.email, role: 'admin' as const };
      const req = createMockRequest({ user: userPayload }) as AuthRequest;
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res as unknown as Response, next as NextFunction);

      expect(req.user).toEqual(userPayload);
    });
  });
});
