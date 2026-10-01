// Vercel Serverless Function — /api/social/follow (Seguir e Deixar de Seguir)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { NotificationType } from '@prisma/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para seguir outros leitores.' });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId é obrigatório' });
  }

  if (targetUserId === auth.userId) {
    return res.status(400).json({ error: 'Você não pode seguir a si mesmo' });
  }

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId: String(targetUserId)
        }
      }
    });

    let following = false;

    if (existingFollow) {
      // Deixar de seguir
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      following = false;
    } else {
      // Seguir
      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            followerId: auth.userId,
            followingId: String(targetUserId)
          }
        });

        // Notificação de novo seguidor
        await tx.notification.create({
          data: {
            userId: String(targetUserId),
            actorId: auth.userId,
            type: NotificationType.NEW_FOLLOWER,
            title: 'Novo seguidor',
            message: 'começou a seguir suas leituras na Concha Literária.',
            linkUrl: `/u/${auth.username}`
          }
        });
      });
      following = true;
    }

    return res.status(200).json({
      following,
      message: following ? 'Agora você está seguindo este leitor.' : 'Você deixou de seguir este leitor.'
    });
  } catch (error: any) {
    console.error('[API Follow] Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar ação de seguir' });
  }
}
