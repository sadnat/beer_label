import request from 'supertest';
import { app } from '../index';

describe('Projects API Integration Tests', () => {
  const testUser = {
    email: `projects_test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  let authToken: string;
  let projectId: string;

  // Setup: Register and login user before tests
  beforeAll(async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = registerRes.body.token;
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Beer Label',
        formatId: 'beer-bottle-standard',
        formatWidth: 90,
        formatHeight: 120,
        canvasJson: JSON.stringify({ objects: [] }),
        beerData: {
          name: 'Test IPA',
          style: 'IPA',
          abv: '6.5%',
        },
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(projectData.name);
      projectId = res.body.id;
    });

    it('should reject project creation without auth', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          name: 'Unauthorized Project',
          formatId: 'beer-bottle-standard',
          formatWidth: 90,
          formatHeight: 120,
          canvasJson: '{}',
          beerData: {},
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects', () => {
    it('should return user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/projects');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a specific project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Beer Label',
        canvasJson: JSON.stringify({ objects: [{ type: 'text' }] }),
        beerData: {
          name: 'Updated IPA',
          style: 'Double IPA',
          abv: '8.0%',
        },
      };

      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.statusCode).toBe(404);
    });
  });
});
