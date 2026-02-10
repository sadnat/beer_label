import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export type UserRole = 'admin' | 'user';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Token d\'authentification requis' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'Configuration serveur invalide' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;

    // Check if user is banned
    const result = await query(
      'SELECT is_banned, ban_reason FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    const user = result.rows[0];
    if (user.is_banned) {
      res.status(403).json({
        error: 'Compte suspendu',
        reason: user.ban_reason || 'Votre compte a été suspendu.',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token invalide ou expiré' });
  }
};

// Middleware to require admin role
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    return;
  }

  next();
};
