// Vercel Serverless Function — /api/social/comments (Comentários e Respostas Aninhadas)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { z } from 'zod';
import { NotificationType } from '@prisma/client';

const addCommentSchema = z.object({
  postId: z.string().min(1, 'ID do post é obrigatório'),
  content: z.string().min(1, 'O comentário não pode ser vazio').max(1000, 'Máximo de 1000 caracteres'),
  parentId: z.string().optional() // Suporte a comentários aninhados (Seção 29)
});

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);

  // 1. GET: Listar comentários do post com paginação e suporte aninhado
  if (req.method === 'GET') {
    const { postId, page = '1', limit = '20' } = req.query;
    if (!postId) {
      return res.status(400).json({ error: 'postId é obrigatório' });
    }

    try {
      const take = Math.min(parseInt(String(limit), 10) || 20, 50);
      const skip = (Math.max(parseInt(String(page), 10) || 1, 1) - 1) * take;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            postId: String(postId),
            parentId: null // Retorna raízes primeiro
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile: { select: { avatarUrl: true } }
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    profile: { select: { avatarUrl: true } }
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' },
          take,
          skip
        }),
        prisma.comment.count({
          where: { postId: String(postId), parentId: null }
        })
      ]);

      return res.status(200).json({
        comments,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error: any) {
      console.error('[API Comments GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
  }

  // 2. POST: Adicionar comentário ou resposta
  if (req.method === 'POST') {
    if (!auth) {
      return res.status(401).json({ error: 'Não autorizado. Entre na sua conta para comentar.' });
    }

    try {
      const validation = addCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { postId, content, parentId } = validation.data;

      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(404).json({ error: 'Publicação não encontrada' });
      }

      const newComment = await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
          data: {
            userId: auth.userId,
            postId,
            content,
            parentId: parentId || null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile: { select: { avatarUrl: true } }
              }
            }
          }
        });

        // Incrementa contador do post
        await tx.post.update({
          where: { id: postId },
          data: { commentCount: { increment: 1 } }
        });

        // Notifica o dono da publicação
        if (post.userId !== auth.userId) {
          await tx.notification.create({
            data: {
              userId: post.userId,
              actorId: auth.userId,
              type: NotificationType.POST_COMMENT,
              title: 'Novo comentário',
              message: 'comentou na sua publicação.',
              linkUrl: `/post/${postId}`
            }
          });
        }

        return comment;
      });

      return res.status(201).json({
        message: 'Comentário adicionado com sucesso',
        comment: newComment
      });
    } catch (error: any) {
      console.error('[API Comments POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao publicar comentário' });
    }
  }

  // 3. DELETE: Excluir próprio comentário (Seção 29)
  if (req.method === 'DELETE') {
    if (!auth) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID do comentário é obrigatório' });
    }

    try {
      const comment = await prisma.comment.findUnique({
        where: { id: String(id) }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comentário não encontrado' });
      }

      // Regra de segurança: apenas o autor pode excluir seu comentário
      if (comment.userId !== auth.userId) {
        return res.status(403).json({ error: 'Acesso negado: você só pode excluir comentários criados por você.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.comment.delete({ where: { id: comment.id } });
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } }
        });
      });

      return res.status(200).json({ message: 'Comentário excluído com sucesso.' });
    } catch (error: any) {
      console.error('[API Comments DELETE] Erro:', error);
      return res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
