// ============================================
// backend/prisma/seed.ts
// Seed do banco de dados

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seedando banco de dados...');

  // Limpa dados existentes
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Cria usuários
  const admin = await prisma.user.create({
    data: {
      email: 'admin@grupolgh.com.br',
      name: 'Administrador',
      role: 'admin',
    },
  });

  const support = await prisma.user.create({
    data: {
      email: 'support@grupolgh.com.br',
      name: 'Suporte Técnico',
      role: 'manager',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'usuario@grupolgh.com.br',
      name: 'João Silva',
      role: 'user',
    },
  });

  // Cria tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Login não funciona',
      description:
        'Não consigo fazer login na aplicação. Recebo erro 401.',
      category: 'technical',
      priority: 'high',
      status: 'open',
      requesterName: 'João Silva',
      requesterEmail: 'joao@grupolgh.com.br',
      createdById: user.id,
      assignedToId: support.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Problema na cobrança',
      description:
        'Fui cobrado duas vezes no mês passado.',
      category: 'billing',
      priority: 'medium',
      status: 'in_progress',
      requesterName: 'Maria Santos',
      requesterEmail: 'maria@grupolgh.com.br',
      createdById: user.id,
      assignedToId: admin.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Funcionalidade X não está funcionando',
      description:
        'A funcionalidade de relatórios não gera PDF.',
      category: 'technical',
      priority: 'medium',
      status: 'resolved',
      requesterName: 'Pedro Costa',
      requesterEmail: 'pedro@grupolgh.com.br',
      createdById: user.id,
      assignedToId: support.id,
      closedAt: new Date(),
    },
  });

  // Cria comentários
  await prisma.comment.create({
    data: {
      content:
        'Estou investigando este problema. Vou atualizar em breve.',
      ticketId: ticket1.id,
      authorId: support.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Consegui reproduzir o erro. É um problema com o CORS.',
      ticketId: ticket1.id,
      authorId: support.id,
    },
  });

  console.log('✓ Seed completado!');
  console.log('📊 Dados criados:');
  console.log(`  - ${3} usuários`);
  console.log(`  - ${3} tickets`);
  console.log(`  - ${2} comentários`);
}

main()
  .catch((e) => {
    console.error('Erro ao fazer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
