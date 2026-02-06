import { query } from '../config/database';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  format_id: string;
  format_width: number;
  format_height: number;
  canvas_json: string;
  beer_data: Record<string, unknown>;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectCreate {
  name: string;
  format_id: string;
  format_width: number;
  format_height: number;
  canvas_json: string;
  beer_data: Record<string, unknown>;
  thumbnail?: string;
}

export interface ProjectUpdate {
  name?: string;
  format_id?: string;
  format_width?: number;
  format_height?: number;
  canvas_json?: string;
  beer_data?: Record<string, unknown>;
  thumbnail?: string;
}

export const createProject = async (
  userId: string,
  data: ProjectCreate
): Promise<Project> => {
  const result = await query(
    `INSERT INTO projects (user_id, name, format_id, format_width, format_height, canvas_json, beer_data, thumbnail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      data.name,
      data.format_id,
      data.format_width,
      data.format_height,
      data.canvas_json,
      JSON.stringify(data.beer_data),
      data.thumbnail || null,
    ]
  );

  return result.rows[0];
};

export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
  const result = await query(
    `SELECT * FROM projects
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getProjectById = async (
  projectId: string,
  userId: string
): Promise<Project | null> => {
  const result = await query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  return result.rows[0] || null;
};

export const updateProject = async (
  projectId: string,
  userId: string,
  data: ProjectUpdate
): Promise<Project | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.format_id !== undefined) {
    fields.push(`format_id = $${paramIndex++}`);
    values.push(data.format_id);
  }
  if (data.format_width !== undefined) {
    fields.push(`format_width = $${paramIndex++}`);
    values.push(data.format_width);
  }
  if (data.format_height !== undefined) {
    fields.push(`format_height = $${paramIndex++}`);
    values.push(data.format_height);
  }
  if (data.canvas_json !== undefined) {
    fields.push(`canvas_json = $${paramIndex++}`);
    values.push(data.canvas_json);
  }
  if (data.beer_data !== undefined) {
    fields.push(`beer_data = $${paramIndex++}`);
    values.push(JSON.stringify(data.beer_data));
  }
  if (data.thumbnail !== undefined) {
    fields.push(`thumbnail = $${paramIndex++}`);
    values.push(data.thumbnail);
  }

  if (fields.length === 0) {
    return getProjectById(projectId, userId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(projectId, userId);

  const result = await query(
    `UPDATE projects
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

export const duplicateProject = async (
  projectId: string,
  userId: string
): Promise<Project | null> => {
  const original = await getProjectById(projectId, userId);
  if (!original) return null;

  const result = await query(
    `INSERT INTO projects (user_id, name, format_id, format_width, format_height, canvas_json, beer_data, thumbnail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      `${original.name} (copie)`,
      original.format_id,
      original.format_width,
      original.format_height,
      original.canvas_json,
      JSON.stringify(original.beer_data),
      original.thumbnail,
    ]
  );

  return result.rows[0];
};

export const deleteProject = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );

  return (result.rowCount ?? 0) > 0;
};
