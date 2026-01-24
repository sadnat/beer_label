import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as adminService from '../services/adminService';
import { AuthRequest, UserRole } from '../middleware/auth';

// Helper to get client IP
const getClientIp = (req: AuthRequest): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
};

// GET /api/admin/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getGlobalStats();
    res.json({ stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const search = (req.query.search as string) || '';
    const role = req.query.role as UserRole | undefined;
    const is_banned = req.query.is_banned === 'true' ? true : req.query.is_banned === 'false' ? false : undefined;
    const plan = req.query.plan as string | undefined;

    const result = await adminService.getUsers(page, limit, search, { role, is_banned, plan });
    res.json(result);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// GET /api/admin/users/:id
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserDetails(id);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des détails utilisateur' });
  }
};

// PUT /api/admin/users/:id/role
export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);

    // Prevent self role change
    if (id === adminId) {
      res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
      return;
    }

    const success = await adminService.changeUserRole(id, role, adminId, ipAddress);

    if (!success) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ message: 'Rôle modifié avec succès' });
  } catch (error) {
    console.error('Admin change role error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de rôle' });
  }
};

// POST /api/admin/users/:id/ban
export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);

    // Prevent self ban
    if (id === adminId) {
      res.status(400).json({ error: 'Vous ne pouvez pas vous bannir vous-même' });
      return;
    }

    const success = await adminService.banUser(id, reason || 'Aucune raison fournie', adminId, ipAddress);

    if (!success) {
      res.status(404).json({ error: 'Utilisateur non trouvé ou impossible à bannir' });
      return;
    }

    res.json({ message: 'Utilisateur banni avec succès' });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ error: 'Erreur lors du bannissement' });
  }
};

// DELETE /api/admin/users/:id/ban
export const unbanUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);

    const success = await adminService.unbanUser(id, adminId, ipAddress);

    if (!success) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ message: 'Utilisateur débanni avec succès' });
  } catch (error) {
    console.error('Admin unban user error:', error);
    res.status(500).json({ error: 'Erreur lors du débannissement' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);

    // Prevent self deletion
    if (id === adminId) {
      res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte depuis l\'admin' });
      return;
    }

    const success = await adminService.deleteUserAsAdmin(id, adminId, ipAddress);

    if (!success) {
      res.status(404).json({ error: 'Utilisateur non trouvé ou impossible à supprimer' });
      return;
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

// PUT /api/admin/users/:id/plan
export const changeUserPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    const { planId } = req.body;
    const adminId = req.user!.userId;
    const ipAddress = getClientIp(req);

    const success = await adminService.changeUserPlan(id, planId, adminId, ipAddress);

    if (!success) {
      res.status(404).json({ error: 'Utilisateur ou plan non trouvé' });
      return;
    }

    res.json({ message: 'Plan modifié avec succès' });
  } catch (error) {
    console.error('Admin change plan error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de plan' });
  }
};

// GET /api/admin/plans
export const getPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plans = await adminService.getPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Admin get plans error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des plans' });
  }
};

// POST /api/admin/plans
export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, slug, description, price_monthly, max_projects, max_exports_per_month, features } = req.body;

    const plan = await adminService.createPlan({
      name,
      slug,
      description,
      price_monthly,
      max_projects,
      max_exports_per_month,
      features: features || [],
    });

    res.status(201).json({ plan });
  } catch (error: unknown) {
    console.error('Admin create plan error:', error);
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Un plan avec ce slug existe déjà' });
      return;
    }
    res.status(500).json({ error: 'Erreur lors de la création du plan' });
  }
};

// PUT /api/admin/plans/:id
export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await adminService.updatePlan(id, updates);

    if (!plan) {
      res.status(404).json({ error: 'Plan non trouvé' });
      return;
    }

    res.json({ plan });
  } catch (error) {
    console.error('Admin update plan error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du plan' });
  }
};

// GET /api/admin/audit-log
export const getAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const adminId = req.query.adminId as string | undefined;
    const action = req.query.action as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await adminService.getAuditLog(page, limit, { adminId, action, targetType, startDate, endDate });
    res.json(result);
  } catch (error) {
    console.error('Admin get audit log error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du journal d\'audit' });
  }
};
