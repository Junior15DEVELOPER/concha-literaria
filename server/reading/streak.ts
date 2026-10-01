// Vercel Serverless Function — /api/reading/streak
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
    const streak = await prisma.readingStreak.findUnique({
      where: { userId: auth.userId }
    });

    if (!streak) {
      return res.status(200).json({
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        activeDates: []
      });
    }

    return res.status(200).json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastReadDate: streak.lastReadDate,
      activeDates: streak.activeDates
    });
  } catch (error: any) {
    console.error('[API Streak GET] Erro:', error);
    return res.status(500).json({ error: 'Erro ao buscar streak' });
  }
}
