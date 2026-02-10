import { query } from '../config/database';
import { UserRole } from '../middleware/auth';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalProjects: number;
  usersByPlan: { plan: string; count: number }[];
  recentSignups: { date: string; count: number }[];
  projectsCreatedThisMonth: number;
}

export interface AdminUser {
  id: string;
  email: string;
  email_verified: boolean;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: Date | null;
  created_at: Date;
  updated_at: Date;
  projects_count: number;
  plan_name: string | null;
}

export interface AdminUserDetails extends AdminUser {
  projects: {
    id: string;
    name: string;
    format_id: string;
    created_at: Date;
    updated_at: Date;
  }[];
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_start: Date;
    current_period_end: Date | null;
  } | null;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  max_projects: number;
  max_exports_per_month: number;
  features: string[];
  is_active: boolean;
  created_at: Date;
}

// Get global statistics for the admin dashboard
export const getGlobalStats = async (): Promise<AdminStats> => {
  // Total users count
  const usersResult = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_banned = FALSE) as active,
      COUNT(*) FILTER (WHERE is_banned = TRUE) as banned
    FROM users
  `);

  // Total projects count
  const projectsResult = await query('SELECT COUNT(*) as total FROM projects');

  // Users by plan
  const planResult = await query(`
    SELECT
      COALESCE(p.name, 'Sans plan') as plan,
      COUNT(u.id) as count
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    LEFT JOIN plans p ON p.id = s.plan_id
    GROUP BY p.name
    ORDER BY count DESC
  `);

  // Recent signups (last 7 days)
  const signupsResult = await query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Projects created this month
  const monthProjectsResult = await query(`
    SELECT COUNT(*) as count
    FROM projects
    WHERE created_at >= DATE_TRUNC('month', NOW())
  `);

  return {
    totalUsers: parseInt(usersResult.rows[0].total, 10),
    activeUsers: parseInt(usersResult.rows[0].active, 10),
    bannedUsers: parseInt(usersResult.rows[0].banned, 10),
    totalProjects: parseInt(projectsResult.rows[0].total, 10),
    usersByPlan: planResult.rows.map(row => ({
      plan: row.plan,
      count: parseInt(row.count, 10),
    })),
    recentSignups: signupsResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count, 10),
    })),
    projectsCreatedThisMonth: parseInt(monthProjectsResult.rows[0].count, 10),
  };
};

// Get paginated list of users
export const getUsers = async (
  page: number = 1,
  limit: number = 20,
  search: string = '',
  filters: {
    role?: UserRole;
    is_banned?: boolean;
    plan?: string;
  } = {}
): Promise<{ users: AdminUser[]; total: number; pages: number }> => {
  const offset = (page - 1) * limit;
  const params: (string | number | boolean)[] = [];
  let paramIndex = 1;

  // Build WHERE clause
  const conditions: string[] = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(`LOWER(u.email) LIKE $${paramIndex++}`);
  }

  if (filters.role) {
    params.push(filters.role);
    conditions.push(`u.role = $${paramIndex++}`);
  }

  if (filters.is_banned !== undefined) {
    params.push(filters.is_banned);
    conditions.push(`u.is_banned = $${paramIndex++}`);
  }

  if (filters.plan) {
    params.push(filters.plan);
    conditions.push(`p.slug = $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     LEFT JOIN plans p ON p.id = s.plan_id
     ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get users
  params.push(limit, offset);
  const usersResult = await query(
    `SELECT
      u.id, u.email, u.email_verified, u.role,
      u.is_banned, u.ban_reason, u.banned_at,
      u.created_at, u.updated_at,
      COALESCE(pc.count, 0) as projects_count,
      p.name as plan_name
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     LEFT JOIN plans p ON p.id = s.plan_id
     LEFT JOIN (
       SELECT user_id, COUNT(*) as count FROM projects GROUP BY user_id
     ) pc ON pc.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return {
    users: usersResult.rows.map(row => ({
      ...row,
      projects_count: parseInt(row.projects_count, 10),
    })),
    total,
    pages: Math.ceil(total / limit),
  };
};

// Get detailed information about a single user
export const getUserDetails = async (userId: string): Promise<AdminUserDetails | null> => {
  // Get user with plan
  const userResult = await query(
    `SELECT
      u.id, u.email, u.email_verified, u.role,
      u.is_banned, u.ban_reason, u.banned_at,
      u.created_at, u.updated_at,
      p.name as plan_name
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     LEFT JOIN plans p ON p.id = s.plan_id
     WHERE u.id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return null;
  }

  const user = userResult.rows[0];

  // Get projects
  const projectsResult = await query(
    `SELECT id, name, format_id, created_at, updated_at
     FROM projects
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );

  // Get subscription
  const subscriptionResult = await query(
    `SELECT
      s.id, s.plan_id, p.name as plan_name, s.status,
      s.current_period_start, s.current_period_end
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1`,
    [userId]
  );

  return {
    ...user,
    projects_count: projectsResult.rows.length,
    projects: projectsResult.rows,
    subscription: subscriptionResult.rows[0] || null,
  };
};

// Ban a user
export const banUser = async (
  userId: string,
  reason: string,
  adminId: string,
  ipAddress: string
): Promise<boolean> => {
  const result = await query(
    `UPDATE users
     SET is_banned = TRUE, ban_reason = $2, banned_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND role != 'admin'
     RETURNING id, email`,
    [userId, reason]
  );

  if (result.rowCount === 0) {
    return false;
  }

  // Log action
  await logAdminAction(
    adminId,
    'ban_user',
    'user',
    userId,
    { reason, email: result.rows[0].email },
    ipAddress
  );

  return true;
};

// Unban a user
export const unbanUser = async (
  userId: string,
  adminId: string,
  ipAddress: string
): Promise<boolean> => {
  const result = await query(
    `UPDATE users
     SET is_banned = FALSE, ban_reason = NULL, banned_at = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING id, email`,
    [userId]
  );

  if (result.rowCount === 0) {
    return false;
  }

  // Log action
  await logAdminAction(
    adminId,
    'unban_user',
    'user',
    userId,
    { email: result.rows[0].email },
    ipAddress
  );

  return true;
};

// Change user role
export const changeUserRole = async (
  userId: string,
  newRole: UserRole,
  adminId: string,
  ipAddress: string
): Promise<boolean> => {
  // Get current role first
  const currentResult = await query(
    'SELECT role, email FROM users WHERE id = $1',
    [userId]
  );

  if (currentResult.rows.length === 0) {
    return false;
  }

  const { role: oldRole, email } = currentResult.rows[0];

  // Prevent changing the role of an existing admin (protection against privilege escalation/demotion)
  if (oldRole === 'admin') {
    return false;
  }

  const result = await query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 AND role != 'admin' RETURNING id`,
    [userId, newRole]
  );

  if (result.rowCount === 0) {
    return false;
  }

  // Log action
  await logAdminAction(
    adminId,
    'change_role',
    'user',
    userId,
    { email, oldRole, newRole },
    ipAddress
  );

  return true;
};

