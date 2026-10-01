// Vercel Serverless Function — /api/social/like (Curtidas Reais com Toggle Atômico)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { NotificationType } from '@prisma/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para curtir publicações.' });
  }

  const { postId } = req.body;
  if (!postId) {
    return res.status(400).json({ error: 'ID da publicação é obrigatório' });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: String(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Publicação não encontrada' });
    }

    // Toggle atômico (Seção 28)
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: auth.userId,
          postId: post.id
        }
      }
    });

    let liked = false;

    await prisma.$transaction(async (tx) => {
      if (existingLike) {
        // Descurtir
        await tx.like.delete({
          where: { id: existingLike.id }
        });
        await tx.post.update({
          where: { id: post.id },
          data: { likesCount: { decrement: 1 } }
        });
        liked = false;
      } else {
        // Curtir
        await tx.like.create({
          data: {
            userId: auth.userId,
            postId: post.id
          }
        });
        await tx.post.update({
          where: { id: post.id },
          data: { likesCount: { increment: 1 } }
        });
        liked = true;

        // Criar notificação para o autor do post (se não for o próprio leitor)
        if (post.userId !== auth.userId) {
          await tx.notification.create({
            data: {
              userId: post.userId,
              actorId: auth.userId,
              type: NotificationType.POST_LIKE,
              title: 'Nova curtida',
              message: 'curtiu sua publicação.',
              linkUrl: `/post/${post.id}`
            }
          });
        }
      }
    });

    // Retorna a contagem atualizada oficial do banco
    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
      select: { likesCount: true }
    });

    return res.status(200).json({
      liked,
      likesCount: updatedPost?.likesCount || 0
    });
  } catch (error: any) {
    console.error('[API Social Like] Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar curtida' });
  }
}
