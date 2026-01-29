import { QueryResult } from 'pg';

// ============================================
// Type Definitions
// ============================================
export interface MockQueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: [];
}

// ============================================
// Mock Query Response Helper
// ============================================
export const mockQueryResponse = <T = unknown>(
  rows: T[],
  rowCount: number | null = rows.length
): MockQueryResult<T> => ({
  rows,
  rowCount,
  command: 'SELECT',
  oid: 0,
  fields: [],
});

// ============================================
// Mock Query Error Helper
// ============================================
export const mockQueryError = (
  message: string = 'Database error',
  code: string = 'UNKNOWN'
) => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};

// ============================================
// Mock Data
// ============================================
export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.V5FerJDYf/1KZm', // 'password123'
  email_verified: true,
  role: 'user' as const,
  is_banned: false,
  ban_reason: null,
  banned_at: null,
  verification_token: null,
  verification_token_expires: null,
  password_reset_token: null,
  password_reset_expires: null,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

export const mockAdminUser = {
  ...mockUser,
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'admin@example.com',
  role: 'admin' as const,
};

export const mockBannedUser = {
  ...mockUser,
  id: '550e8400-e29b-41d4-a716-446655440003',
  email: 'banned@example.com',
  is_banned: true,
  ban_reason: 'Violation des conditions',
  banned_at: new Date('2024-01-15T00:00:00Z'),
};

export const mockUnverifiedUser = {
  ...mockUser,
  id: '550e8400-e29b-41d4-a716-446655440004',
  email: 'unverified@example.com',
  email_verified: false,
  verification_token: 'valid-verification-token',
  verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

export const mockProject = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  user_id: mockUser.id,
  name: 'Ma Bière IPA',
  format_id: 'standard-33cl',
  format_width: 90,
  format_height: 120,
  canvas_json: '{"version":"6.5.4","objects":[]}',
  beer_data: {
    name: 'IPA Artisanale',
    alcohol: 6.5,
    ibu: 45,
  },
  thumbnail: 'data:image/png;base64,mockdata',
  created_at: new Date('2024-01-10T00:00:00Z'),
  updated_at: new Date('2024-01-15T00:00:00Z'),
};

export const mockPlan = {
  id: '770e8400-e29b-41d4-a716-446655440001',
  name: 'Pro',
  slug: 'pro',
  description: 'Plan professionnel',
  price_monthly: 9.99,
  max_projects: 20,
  max_exports_per_month: 50,
  features: ['Export HD', 'Templates premium'],
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z'),
};

export const mockFreePlan = {
  ...mockPlan,
  id: '770e8400-e29b-41d4-a716-446655440002',
  name: 'Gratuit',
  slug: 'gratuit',
  description: 'Plan gratuit',
  price_monthly: 0,
  max_projects: 3,
  max_exports_per_month: 5,
  features: [],
};

export const mockSubscription = {
  id: '880e8400-e29b-41d4-a716-446655440001',
  user_id: mockUser.id,
  plan_id: mockPlan.id,
  status: 'active',
  current_period_start: new Date('2024-01-01T00:00:00Z'),
  current_period_end: new Date('2024-02-01T00:00:00Z'),
  created_at: new Date('2024-01-01T00:00:00Z'),
};

export const mockAuditLogEntry = {
  id: '990e8400-e29b-41d4-a716-446655440001',
  admin_id: mockAdminUser.id,
  admin_email: mockAdminUser.email,
  action: 'ban_user',
  target_type: 'user',
  target_id: mockUser.id,
  details: { reason: 'Test ban', email: mockUser.email },
  ip_address: '127.0.0.1',
  created_at: new Date('2024-01-20T00:00:00Z'),
};

// ============================================
// Database Mock Setup Helper
// ============================================
export const setupDatabaseMock = (): jest.Mock => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { query } = require('../../config/database');
  return query as jest.Mock;
};

// ============================================
// Sequence Mock for Multiple Queries
// ============================================
export const mockQuerySequence = (responses: MockQueryResult<unknown>[]) => {
  const query = setupDatabaseMock();
  responses.forEach((response) => {
    query.mockResolvedValueOnce(response);
  });
  return query;
};
