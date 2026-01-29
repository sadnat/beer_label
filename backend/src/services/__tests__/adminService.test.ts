import {
  getGlobalStats,
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  changeUserRole,
  deleteUserAsAdmin,
  getAuditLog,
  logAdminAction,
  getPlans,
  createPlan,
  updatePlan,
  changeUserPlan,
} from '../adminService';
import {
  mockQueryResponse,
  mockUser,
  mockAdminUser,
  mockProject,
  mockPlan,
  mockFreePlan,
  mockSubscription,
  mockAuditLogEntry,
  setupDatabaseMock,
} from '../../test/mocks/database';
import { TEST_IP_ADDRESS } from '../../test/helpers';

describe('adminService', () => {
  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = setupDatabaseMock();
    jest.clearAllMocks();
  });

  describe('getGlobalStats', () => {
    it('should return global statistics', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '100', active: '95', banned: '5' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ total: '500' }]))
        .mockResolvedValueOnce(mockQueryResponse([
          { plan: 'Gratuit', count: '50' },
          { plan: 'Pro', count: '30' },
        ]))
        .mockResolvedValueOnce(mockQueryResponse([
          { date: new Date('2024-01-15'), count: '10' },
          { date: new Date('2024-01-14'), count: '8' },
        ]))
        .mockResolvedValueOnce(mockQueryResponse([{ count: '45' }]));

      const result = await getGlobalStats();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(95);
      expect(result.bannedUsers).toBe(5);
      expect(result.totalProjects).toBe(500);
      expect(result.usersByPlan).toHaveLength(2);
      expect(result.recentSignups).toHaveLength(2);
      expect(result.projectsCreatedThisMonth).toBe(45);
    });

    it('should handle empty data', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '0', active: '0', banned: '0' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ total: '0' }]))
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([{ count: '0' }]));

      const result = await getGlobalStats();

      expect(result.totalUsers).toBe(0);
      expect(result.usersByPlan).toHaveLength(0);
      expect(result.recentSignups).toHaveLength(0);
    });
  });

  describe('getUsers', () => {
    it('should return paginated list of users', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '50' }]))
        .mockResolvedValueOnce(mockQueryResponse([
          { ...mockUser, projects_count: '5', plan_name: 'Pro' },
          { ...mockAdminUser, projects_count: '10', plan_name: 'Pro' },
        ]));

      const result = await getUsers(1, 20);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(50);
      expect(result.pages).toBe(3); // ceil(50/20)
    });

    it('should apply search filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '1' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ ...mockUser, projects_count: '5', plan_name: null }]));

      await getUsers(1, 20, 'test@');

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(u.email) LIKE'),
        expect.arrayContaining(['%test@%'])
      );
    });

    it('should apply role filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '1' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ ...mockAdminUser, projects_count: '10', plan_name: 'Pro' }]));

      await getUsers(1, 20, '', { role: 'admin' });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('u.role ='),
        expect.arrayContaining(['admin'])
      );
    });

    it('should apply is_banned filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '0' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getUsers(1, 20, '', { is_banned: true });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('u.is_banned ='),
        expect.arrayContaining([true])
      );
    });

    it('should apply plan filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '5' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getUsers(1, 20, '', { plan: 'pro' });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('p.slug ='),
        expect.arrayContaining(['pro'])
      );
    });

    it('should calculate correct pagination offset', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '100' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getUsers(3, 20);

      // Offset should be (3-1) * 20 = 40
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET'),
        expect.arrayContaining([20, 40])
      );
    });

    it('should convert projects_count to number', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '1' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ ...mockUser, projects_count: '25', plan_name: null }]));

      const result = await getUsers(1, 20);

      expect(typeof result.users[0].projects_count).toBe('number');
      expect(result.users[0].projects_count).toBe(25);
    });
  });

  describe('getUserDetails', () => {
    it('should return detailed user information', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ ...mockUser, plan_name: 'Pro' }]))
        .mockResolvedValueOnce(mockQueryResponse([mockProject]))
        .mockResolvedValueOnce(mockQueryResponse([{
          id: mockSubscription.id,
          plan_id: mockPlan.id,
          plan_name: mockPlan.name,
          status: 'active',
          current_period_start: mockSubscription.current_period_start,
          current_period_end: mockSubscription.current_period_end,
        }]));

      const result = await getUserDetails(mockUser.id);

      expect(result).not.toBeNull();
      expect(result?.email).toBe(mockUser.email);
      expect(result?.projects).toHaveLength(1);
      expect(result?.subscription).not.toBeNull();
    });

    it('should return null if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await getUserDetails('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle user without subscription', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ ...mockUser, plan_name: null }]))
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      const result = await getUserDetails(mockUser.id);

      expect(result?.subscription).toBeNull();
    });
  });

  describe('banUser', () => {
    it('should ban a non-admin user', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id, email: mockUser.email }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1)); // Audit log

      const result = await banUser(mockUser.id, 'Violation', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(true);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('is_banned = TRUE'),
        [mockUser.id, 'Violation']
      );
    });

    it('should not ban an admin user', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 0));

      const result = await banUser(mockAdminUser.id, 'Reason', 'another-admin', TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });

    it('should log the ban action', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id, email: mockUser.email }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      await banUser(mockUser.id, 'Violation', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining(['ban_user', 'user', mockUser.id])
      );
    });
  });

  describe('unbanUser', () => {
    it('should unban a user', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id, email: mockUser.email }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      const result = await unbanUser(mockUser.id, mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(true);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('is_banned = FALSE'),
        [mockUser.id]
      );
    });

    it('should return false if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 0));

      const result = await unbanUser('nonexistent', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });
  });

  describe('changeUserRole', () => {
    it('should change user role', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ role: 'user', email: mockUser.email }]))
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      const result = await changeUserRole(mockUser.id, 'admin', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await changeUserRole('nonexistent', 'admin', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });

    it('should log role change with old and new role', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ role: 'user', email: mockUser.email }]))
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      await changeUserRole(mockUser.id, 'admin', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining(['change_role'])
      );
    });
  });

  describe('deleteUserAsAdmin', () => {
    it('should delete a non-admin user', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ email: mockUser.email, role: 'user' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockUser.id }], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      const result = await deleteUserAsAdmin(mockUser.id, mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(true);
    });

    it('should not delete an admin user', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{ email: mockAdminUser.email, role: 'admin' }]));

      const result = await deleteUserAsAdmin(mockAdminUser.id, 'another-admin', TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await deleteUserAsAdmin('nonexistent', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });
  });

  describe('getAuditLog', () => {
    it('should return paginated audit log entries', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '100' }]))
        .mockResolvedValueOnce(mockQueryResponse([mockAuditLogEntry]));

      const result = await getAuditLog(1, 50);

      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(100);
      expect(result.pages).toBe(2);
    });

    it('should apply adminId filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '10' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getAuditLog(1, 50, { adminId: mockAdminUser.id });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('a.admin_id ='),
        expect.arrayContaining([mockAdminUser.id])
      );
    });

    it('should apply action filter', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '5' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getAuditLog(1, 50, { action: 'ban_user' });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('a.action ='),
        expect.arrayContaining(['ban_user'])
      );
    });

    it('should apply date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ total: '20' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      await getAuditLog(1, 50, { startDate, endDate });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('a.created_at >='),
        expect.arrayContaining([startDate])
      );
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('a.created_at <='),
        expect.arrayContaining([endDate])
      );
    });
  });

  describe('logAdminAction', () => {
    it('should insert audit log entry', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 1));

      await logAdminAction(
        mockAdminUser.id,
        'test_action',
        'user',
        mockUser.id,
        { test: 'details' },
        TEST_IP_ADDRESS
      );

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining([
          mockAdminUser.id,
          'test_action',
          'user',
          mockUser.id,
          expect.stringContaining('test'),
          TEST_IP_ADDRESS,
        ])
      );
    });

    it('should handle null details', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([], 1));

      await logAdminAction(mockAdminUser.id, 'action', null, null, null, null);

      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null, null, null, null])
      );
    });
  });

  describe('getPlans', () => {
    it('should return all plans ordered by price', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockFreePlan, mockPlan]));

      const result = await getPlans();

      expect(result).toHaveLength(2);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY price_monthly ASC')
      );
    });
  });

  describe('createPlan', () => {
    it('should create a new plan', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockPlan]));

      const planData = {
        name: 'Pro',
        slug: 'pro',
        description: 'Pro plan',
        price_monthly: 9.99,
        max_projects: 20,
        max_exports_per_month: 50,
        features: ['Feature 1'],
      };

      const result = await createPlan(planData);

      expect(result.name).toBe('Pro');
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO plans'),
        expect.arrayContaining(['Pro', 'pro', 'Pro plan', 9.99, 20, 50])
      );
    });

    it('should handle null description', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{ ...mockPlan, description: null }]));

      const planData = {
        name: 'Basic',
        slug: 'basic',
        price_monthly: 0,
        max_projects: 5,
        max_exports_per_month: 10,
        features: [],
      };

      await createPlan(planData);

      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null])
      );
    });
  });

  describe('updatePlan', () => {
    it('should update plan fields', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([{ ...mockPlan, name: 'Pro Plus' }]));

      const result = await updatePlan(mockPlan.id, { name: 'Pro Plus' });

      expect(result?.name).toBe('Pro Plus');
    });

    it('should return null if no updates provided', async () => {
      const result = await updatePlan(mockPlan.id, {});

      expect(result).toBeNull();
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('should return null if plan not found', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([]));

      const result = await updatePlan('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      queryMock.mockResolvedValue(mockQueryResponse([mockPlan]));

      await updatePlan(mockPlan.id, {
        name: 'Updated',
        price_monthly: 19.99,
        max_projects: 50,
        is_active: false,
      });

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('name ='),
        expect.arrayContaining(['Updated', 19.99, 50, false, mockPlan.id])
      );
    });
  });

  describe('changeUserPlan', () => {
    it('should change user subscription plan', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([{ id: mockSubscription.id, plan_name: 'Gratuit' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ name: 'Pro' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ email: mockUser.email }]))
        .mockResolvedValueOnce(mockQueryResponse([], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      const result = await changeUserPlan(mockUser.id, mockPlan.id, mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(true);
    });

    it('should return false if new plan not found', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      const result = await changeUserPlan(mockUser.id, 'nonexistent-plan', mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([{ name: 'Pro' }]))
        .mockResolvedValueOnce(mockQueryResponse([]));

      const result = await changeUserPlan('nonexistent', mockPlan.id, mockAdminUser.id, TEST_IP_ADDRESS);

      expect(result).toBe(false);
    });

    it('should create subscription if none exists', async () => {
      queryMock
        .mockResolvedValueOnce(mockQueryResponse([]))
        .mockResolvedValueOnce(mockQueryResponse([{ name: 'Pro' }]))
        .mockResolvedValueOnce(mockQueryResponse([{ email: mockUser.email }]))
        .mockResolvedValueOnce(mockQueryResponse([], 1))
        .mockResolvedValueOnce(mockQueryResponse([], 1));

      await changeUserPlan(mockUser.id, mockPlan.id, mockAdminUser.id, TEST_IP_ADDRESS);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO subscriptions'),
        expect.arrayContaining([mockUser.id, mockPlan.id])
      );
    });
  });
});
