// Vercel Serverless Function — /api/users/export (Exportação de Dados Pessoais em JSON)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Busca exclusivamente os dados do usuário autenticado (Seção 36)
    const [user, library, sessions, notes, quotes, reviews, collections, goals, streak, achievements] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: auth.userId },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            createdAt: true,
            profile: true,
            settings: true
          }
        }),
        prisma.userBook.findMany({
          where: { userId: auth.userId },
          include: { book: true }
        }),
        prisma.readingSession.findMany({
          where: { userId: auth.userId },
          orderBy: { startedAt: 'desc' }
        }),
        prisma.readingNote.findMany({
          where: { userId: auth.userId }
        }),
        prisma.quote.findMany({
          where: { userId: auth.userId }
        }),
        prisma.review.findMany({
          where: { userId: auth.userId }
        }),
        prisma.collection.findMany({
          where: { userId: auth.userId },
          include: { books: { include: { book: true } } }
        }),
        prisma.readingGoal.findMany({
          where: { userId: auth.userId }
        }),
        prisma.readingStreak.findUnique({
          where: { userId: auth.userId }
        }),
        prisma.userAchievement.findMany({
          where: { userId: auth.userId },
          include: { achievement: true }
        })
      ]);

    const backupPayload = {
      app: 'Concha Literária',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user,
      library,
      sessions,
      notes,
      quotes,
      reviews,
      collections,
      goals,
      streak,
      achievements
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="concha-literaria-backup-${auth.username}-${new Date().toISOString().split('T')[0]}.json"`
    );

    return res.status(200).json(backupPayload);
  } catch (error: any) {
    console.error('[API Export] Erro:', error);
    return res.status(500).json({ error: 'Erro ao exportar dados pessoais' });
  }
}
