import express, { Express } from 'express';
import request from 'supertest';
import projectRoutes from '../projects';
import { mockQueryResponse, mockUser, mockProject, setupDatabaseMock } from '../../test/mocks/database';
import { generateTestToken } from '../../test/helpers';

describe('Project Routes Integration', () => {
  let app: Express;
  let queryMock: jest.Mock;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects', projectRoutes);

    validToken = generateTestToken(mockUser.id, mockUser.email, 'user');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock = setupDatabaseMock();
  });

  describe('GET /api/projects', () => {
    it('should list user projects', async () => {
      // Auth middleware check
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      // List projects query
      queryMock.mockResolvedValueOnce(mockQueryResponse([
        {
          id: mockProject.id,
          name: mockProject.name,
          format_id: mockProject.format_id,
          format_width: mockProject.format_width,
          format_height: mockProject.format_height,
          thumbnail: mockProject.thumbnail,
          created_at: mockProject.created_at,
          updated_at: mockProject.updated_at,
        },
      ]));

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].name).toBe(mockProject.name);
    });

    it('should return empty array for user with no projects', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      queryMock.mockResolvedValueOnce(mockQueryResponse([]));

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/projects', () => {
    const validProjectData = {
      name: 'New Project',
      format_id: 'standard-33cl',
      format_width: 90,
      format_height: 120,
      canvas_json: '{"objects":[]}',
      beer_data: { name: 'Test Beer', alcohol: 5.0 },
    };

    it('should return 400 for missing required fields', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Incomplete Project' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for invalid format dimensions', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          ...validProjectData,
          format_width: 'not-a-number',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid beer_data type', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          ...validProjectData,
          beer_data: 'not-an-object',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should return 400 for invalid name length', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: false, ban_reason: null }]));
      const longName = 'a'.repeat(300);

      const response = await request(app)
        .put(`/api/projects/${mockProject.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: longName });

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for requests without token', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(401);
    });

    it('should return 403 for banned users', async () => {
      queryMock.mockResolvedValueOnce(mockQueryResponse([{ is_banned: true, ban_reason: 'Test ban' }]));

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Compte suspendu');
    });
  });
});
