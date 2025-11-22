// backend/src/index.ts
// Servidor principal da aplicação

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, disconnectDatabase, seedDatabase } from './services/database.service';
import { Logger } from './services/logger.service';
import apiRoutes from './routes/api.routes';

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = new Logger('Server');
const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:80',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger de requisições (em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROTAS
// ============================================

// Health check (sem autenticação)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// INICIALIZAÇÃO
// ============================================

async function start() {
  try {
    logger.info('🚀 Iniciando servidor...');

    // Conecta ao banco de dados
    logger.info('📊 Conectando ao banco de dados...');
    await initializeDatabase();

    // Seed (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development' && process.env.SEED === 'true') {
      logger.info('🌱 Seedando banco de dados...');
      await seedDatabase();
    }

    // Inicia servidor HTTP
    app.listen(PORT, () => {
      logger.info(`✓ Servidor rodando em http://localhost:${PORT}`);
      logger.info(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ Banco de dados: ${process.env.DATABASE_URL}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown() {
  logger.info('🛑 Encerrando servidor...');
  
  try {
    await disconnectDatabase();
    logger.info('✓ Servidor encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao encerrar:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Inicia o servidor
start();

export default app;

// ============================================
// TIPOS
// ============================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        name: string;
        picture?: string;
      };
    }
  }
}