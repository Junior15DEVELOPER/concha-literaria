// Vercel Serverless Function — /api/collections/manage
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;
  const collectionId = id || req.body?.id;

  if (!collectionId) {
    return res.status(400).json({ error: 'ID da coleção não fornecido' });
  }

  // Verificação de posse
  const collection = await prisma.collection.findUnique({
    where: { id: String(collectionId) }
  });

  if (!collection) {
    return res.status(404).json({ error: 'Coleção não encontrada' });
  }

  if (collection.userId !== auth.userId) {
    return res.status(403).json({ error: 'Acesso negado: esta coleção pertence a outro usuário.' });
  }

  // 1. PUT: Atualizar metadados ou adicionar/remover livros
  if (req.method === 'PUT') {
    try {
      const { name, description, color, addBookId, removeBookId } = req.body;

      if (addBookId) {
        await prisma.collectionBook.upsert({
          where: {
            collectionId_bookId: {
              collectionId: collection.id,
              bookId: String(addBookId)
            }
          },
          create: {
            collectionId: collection.id,
            bookId: String(addBookId)
          },
          update: {}
        });
      }

      if (removeBookId) {
        await prisma.collectionBook.deleteMany({
          where: {
            collectionId: collection.id,
            bookId: String(removeBookId)
          }
        });
      }

      const updated = await prisma.collection.update({
        where: { id: collection.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(color && { color })
        },
        include: {
          books: { include: { book: true } }
        }
      });

      return res.status(200).json({
        message: 'Coleção atualizada com sucesso',
        collection: updated
      });
    } catch (error: any) {
      console.error('[API Collections Manage PUT] Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar coleção' });
    }
  }

  // 2. DELETE: Excluir coleção
  if (req.method === 'DELETE') {
    try {
      await prisma.collection.delete({
        where: { id: collection.id }
      });
      return res.status(200).json({ message: 'Coleção excluída com sucesso.' });
    } catch (error: any) {
      console.error('[API Collections Manage DELETE] Erro:', error);
      return res.status(500).json({ error: 'Erro ao excluir coleção' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
