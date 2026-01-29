import express, { Express } from 'express';
import request from 'supertest';
import adminRoutes from '../admin';
import {
  mockQueryResponse,
  mockUser,
  mockAdminUser,
  mockPlan,
  mockFreePlan,
  mockSubscription,
  mockAuditLogEntry,
  setupDatabaseMock,
} from '../../test/mocks/database';
import { generateTestToken } from '../../test/helpers';

describe('Admin Routes Integration', () => {
  let app: Express;
  let queryMock: jest.Mock;
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    adminToken = generateTestToken(mockAdminUser.id, mockAdminUser.email, 'admin');
    userToken = generateTestToken(mockUser.id, mockUser.email, 'user');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock = setupDatabaseMock();
  });

  describe('Access Control', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/admin/stats');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return global statistics', async () => {
      // 1. Auth middleware check
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2-6. Stats queries from getGlobalStats
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ total: '100', active: '90', banned: '10' }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ total: '500' }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ plan: 'Free', count: '50' }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ date: new Date(), count: '5' }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ count: '20' }]));

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalUsers).toBe(100);
      expect(response.body.stats.totalProjects).toBe(500);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users list', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Count query
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ total: '50' }]));
      // 3. Users query
      queryMock.mockResolvedValueOnce(mockQueryResponse([
        { ...mockUser, projects_count: '5', plan_name: 'Free' },
      ]));

      const response = await request(app)
        .get('/api/admin/users?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.total).toBe(50);
      expect(response.body.pages).toBe(3);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. User query
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ ...mockUser, plan_name: 'Pro' }]));
      // 3. Projects query
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));
      // 4. Subscription query
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        id: mockSubscription.id,
        plan_id: mockPlan.id,
        plan_name: 'Pro',
        status: 'active',
        current_period_start: new Date(),
        current_period_end: null,
      }]));

      const response = await request(app)
        .get(`/api/admin/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(mockUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));

      const response = await request(app)
        .get('/api/admin/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should change user role', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get current role
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ role: 'user', email: mockUser.email }]));
      // 3. Update role
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id }], 1));
      // 4. Audit log
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .put(`/api/admin/users/${mockUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid role', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .put(`/api/admin/users/${mockUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    it('should ban user', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Ban user UPDATE
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id, email: mockUser.email }], 1));
      // 3. Audit log
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .post(`/api/admin/users/${mockUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Violation des règles' });

      expect(response.status).toBe(200);
    });

    it('should return 404 when trying to ban admin (service level rejection)', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Ban user UPDATE returns 0 rows (WHERE role != 'admin' prevents update)
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 0));

      const response = await request(app)
        .post(`/api/admin/users/${mockUser.id}/ban`)  // Use non-admin user ID
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // When banUser returns false (rowCount === 0), controller returns 404
      expect(response.status).toBe(404);
    });

    it('should return 400 when trying to ban self', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post(`/api/admin/users/${mockAdminUser.id}/ban`)  // Try to ban self
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Controller checks for self-ban before calling service
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('vous-même');
    });
  });

  describe('DELETE /api/admin/users/:id/ban', () => {
    it('should unban user', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Unban user UPDATE
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id, email: mockUser.email }], 1));
      // 3. Audit log
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .delete(`/api/admin/users/${mockUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get user info (email, role)
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ email: mockUser.email, role: 'user' }]));
      // 3. DELETE user
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id }], 1));
      // 4. Audit log
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .delete(`/api/admin/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should not delete admin user', async () => {
      const otherAdminId = '660e8400-e29b-41d4-a716-446655440099';
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get user info (returns admin role - service rejects deleting admins)
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ email: 'other-admin@example.com', role: 'admin' }]));

      const response = await request(app)
        .delete(`/api/admin/users/${otherAdminId}`)  // Use different admin ID
        .set('Authorization', `Bearer ${adminToken}`);

      // Service returns false for admin users, controller returns 404
      expect(response.status).toBe(404);
    });

    it('should return 400 when trying to delete self', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .delete(`/api/admin/users/${mockAdminUser.id}`)  // Try to delete self
        .set('Authorization', `Bearer ${adminToken}`);

      // Controller checks for self-deletion before calling service
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('propre compte');
    });
  });

  describe('PUT /api/admin/users/:id/plan', () => {
    it('should change user plan', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get current subscription
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ id: mockSubscription.id, plan_name: 'Free' }]));
      // 3. Get new plan name
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ name: 'Pro' }]));
      // 4. Get user email
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ email: mockUser.email }]));
      // 5. Upsert subscription
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));
      // 6. Audit log
      queryMock.mockResolvedValueOnce(mockQueryResponse([], 1));

      const response = await request(app)
        .put(`/api/admin/users/${mockUser.id}/plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: mockPlan.id });

      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid plan ID', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .put(`/api/admin/users/${mockUser.id}/plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: 'not-a-uuid' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent plan', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get current subscription (empty)
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));
      // 3. Get new plan (empty - not found)
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));

      const response = await request(app)
        .put(`/api/admin/users/${mockUser.id}/plan`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: '770e8400-e29b-41d4-a716-446655440099' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/plans', () => {
    it('should return all plans', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Get plans
      queryMock.mockResolvedValueOnce(mockQueryResponse([mockFreePlan, mockPlan]));

      const response = await request(app)
        .get('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.plans).toHaveLength(2);
    });
  });

  describe('POST /api/admin/plans', () => {
    const validPlanData = {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Enterprise plan',
      price_monthly: 99.99,
      max_projects: 100,
      max_exports_per_month: 500,
      features: ['All features', 'Priority support'],
    };

    it('should create new plan', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Insert plan
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        id: 'new-plan-id',
        ...validPlanData,
        is_active: true,
        created_at: new Date(),
      }]));

      const response = await request(app)
        .post('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPlanData);

      expect(response.status).toBe(201);
      expect(response.body.plan.name).toBe('Enterprise');
    });

    it('should return 400 for missing required fields', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid slug format', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/admin/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validPlanData,
          slug: 'Invalid Slug!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/plans/:id', () => {
    it('should update plan', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Update plan
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        ...mockPlan,
        name: 'Pro Plus',
        price_monthly: 14.99,
      }]));

      const response = await request(app)
        .put(`/api/admin/plans/${mockPlan.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Pro Plus', price_monthly: 14.99 });

      expect(response.status).toBe(200);
      expect(response.body.plan.name).toBe('Pro Plus');
    });

    it('should return 404 for non-existent plan', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Update plan returns empty (not found)
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));

      const response = await request(app)
        .put('/api/admin/plans/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/audit-log', () => {
    it('should return paginated audit log', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Count query (returns number as string from pg)
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ total: 100 }]));
      // 3. Entries query with JOIN to users for admin_email
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        ...mockAuditLogEntry,
        admin_email: mockAdminUser.email,
      }]));

      const response = await request(app)
        .get('/api/admin/audit-log?page=1&limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toBeDefined();
      expect(response.body.total).toBe(100);
      expect(response.body.pages).toBe(2);
    });

    it('should handle filters', async () => {
      // 1. Auth middleware
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // 2. Count query with filters
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ total: 10 }]));
      // 3. Entries query with filters
      queryMock.mockResolvedValueOnce(mockQueryResponse([{
        id: 'audit-1',
        admin_id: mockAdminUser.id,
        admin_email: mockAdminUser.email,
        action: 'ban_user',
        target_type: 'user',
        target_id: mockUser.id,
        details: { reason: 'Test' },
        ip_address: '127.0.0.1',
        created_at: new Date(),
      }]));

      const response = await request(app)
        .get('/api/admin/audit-log?action=ban_user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(response.body.total).toBe(10);
    });
  });
});
