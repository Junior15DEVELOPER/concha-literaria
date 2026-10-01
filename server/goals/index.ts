// Vercel Serverless Function — /api/goals/index
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { z } from 'zod';
import { GoalFrequency, GoalType } from '@prisma/client';

const goalSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  type: z.enum(['PAGES', 'MINUTES', 'BOOKS']),
  targetValue: z.number().int().min(1, 'A meta deve ser maior que 0'),
  year: z.number().int().optional(),
  month: z.number().int().optional()
});

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // 1. GET: Consultar metas e calcular progresso real atual
  if (req.method === 'GET') {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentYear = now.getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      // Metas salvas no perfil e metas personalizadas
      const [profile, customGoals, todaySessions, yearlyReadBooks] = await Promise.all([
        prisma.profile.findUnique({ where: { userId: auth.userId } }),
        prisma.readingGoal.findMany({ where: { userId: auth.userId } }),
        prisma.readingSession.findMany({
          where: {
            userId: auth.userId,
            startedAt: { gte: todayStart }
          }
        }),
        prisma.userBook.count({
          where: {
            userId: auth.userId,
            status: 'READ',
            finishDate: { gte: yearStart }
          }
        })
      ]);

      const minutesToday = Math.floor(
        todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
      );
      const pagesToday = todaySessions.reduce((acc, s) => acc + s.pagesRead, 0);

      const targetYearlyBooks = profile?.readingGoalYear || 24;
      const targetDailyMinutes = profile?.dailyMinutesGoal || 30;
      const targetDailyPages = profile?.dailyPagesGoal || 20;

      return res.status(200).json({
        summary: {
          dailyMinutes: {
            current: minutesToday,
            target: targetDailyMinutes,
            percentage: Math.min(Math.round((minutesToday / targetDailyMinutes) * 100), 100)
          },
          dailyPages: {
            current: pagesToday,
            target: targetDailyPages,
            percentage: Math.min(Math.round((pagesToday / targetDailyPages) * 100), 100)
          },
          yearlyBooks: {
            current: yearlyReadBooks,
            target: targetYearlyBooks,
            percentage: Math.min(Math.round((yearlyReadBooks / targetYearlyBooks) * 100), 100)
          }
        },
        customGoals
      });
    } catch (error: any) {
      console.error('[API Goals GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao calcular metas de leitura' });
    }
  }

  // 2. POST: Criar nova meta personalizada
  if (req.method === 'POST') {
    try {
      const validation = goalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados da meta inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { frequency, type, targetValue, year, month } = validation.data;

      const newGoal = await prisma.readingGoal.create({
        data: {
          userId: auth.userId,
          frequency: frequency as GoalFrequency,
          type: type as GoalType,
          targetValue,
          year: year || new Date().getFullYear(),
          month: month || undefined
        }
      });

      return res.status(201).json({
        message: 'Meta criada com sucesso',
        goal: newGoal
      });
    } catch (error: any) {
      console.error('[API Goals POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao criar meta' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
