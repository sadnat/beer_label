import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as projectService from '../services/projectService';
import { AuthRequest } from '../middleware/auth';

export const listProjects = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const projects = await projectService.getProjectsByUser(req.user.userId);

    // Return projects without full canvas_json for list view
    const projectsSummary = projects.map((p) => ({
      id: p.id,
      name: p.name,
      format_id: p.format_id,
      format_width: p.format_width,
      format_height: p.format_height,
      thumbnail: p.thumbnail,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    res.json({ projects: projectsSummary });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
};

export const getProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { id } = req.params;
    const project = await projectService.getProjectById(id, req.user.userId);

    if (!project) {
      res.status(404).json({ error: 'Projet non trouvé' });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
};

export const createProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { name, format_id, format_width, format_height, canvas_json, beer_data, thumbnail } =
      req.body;

    const project = await projectService.createProject(req.user.userId, {
      name,
      format_id,
      format_width,
      format_height,
      canvas_json,
      beer_data,
      thumbnail,
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const project = await projectService.updateProject(
      id,
      req.user.userId,
      updateData
    );

    if (!project) {
      res.status(404).json({ error: 'Projet non trouvé' });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
};

export const duplicateProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { id } = req.params;
    const project = await projectService.duplicateProject(id, req.user.userId);

    if (!project) {
      res.status(404).json({ error: 'Projet non trouvé' });
      return;
    }

    res.status(201).json({ project });
  } catch (error) {
    console.error('Duplicate project error:', error);
    res.status(500).json({ error: 'Erreur lors de la duplication du projet' });
  }
};

export const deleteProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const { id } = req.params;
    const deleted = await projectService.deleteProject(id, req.user.userId);

    if (!deleted) {
      res.status(404).json({ error: 'Projet non trouvé' });
      return;
    }

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
};
