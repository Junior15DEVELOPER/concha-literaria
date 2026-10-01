// Vercel Serverless Function — /api/achievements/index
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);

  try {
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { xpReward: 'asc' }
    });

    let userUnlockedIds = new Set<string>();
    let unlockedMap = new Map<string, Date>();

    if (auth) {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: auth.userId }
      });
      userAchievements.forEach((ua) => {
        userUnlockedIds.add(ua.achievementId);
        unlockedMap.set(ua.achievementId, ua.unlockedAt);
      });
    }

    const items = allAchievements.map((ach) => ({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      category: ach.category,
      iconName: ach.iconName,
      xpReward: ach.xpReward,
      isUnlocked: userUnlockedIds.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null
    }));

    const totalUnlocked = items.filter((i) => i.isUnlocked).length;
    const totalXp = items
      .filter((i) => i.isUnlocked)
      .reduce((acc, i) => acc + i.xpReward, 0);

    return res.status(200).json({
      achievements: items,
      stats: {
        total: items.length,
        unlockedCount: totalUnlocked,
        percentage: items.length > 0 ? Math.round((totalUnlocked / items.length) * 100) : 0,
        totalXp
      }
    });
  } catch (error: any) {
    console.error('[API Achievements GET] Erro:', error);
    return res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
}
