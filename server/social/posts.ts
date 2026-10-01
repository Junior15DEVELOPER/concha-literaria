// Vercel Serverless Function — /api/social/posts (Feed Social Real)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { z } from 'zod';
import { PostType } from '@prisma/client';

const createPostSchema = z.object({
  type: z.enum([
    'BOOK_FINISHED',
    'BOOK_STARTED',
    'STREAK_MILESTONE',
    'ACHIEVEMENT_UNLOCKED',
    'REVIEW_POSTED',
    'QUOTE_SHARED',
    'CUSTOM_THOUGHT'
  ]).default('CUSTOM_THOUGHT'),
  content: z.string().min(1, 'O conteúdo do post não pode ser vazio').max(2000),
  bookId: z.string().optional(),
  hasSpoiler: z.boolean().default(false)
});

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);

  // 1. GET: Feed cronológico real paginado (Seção 27)
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20' } = req.query;
      const take = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);
      const skip = (Math.max(parseInt(String(page), 10) || 1, 1) - 1) * take;

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profile: {
                  select: { avatarUrl: true }
                }
              }
            },
            likes: auth ? { where: { userId: auth.userId } } : false,
            _count: {
              select: { likes: true, comments: true }
            }
          }
        }),
        prisma.post.count()
      ]);

      const formatted = posts.map((post) => ({
        id: post.id,
        userId: post.userId,
        userName: post.user.name,
        userHandle: `@${post.user.username}`,
        userAvatar: post.user.profile?.avatarUrl || null,
        type: post.type,
        content: post.content,
        bookId: post.bookId,
        hasSpoiler: post.hasSpoiler,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLikedByMe: auth ? (post.likes && post.likes.length > 0) : false,
        createdAt: post.createdAt
      }));

      return res.status(200).json({
        posts: formatted,
        pagination: {
          total: totalCount,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(totalCount / take)
        }
      });
    } catch (error: any) {
      console.error('[API Social Posts GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao carregar feed social' });
    }
  }

  // 2. POST: Criar nova publicação (Requer autenticação)
  if (req.method === 'POST') {
    if (!auth) {
      return res.status(401).json({ error: 'Não autorizado. Entre na sua conta para publicar.' });
    }

    try {
      const validation = createPostSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados da publicação inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { type, content, bookId, hasSpoiler } = validation.data;

      const post = await prisma.post.create({
        data: {
          userId: auth.userId,
          type: type as PostType,
          content,
          bookId: bookId || null,
          hasSpoiler
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

      return res.status(201).json({
        message: 'Publicação criada com sucesso',
        post: {
          id: post.id,
          userId: post.userId,
          userName: post.user.name,
          userHandle: `@${post.user.username}`,
          userAvatar: post.user.profile?.avatarUrl,
          type: post.type,
          content: post.content,
          likesCount: 0,
          commentsCount: 0,
          isLikedByMe: false,
          createdAt: post.createdAt
        }
      });
    } catch (error: any) {
      console.error('[API Social Posts POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao criar publicação' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
