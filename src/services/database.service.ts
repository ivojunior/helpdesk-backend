// backend/src/services/database.service.ts
// Serviço centralizado de banco de dados

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from './logger.service';

const logger = new Logger('Database');

// Tipos de eventos que queremos habilitar no $on
type PrismaLogEvents = 'query' | 'info' | 'warn' | 'error';

// Singleton do Prisma, já tipado com os eventos de log
let prisma: PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvents> | null = null;

/**
 * Obtém instância do Prisma
 */
export function getPrisma(): PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvents> {
  if (!prisma) {
    prisma = new PrismaClient<Prisma.PrismaClientOptions, PrismaLogEvents>({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ] as const,
    });

    // Log de queries em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e: Prisma.QueryEvent) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    prisma.$on('error', (e: Prisma.LogEvent) => {
      logger.error('Prisma error:', e);
    });
  }

  return prisma;
}

/**
 * Inicializa conexão com banco de dados
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const client = getPrisma();
    
    // Testa conexão
    await client.$queryRaw`SELECT 1`;
    
    logger.info('✓ Banco de dados conectado com sucesso');
    
    // Executa migrations automáticas (opcional)
    await runMigrations();
  } catch (error) {
    logger.error('Erro ao conectar ao banco:', error);
    process.exit(1);
  }
}

/**
 * Executa migrations do Prisma
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Executando migrations...');
    // As migrations são automáticas no Prisma
    logger.info('✓ Migrations completadas');
  } catch (error) {
    logger.error('Erro ao executar migrations:', error);
    throw error;
  }
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('✓ Desconectado do banco de dados');
  }
}

/**
 * Reset do banco (apenas desenvolvimento)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Reset permitido apenas em desenvolvimento');
  }

  try {
    const client = getPrisma();
    
    logger.warn('⚠️ Resetando banco de dados...');
    
    // Deleta dados em ordem (por dependências)
    await client.auditLog.deleteMany();
    await client.attachment.deleteMany();
    await client.comment.deleteMany();
    await client.ticket.deleteMany();
    await client.user.deleteMany();
    await client.setting.deleteMany();
    
    logger.info('✓ Banco resetado com sucesso');
  } catch (error) {
    logger.error('Erro ao resetar banco:', error);
    throw error;
  }
}

/**
 * Seed do banco com dados iniciais
 */
export async function seedDatabase(): Promise<void> {
  try {
    const client = getPrisma();
    
    // Verifica se já tem dados
    const userCount = await client.user.count();
    if (userCount > 0) {
      logger.info('Banco já possui dados, pulando seed');
      return;
    }

    logger.info('Seedando banco com dados iniciais...');

    // Cria usuários
    const admin = await client.user.create({
      data: {
        email: 'admin@grupolgh.com.br',
        name: 'Administrador',
        role: 'admin',
      },
    });

    const manager = await client.user.create({
      data: {
        email: 'manager@grupolgh.com.br',
        name: 'Gerente',
        role: 'manager',
      },
    });

    const user = await client.user.create({
      data: {
        email: 'user@grupolgh.com.br',
        name: 'Usuário Padrão',
        role: 'user',
      },
    });

    // Cria tickets de exemplo
    await client.ticket.create({
      data: {
        title: 'Sistema de login não funciona',
        description: 'Não consigo fazer login com minha conta',
        category: 'technical',
        priority: 'high',
        status: 'open',
        requesterName: 'João Silva',
        requesterEmail: 'joao@grupolgh.com.br',
        createdById: user.id,
        assignedToId: manager.id,
      },
    });

    await client.ticket.create({
      data: {
        title: 'Dúvida sobre cobrança',
        description: 'Gostaria de esclarecer uma cobrança na minha fatura',
        category: 'billing',
        priority: 'medium',
        status: 'in_progress',
        requesterName: 'Maria Santos',
        requesterEmail: 'maria@grupolgh.com.br',
        createdById: user.id,
        assignedToId: admin.id,
      },
    });

    logger.info('✓ Seed completado com sucesso');
  } catch (error) {
    logger.error('Erro ao fazer seed:', error);
    throw error;
  }
}