// Delete user as admin
export const deleteUserAsAdmin = async (
  userId: string,
  adminId: string,
  ipAddress: string
): Promise<boolean> => {
  // Get user info before deletion
  const userResult = await query(
    'SELECT email, role FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    return false;
  }

  const { email, role } = userResult.rows[0];

  // Prevent deleting admins
  if (role === 'admin') {
    return false;
  }

  const result = await query(
    'DELETE FROM users WHERE id = $1 AND role != $2 RETURNING id',
    [userId, 'admin']
  );

  if (result.rowCount === 0) {
    return false;
  }

  // Log action
  await logAdminAction(
    adminId,
    'delete_user',
    'user',
    userId,
    { email },
    ipAddress
  );

  return true;
};

// Get audit log
export const getAuditLog = async (
  page: number = 1,
  limit: number = 50,
  filters: {
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{ entries: AuditLogEntry[]; total: number; pages: number }> => {
  const offset = (page - 1) * limit;
  const params: (string | number | Date)[] = [];
  let paramIndex = 1;

  const conditions: string[] = [];

  if (filters.adminId) {
    params.push(filters.adminId);
    conditions.push(`a.admin_id = $${paramIndex++}`);
  }

  if (filters.action) {
    params.push(filters.action);
    conditions.push(`a.action = $${paramIndex++}`);
  }

  if (filters.targetType) {
    params.push(filters.targetType);
    conditions.push(`a.target_type = $${paramIndex++}`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`a.created_at >= $${paramIndex++}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`a.created_at <= $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as total FROM audit_log a ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total, 10);

  // Get entries
  params.push(limit, offset);
  const entriesResult = await query(
    `SELECT
      a.id, a.admin_id, u.email as admin_email,
      a.action, a.target_type, a.target_id,
      a.details, a.ip_address, a.created_at
     FROM audit_log a
     JOIN users u ON u.id = a.admin_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return {
    entries: entriesResult.rows,
    total,
    pages: Math.ceil(total / limit),
  };
};

// Log admin action
export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string | null
): Promise<void> => {
  await query(
    `INSERT INTO audit_log (admin_id, action, target_type, target_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null, ipAddress]
  );
};

// Get all plans
export const getPlans = async (): Promise<Plan[]> => {
  const result = await query(
    `SELECT id, name, slug, description, price_monthly,
            max_projects, max_exports_per_month, features, is_active, created_at
     FROM plans
     ORDER BY price_monthly ASC`
  );
  return result.rows;
};

// Create a new plan
export const createPlan = async (plan: {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  max_projects: number;
  max_exports_per_month: number;
  features: string[];
}): Promise<Plan> => {
  const result = await query(
    `INSERT INTO plans (name, slug, description, price_monthly, max_projects, max_exports_per_month, features)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, slug, description, price_monthly, max_projects, max_exports_per_month, features, is_active, created_at`,
    [plan.name, plan.slug, plan.description || null, plan.price_monthly, plan.max_projects, plan.max_exports_per_month, JSON.stringify(plan.features)]
  );
  return result.rows[0];
};

// Update a plan
export const updatePlan = async (
  planId: string,
  updates: Partial<{
    name: string;
    description: string;
    price_monthly: number;
    max_projects: number;
    max_exports_per_month: number;
    features: string[];
    is_active: boolean;
  }>
): Promise<Plan | null> => {
  const setClauses: string[] = [];
  const params: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    params.push(updates.name);
    setClauses.push(`name = $${paramIndex++}`);
  }
  if (updates.description !== undefined) {
    params.push(updates.description);
    setClauses.push(`description = $${paramIndex++}`);
  }
  if (updates.price_monthly !== undefined) {
    params.push(updates.price_monthly);
    setClauses.push(`price_monthly = $${paramIndex++}`);
  }
  if (updates.max_projects !== undefined) {
    params.push(updates.max_projects);
    setClauses.push(`max_projects = $${paramIndex++}`);
  }
  if (updates.max_exports_per_month !== undefined) {
    params.push(updates.max_exports_per_month);
    setClauses.push(`max_exports_per_month = $${paramIndex++}`);
  }
  if (updates.features !== undefined) {
    params.push(JSON.stringify(updates.features));
    setClauses.push(`features = $${paramIndex++}`);
  }
  if (updates.is_active !== undefined) {
    params.push(updates.is_active);
    setClauses.push(`is_active = $${paramIndex++}`);
  }

  if (setClauses.length === 0) {
    return null;
  }

  params.push(planId);
  const result = await query(
    `UPDATE plans SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, slug, description, price_monthly, max_projects, max_exports_per_month, features, is_active, created_at`,
    params
  );

  return result.rows[0] || null;
};

// Change user's subscription plan
export const changeUserPlan = async (
  userId: string,
  planId: string,
  adminId: string,
  ipAddress: string
): Promise<boolean> => {
  // Get current subscription
  const currentResult = await query(
    `SELECT s.id, p.name as plan_name
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1`,
    [userId]
  );

  const oldPlanName = currentResult.rows[0]?.plan_name || 'Sans plan';

  // Get new plan name
  const newPlanResult = await query('SELECT name FROM plans WHERE id = $1', [planId]);
  if (newPlanResult.rows.length === 0) {
    return false;
  }
  const newPlanName = newPlanResult.rows[0].name;

  // Get user email
  const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    return false;
  }
  const email = userResult.rows[0].email;

  // Update or insert subscription
  await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start)
     VALUES ($1, $2, 'active', NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET plan_id = $2, status = 'active', current_period_start = NOW()`,
    [userId, planId]
  );

  // Log action
  await logAdminAction(
    adminId,
    'change_plan',
    'user',
    userId,
    { email, oldPlan: oldPlanName, newPlan: newPlanName },
    ipAddress
  );

  return true;
};
