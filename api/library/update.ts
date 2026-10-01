// Vercel Serverless Function — /api/library/update
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { userBookUpdateSchema } from '../../src/lib/validations';
import { ReadingStatus } from '@prisma/client';

const statusMap: Record<string, ReadingStatus> = {
  want_to_read: ReadingStatus.WANT_TO_READ,
  reading: ReadingStatus.READING,
  read: ReadingStatus.READ,
  rereading: ReadingStatus.REREADING,
  abandoned: ReadingStatus.ABANDONED,
  favorite: ReadingStatus.FAVORITE
};

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;
  const userBookId = id || req.body?.id;

  if (!userBookId) {
    return res.status(400).json({ error: 'ID do livro na biblioteca não fornecido.' });
  }

  // 1. Verificação rigorosa de propriedade (Regra Seção 38)
  const existingUserBook = await prisma.userBook.findUnique({
    where: { id: String(userBookId) },
    include: { book: true }
  });

  if (!existingUserBook) {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }

  if (existingUserBook.userId !== auth.userId) {
    return res.status(403).json({ error: 'Acesso negado: este registro pertence a outro usuário.' });
  }

  // 2. PUT: Atualização de progresso, status, avaliação ou resenha
  if (req.method === 'PUT') {
    try {
      const validation = userBookUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { status, currentPage, rating, isFavorite, reviewText, reviewSpoiler } = validation.data;
      const prismaStatus = status ? statusMap[status] : undefined;

      // Se mudou para READ, preenche finishDate
      const finishDate =
        prismaStatus === ReadingStatus.READ && existingUserBook.status !== ReadingStatus.READ
          ? new Date()
          : undefined;

      const updated = await prisma.$transaction(async (tx) => {
        const ub = await tx.userBook.update({
          where: { id: existingUserBook.id },
          data: {
            ...(prismaStatus && { status: prismaStatus }),
            ...(currentPage !== undefined && { currentPage }),
            ...(rating !== undefined && { rating }),
            ...(isFavorite !== undefined && { isFavorite }),
            ...(finishDate && { finishDate })
          },
          include: { book: true }
        });

        // Se houver resenha, cria ou atualiza
        if (reviewText) {
          await tx.review.upsert({
            where: {
              id: existingUserBook.id // Usa chave única se disponível ou busca por book/user
            },
            create: {
              userId: auth.userId,
              bookId: existingUserBook.bookId,
              userBookId: existingUserBook.id,
              content: reviewText,
              rating: rating ?? existingUserBook.rating ?? 5.0,
              isSpoiler: reviewSpoiler ?? false,
              visibility: 'PUBLIC'
            },
            update: {
              content: reviewText,
              ...(rating !== undefined && { rating }),
              ...(reviewSpoiler !== undefined && { isSpoiler: reviewSpoiler })
            }
          });
        }

        return ub;
      });

      return res.status(200).json({
        message: 'Livro atualizado com sucesso',
        userBook: updated
      });
    } catch (error: any) {
      console.error('[API Library PUT] Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar livro' });
    }
  }

  // 3. DELETE: Remover livro da biblioteca
  if (req.method === 'DELETE') {
    try {
      await prisma.userBook.delete({
        where: { id: existingUserBook.id }
      });
      return res.status(200).json({ message: 'Livro removido da sua biblioteca com sucesso.' });
    } catch (error: any) {
      console.error('[API Library DELETE] Erro:', error);
      return res.status(500).json({ error: 'Erro ao remover livro' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
