// Vercel Serverless Function — /api/users/profile
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { updateProfileSchema } from '../../src/lib/validations';

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);

  // 1. GET: Consultar perfil por username ou do próprio usuário autenticado
  if (req.method === 'GET') {
    const { username, id } = req.query;

    try {
      const whereCondition = username
        ? { username: String(username).toLowerCase() }
        : id
        ? { id: String(id) }
        : auth
        ? { id: auth.userId }
        : null;

      if (!whereCondition) {
        return res.status(400).json({ error: 'Informe um username, id ou faça login.' });
      }

      const user = await prisma.user.findUnique({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          profile: true,
          settings: true,
          streak: true,
          _count: {
            select: {
              library: true,
              quotes: true,
              notes: true,
              followers: true,
              following: true,
              achievements: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Regra de Privacidade (Seção 11): Se perfil for privado e não for o próprio dono
      const isOwner = auth?.userId === user.id;
      if (!isOwner && user.settings?.profileVisibility === 'PRIVATE') {
        return res.status(403).json({
          error: 'Este perfil é privado.',
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            profile: {
              isPublic: false
            }
          }
        });
      }

      return res.status(200).json({ user, isOwner });
    } catch (error: any) {
      console.error('[API Profile GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao consultar perfil' });
    }
  }

  // 2. PUT: Atualizar dados de perfil (Requer autenticação)
  if (req.method === 'PUT') {
    if (!auth) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const {
        name,
        bio,
        avatarUrl,
        readingGoalYear,
        dailyMinutesGoal,
        dailyPagesGoal,
        themePreference,
        isPublic
      } = validation.data;

      // Atualiza Usuário e Perfil em transação
      const updatedUser = await prisma.$transaction(async (tx) => {
        if (name) {
          await tx.user.update({
            where: { id: auth.userId },
            data: { name }
          });
        }

        const profile = await tx.profile.upsert({
          where: { userId: auth.userId },
          create: {
            userId: auth.userId,
            bio,
            avatarUrl,
            readingGoalYear: readingGoalYear ?? 24,
            dailyMinutesGoal: dailyMinutesGoal ?? 30,
            dailyPagesGoal: dailyPagesGoal ?? 20,
            themePreference: themePreference ?? 'light',
            isPublic: isPublic ?? true
          },
          update: {
            ...(bio !== undefined && { bio }),
            ...(avatarUrl !== undefined && { avatarUrl }),
            ...(readingGoalYear !== undefined && { readingGoalYear }),
            ...(dailyMinutesGoal !== undefined && { dailyMinutesGoal }),
            ...(dailyPagesGoal !== undefined && { dailyPagesGoal }),
            ...(themePreference !== undefined && { themePreference }),
            ...(isPublic !== undefined && { isPublic })
          }
        });

        return profile;
      });

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        profile: updatedUser
      });
    } catch (error: any) {
      console.error('[API Profile PUT] Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
