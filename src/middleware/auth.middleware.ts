// ============================================
// backend/src/middleware/auth.middleware.ts
// Middleware de autenticação

import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '../services/logger.service';

const logger = new Logger('Auth Middleware');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Middleware de autenticação com Google OAuth
 * Valida o token JWT enviado no header Authorization
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Rotas públicas (sem autenticação)
    const publicRoutes = ['/health'];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Extrai token do header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    try {
      // Verifica token com Google
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Payload do token inválido');
      }

      // Verifica domínio
      const domain = process.env.VITE_GOOGLE_WORKSPACE_DOMAIN || '@grupolgh.com.br';
      if (!payload.email?.endsWith(domain)) {
        return res.status(403).json({
          error: 'Domínio não autorizado',
          email: payload.email,
        });
      }

      // Anexa dados do usuário ao request
      (req as any).user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      logger.debug(`Usuário autenticado: ${payload.email}`);
      next();
    } catch (error) {
      logger.error('Erro ao verificar token:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
}
