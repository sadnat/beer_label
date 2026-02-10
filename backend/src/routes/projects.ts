import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';
import { validateUUID } from '../middleware/validateUUID';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/projects
router.get('/', projectController.listProjects);

// GET /api/projects/:id
router.get('/:id', validateUUID(), projectController.getProject);

// POST /api/projects
router.post(
  '/',
  [
    body('name')
      .notEmpty()
      .withMessage('Le nom du projet est requis')
      .isLength({ max: 255 })
      .withMessage('Le nom ne peut pas dépasser 255 caractères'),
    body('format_id')
      .notEmpty()
      .withMessage('Le format est requis'),
    body('format_width')
      .isNumeric()
      .withMessage('La largeur doit être un nombre'),
    body('format_height')
      .isNumeric()
      .withMessage('La hauteur doit être un nombre'),
    body('canvas_json')
      .notEmpty()
      .withMessage('Les données du canvas sont requises'),
    body('beer_data')
      .isObject()
      .withMessage('Les données de la bière sont requises'),
  ],
  projectController.createProject
);

// PUT /api/projects/:id
router.put(
  '/:id', validateUUID(),
  [
    body('name')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Le nom ne peut pas dépasser 255 caractères'),
    body('format_width')
      .optional()
      .isNumeric()
      .withMessage('La largeur doit être un nombre'),
    body('format_height')
      .optional()
      .isNumeric()
      .withMessage('La hauteur doit être un nombre'),
  ],
  projectController.updateProject
);

// POST /api/projects/:id/duplicate
router.post('/:id/duplicate', validateUUID(), projectController.duplicateProject);

// DELETE /api/projects/:id
router.delete('/:id', validateUUID(), projectController.deleteProject);

export default router;