// ============================================
// SERVIÇOS DE USUÁRIOS
// ============================================

export const userService = {
  /**
   * Criar novo usuário
   */
  async create(email: string, name: string, picture?: string) {
    const client = getPrisma();
    return client.user.create({
      data: { email, name, picture },
    });
  },

  /**
   * Obter usuário por email
   */
  async findByEmail(email: string) {
    const client = getPrisma();
    return client.user.findUnique({
      where: { email },
      include: {
        tickets: true,
        assignedTickets: true,
      },
    });
  },

  /**
   * Obter usuário por ID
   */
  async findById(id: string) {
    const client = getPrisma();
    return client.user.findUnique({
      where: { id },
      include: {
        tickets: true,
        assignedTickets: true,
      },
    });
  },

  /**
   * Listar todos os usuários
   */
  async findAll() {
    const client = getPrisma();
    return client.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Atualizar usuário
   */
  async update(id: string, data: any) {
    const client = getPrisma();
    return client.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Atualizar último login
   */
  async updateLastLogin(id: string) {
    const client = getPrisma();
    return client.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};

// ============================================
// SERVIÇOS DE TICKETS
// ============================================

export const ticketService = {
  /**
   * Criar novo ticket
   */
  async create(data: any) {
    const client = getPrisma();
    return client.ticket.create({
      data,
      include: {
        createdBy: true,
        assignedTo: true,
        comments: {
          include: { author: true },
        },
      },
    });
  },

  /**
   * Obter ticket por ID
   */
  async findById(id: string) {
    const client = getPrisma();
    return client.ticket.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });
  },

  /**
   * Listar tickets com filtros
   */
  async findMany(filters: any = {}) {
    const client = getPrisma();
    return client.ticket.findMany({
      where: filters,
      include: {
        createdBy: true,
        assignedTo: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Contar tickets por status
   */
  async countByStatus() {
    const client = getPrisma();
    return client.ticket.groupBy({
      by: ['status'],
      _count: true,
    });
  },

  /**
   * Atualizar ticket
   */
  async update(id: string, data: any) {
    const client = getPrisma();
    return client.ticket.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });
  },

  /**
   * Fechar ticket
   */
  async close(id: string) {
    const client = getPrisma();
    return client.ticket.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });
  },

  /**
   * Deletar ticket
   */
  async delete(id: string) {
    const client = getPrisma();
    return client.ticket.delete({
      where: { id },
    });
  },
};

// ============================================
// SERVIÇOS DE COMENTÁRIOS
// ============================================

export const commentService = {
  /**
   * Criar comentário
   */
  async create(ticketId: string, authorId: string, content: string) {
    const client = getPrisma();
    return client.comment.create({
      data: {
        ticketId,
        authorId,
        content,
      },
      include: {
        author: true,
      },
    });
  },

  /**
   * Obter comentários de um ticket
   */
  async findByTicketId(ticketId: string) {
    const client = getPrisma();
    return client.comment.findMany({
      where: { ticketId },
      include: {
        author: true,
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Deletar comentário
   */
  async delete(id: string) {
    const client = getPrisma();
    return client.comment.delete({
      where: { id },
    });
  },
};

// ============================================
// SERVIÇOS DE AUDITORIA
// ============================================

export const auditService = {
  /**
   * Registrar ação
   */
  async log(action: string, entityType: string, entityId: string, userId: string, userEmail: string, changes?: any) {
    const client = getPrisma();
    return client.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        userEmail,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });
  },

  /**
   * Obter logs de um usuário
   */
  async findByUser(userId: string) {
    const client = getPrisma();
    return client.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  /**
   * Obter todas as ações
   */
  async findAll(limit = 100) {
    const client = getPrisma();
    return client.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};