// Vercel Serverless Function — /api/collections/index
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { z } from 'zod';

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Nome da coleção é obrigatório').max(100),
  description: z.string().max(300).optional(),
  color: z.string().default('#9C3826'),
  coverUrl: z.string().url().optional().or(z.literal(''))
});

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // GET: Listar coleções do usuário
  if (req.method === 'GET') {
    try {
      const collections = await prisma.collection.findMany({
        where: { userId: auth.userId },
        include: {
          books: {
            include: { book: true },
            orderBy: { order: 'asc' }
          },
          _count: { select: { books: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ collections });
    } catch (error: any) {
      console.error('[API Collections GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao listar coleções' });
    }
  }

  // POST: Criar nova coleção
  if (req.method === 'POST') {
    try {
      const validation = createCollectionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { name, description, color, coverUrl } = validation.data;

      const newCollection = await prisma.collection.create({
        data: {
          userId: auth.userId,
          name,
          description,
          color,
          coverUrl: coverUrl || null
        }
      });

      return res.status(201).json({
        message: 'Coleção criada com sucesso',
        collection: newCollection
      });
    } catch (error: any) {
      console.error('[API Collections POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao criar coleção' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
