// Vercel Serverless Function — /api/reading/session
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { readingSessionCreateSchema } from '../../src/lib/validations';
import { ReadingStatus, PostType, NotificationType } from '@prisma/client';

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para registrar suas sessões.' });
  }

  // 1. GET: Histórico de sessões do usuário
  if (req.method === 'GET') {
    try {
      const { userBookId, limit = '20' } = req.query;

      const where: any = { userId: auth.userId };
      if (userBookId) where.userBookId = String(userBookId);

      const sessions = await prisma.readingSession.findMany({
        where,
        include: {
          book: {
            select: { id: true, title: true, coverUrl: true, pageCount: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: Math.min(parseInt(String(limit), 10) || 20, 100)
      });

      return res.status(200).json({ sessions });
    } catch (error: any) {
      console.error('[API ReadingSession GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de leitura' });
    }
  }

  // 2. POST: Finalizar sessão e transacionar atomicamente (Seção 49)
  if (req.method === 'POST') {
    try {
      const validation = readingSessionCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados da sessão inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const {
        userBookId,
        bookId,
        startPage,
        endPage,
        durationSeconds,
        startedAt,
        endedAt,
        notes,
        mood
      } = validation.data;

      // Validação de segurança e posse
      const userBook = await prisma.userBook.findUnique({
        where: { id: userBookId },
        include: { book: true }
      });

      if (!userBook || userBook.userId !== auth.userId) {
        return res.status(403).json({ error: 'Acesso negado: livro não pertence ao usuário.' });
      }

      const pagesRead = Math.max(endPage - startPage, 0);
      const isBookCompleted = endPage >= userBook.book.pageCount;

      // TRANSAÇÃO ATÔMICA DO BANCO (Seção 49)
      const result = await prisma.$transaction(async (tx) => {
        // A. Criação da ReadingSession
        const session = await tx.readingSession.create({
          data: {
            userId: auth.userId,
            userBookId,
            bookId,
            startPage,
            endPage,
            pagesRead,
            durationSeconds,
            startedAt: new Date(startedAt),
            endedAt: new Date(endedAt),
            notes: notes || null,
            mood: mood || null
          }
        });

        // B. Atualização do UserBook
        const updatedUserBook = await tx.userBook.update({
          where: { id: userBookId },
          data: {
            currentPage: endPage,
            totalReadingMs: { increment: durationSeconds * 1000 },
            ...(isBookCompleted && {
              status: ReadingStatus.READ,
              finishDate: new Date()
            }),
            ...(!isBookCompleted && userBook.status === ReadingStatus.WANT_TO_READ && {
              status: ReadingStatus.READING,
              startDate: new Date()
            })
          }
        });

        // C. Atualização do Streak com verificação rigorosa (Seção 17)
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let streak = await tx.readingStreak.findUnique({
          where: { userId: auth.userId }
        });

        if (!streak) {
          streak = await tx.readingStreak.create({
            data: {
              userId: auth.userId,
              currentStreak: 1,
              longestStreak: 1,
              lastReadDate: new Date(),
              activeDates: [todayStr]
            }
          });
        } else if (!streak.activeDates.includes(todayStr) && durationSeconds >= 60) {
          // Sessão válida de pelo menos 1 minuto
          const hadReadYesterday = streak.activeDates.includes(yesterdayStr);
          const newCurrent = hadReadYesterday ? streak.currentStreak + 1 : 1;
          const newLongest = Math.max(newCurrent, streak.longestStreak);

          streak = await tx.readingStreak.update({
            where: { userId: auth.userId },
            data: {
              currentStreak: newCurrent,
              longestStreak: newLongest,
              lastReadDate: new Date(),
              activeDates: [...streak.activeDates, todayStr]
            }
          });
        }

        // D. Verificação e Desbloqueio Automático de Conquistas (Seção 19)
        const unlockedAchievements: string[] = [];

        // Conquista: Primeira Leitura
        const totalUserSessions = await tx.readingSession.count({ where: { userId: auth.userId } });
        if (totalUserSessions === 1) {
          unlockedAchievements.push('first_session');
        }

        // Conquista: Primeiro Livro Concluído
        if (isBookCompleted) {
          unlockedAchievements.push('first_book_finished');
        }

        // Conquista: 7 Dias Seguidos
        if (streak.currentStreak >= 7) {
          unlockedAchievements.push('streak_7_days');
        }

        // Conquista: 30 Dias Seguidos
        if (streak.currentStreak >= 30) {
          unlockedAchievements.push('streak_30_days');
        }

        // Conquista: Leitor Noturno (sessão entre 00:00 e 05:00)
        const sessionHour = new Date(startedAt).getHours();
        if (sessionHour >= 0 && sessionHour < 5) {
          unlockedAchievements.push('night_reader');
        }

        // Salvar conquistas novas
        for (const achId of unlockedAchievements) {
          const alreadyUnlocked = await tx.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId: auth.userId,
                achievementId: achId
              }
            }
          });

          if (!alreadyUnlocked) {
            await tx.userAchievement.create({
              data: {
                userId: auth.userId,
                achievementId: achId
              }
            });

            // Notificação de conquista
            await tx.notification.create({
              data: {
                userId: auth.userId,
                type: NotificationType.ACHIEVEMENT_UNLOCKED,
                title: 'Conquista Desbloqueada! 🏆',
                message: `Você conquistou um novo marco de leitura.`
              }
            });
          }
        }

        // E. Post automático no Feed se o livro foi finalizado (Seção 26)
        if (isBookCompleted) {
          await tx.post.create({
            data: {
              userId: auth.userId,
              type: PostType.BOOK_FINISHED,
              bookId: userBook.bookId,
              content: `Finalizou a leitura de "${userBook.book.title}"! 🎉`
            }
          });
        }

        return { session, updatedUserBook, streak, unlockedAchievements };
      });

      return res.status(201).json({
        message: 'Sessão registrada com sucesso',
        data: result
      });
    } catch (error: any) {
      console.error('[API ReadingSession POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao registrar sessão de leitura' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
