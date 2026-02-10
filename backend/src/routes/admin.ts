import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateUUID } from '../middleware/validateUUID';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats - Global statistics
router.get('/stats', adminController.getStats);

// GET /api/admin/users - List users (paginated)
router.get('/users', adminController.getUsers);

// GET /api/admin/users/:id - User details
router.get('/users/:id', validateUUID(), adminController.getUserDetails);

// PUT /api/admin/users/:id/role - Change user role
router.put(
  '/users/:id/role', validateUUID(),
  [
    body('role')
      .isIn(['admin', 'user'])
      .withMessage('Le rôle doit être "admin" ou "user"'),
  ],
  adminController.changeUserRole
);

// POST /api/admin/users/:id/ban - Ban user
router.post(
  '/users/:id/ban', validateUUID(),
  [
    body('reason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('La raison ne peut pas dépasser 500 caractères'),
  ],
  adminController.banUser
);

// DELETE /api/admin/users/:id/ban - Unban user
router.delete('/users/:id/ban', validateUUID(), adminController.unbanUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', validateUUID(), adminController.deleteUser);

// PUT /api/admin/users/:id/plan - Change user plan
router.put(
  '/users/:id/plan', validateUUID(),
  [
    body('planId')
      .isUUID()
      .withMessage('ID de plan invalide'),
  ],
  adminController.changeUserPlan
);

// GET /api/admin/plans - List plans
router.get('/plans', adminController.getPlans);

// POST /api/admin/plans - Create plan
router.post(
  '/plans',
  [
    body('name')
      .notEmpty()
      .withMessage('Le nom est requis')
      .isLength({ max: 100 })
      .withMessage('Le nom ne peut pas dépasser 100 caractères'),
    body('slug')
      .notEmpty()
      .withMessage('Le slug est requis')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
      .isLength({ max: 50 })
      .withMessage('Le slug ne peut pas dépasser 50 caractères'),
    body('description')
      .optional()
      .isString(),
    body('price_monthly')
      .isFloat({ min: 0 })
      .withMessage('Le prix doit être un nombre positif'),
    body('max_projects')
      .isInt()
      .withMessage('Le nombre max de projets doit être un entier'),
    body('max_exports_per_month')
      .isInt()
      .withMessage('Le nombre max d\'exports doit être un entier'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Les fonctionnalités doivent être un tableau'),
  ],
  adminController.createPlan
);

// PUT /api/admin/plans/:id - Update plan
router.put(
  '/plans/:id', validateUUID(),
  [
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Le nom ne peut pas dépasser 100 caractères'),
    body('description')
      .optional()
      .isString(),
    body('price_monthly')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix doit être un nombre positif'),
    body('max_projects')
      .optional()
      .isInt()
      .withMessage('Le nombre max de projets doit être un entier'),
    body('max_exports_per_month')
      .optional()
      .isInt()
      .withMessage('Le nombre max d\'exports doit être un entier'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Les fonctionnalités doivent être un tableau'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active doit être un booléen'),
  ],
  adminController.updatePlan
);

// GET /api/admin/audit-log - Audit log
router.get('/audit-log', adminController.getAuditLog);

export default router;
