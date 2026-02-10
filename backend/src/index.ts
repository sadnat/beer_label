import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import adminRoutes from './routes/admin';
import { apiLimiter } from './middleware/rateLimit';

export const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

const defaultOrigins = ['http://localhost:5173', 'http://localhost:80', 'http://localhost'];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : process.env.APP_URL
    ? [process.env.APP_URL.replace(/\/$/, ''), ...defaultOrigins]
    : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Reject requests with no origin header (prevents CORS bypass)
    if (!origin) return callback(null, false);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Origine non autorisée par la politique CORS'));
  },
  credentials: true,
}));

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// General rate limiter on all API routes
app.use('/api/', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}
