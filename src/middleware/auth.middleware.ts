// ============================================
// backend/src/middleware/auth.middleware.ts
// Middleware de autenticação

import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { userService } from '../services/database.service';
import { Logger } from '../services/logger.service';

const logger = new Logger('Auth Middleware');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Estende o tipo Request para incluir o usuário do banco
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        picture?: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
      };
    }
  }
}

/**
 * Middleware de autenticação com Google OAuth
 * Valida o token JWT e verifica se o usuário existe no banco
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
      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'Payload do token inválido' });
      }

      // Verifica domínio
      const domain = process.env.VITE_GOOGLE_WORKSPACE_DOMAIN || '@grupolgh.com.br';
      if (!payload.email.endsWith(domain)) {
        return res.status(403).json({
          error: 'Domínio não autorizado',
          email: payload.email,
        });
      }

      // ============================================
      // VALIDAÇÃO NO BANCO DE DADOS
      // ============================================
      
      // Busca usuário no banco pelo email
      let dbUser = await userService.findByEmail(payload.email);

      // Se não existe, cria automaticamente (primeiro acesso)
      if (!dbUser) {
        logger.info(`Criando novo usuário: ${payload.email}`);
        dbUser = await userService.create(
          payload.email,
          payload.name || payload.email.split('@')[0],
          payload.picture
        );
      }

      // Atualiza último login
      await userService.updateLastLogin(dbUser.id);

      // Anexa dados do usuário DO BANCO ao request
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        picture: dbUser.picture,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        lastLoginAt: dbUser.lastLoginAt,
      };

      logger.debug(`Usuário autenticado: ${dbUser.email} (${dbUser.role})`);
      next();
    } catch (error) {
      logger.error('Erro ao verificar token:', error);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno ao autenticar' });
  }
}

/**
 * Middleware para verificar roles específicas
 * Uso: router.delete('/tickets/:id', requireRole('admin', 'manager'), handler)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Acesso negado para ${req.user.email} (${req.user.role}) - Requer: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Esta ação requer uma das seguintes permissões: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}