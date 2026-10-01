// Vercel Serverless Function — /api/library/index
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { bookSchema, readingStatusEnum } from '../../src/lib/validations';
import { z } from 'zod';
import { ReadingStatus } from '@prisma/client';

const addBookToLibrarySchema = z.object({
  book: bookSchema,
  status: readingStatusEnum.default('want_to_read'),
  currentPage: z.number().int().min(0).default(0)
});

// Mapeamento do enum local para o enum do Prisma
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
    return res.status(401).json({ error: 'Não autorizado. Faça login para acessar sua estante.' });
  }

  // 1. GET: Listar livros da estante com filtros e ordenação
  if (req.method === 'GET') {
    try {
      const { status, search, sortBy = 'recent', page = '1', limit = '50' } = req.query;

      const take = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
      const skip = (Math.max(parseInt(String(page), 10) || 1, 1) - 1) * take;

      const where: any = {
        userId: auth.userId
      };

      if (status && status !== 'all') {
        const prismaStatus = statusMap[String(status)];
        if (prismaStatus) where.status = prismaStatus;
      }

      if (search) {
        where.book = {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { authors: { has: String(search) } }
          ]
        };
      }

      const orderBy: any = {};
      switch (sortBy) {
        case 'title':
          orderBy.book = { title: 'asc' };
          break;
        case 'rating':
          orderBy.rating = 'desc';
          break;
        case 'progress':
          orderBy.currentPage = 'desc';
          break;
        case 'recent':
        default:
          orderBy.updatedAt = 'desc';
          break;
      }

      const [userBooks, totalCount] = await Promise.all([
        prisma.userBook.findMany({
          where,
          include: {
            book: true,
            _count: {
              select: {
                notes: true,
                sessions: true
              }
            }
          },
          orderBy,
          take,
          skip
        }),
        prisma.userBook.count({ where })
      ]);

      return res.status(200).json({
        items: userBooks,
        pagination: {
          total: totalCount,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(totalCount / take)
        }
      });
    } catch (error: any) {
      console.error('[API Library GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao carregar biblioteca' });
    }
  }

  // 2. POST: Adicionar livro à biblioteca (com cache da obra na tabela Book)
  if (req.method === 'POST') {
    try {
      const validation = addBookToLibrarySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Dados do livro inválidos',
          issues: validation.error.flatten().fieldErrors
        });
      }

      const { book: bookData, status, currentPage } = validation.data;
      const prismaStatus = statusMap[status] || ReadingStatus.WANT_TO_READ;

      // Localizar obra existente por ISBN ou criar nova obra (Seção 14 e Seção 25)
      let existingBook = null;
      if (bookData.isbn13) {
        existingBook = await prisma.book.findUnique({ where: { isbn13: bookData.isbn13 } });
      }
      if (!existingBook && bookData.id) {
        existingBook = await prisma.book.findUnique({ where: { id: bookData.id } });
      }

      const targetBook =
        existingBook ||
        (await prisma.book.create({
          data: {
            title: bookData.title,
            subtitle: bookData.subtitle || null,
            authors: bookData.authors,
            isbn10: bookData.isbn10 || null,
            isbn13: bookData.isbn13 || null,
            publisher: bookData.publisher || null,
            publishedYear: bookData.publishedYear || null,
            pageCount: bookData.pageCount,
            coverUrl: bookData.coverUrl || null,
            description: bookData.description || null,
            categories: bookData.categories || [],
            language: bookData.language || 'pt'
          }
        }));

      // Cria ou atualiza o vínculo do usuário com o livro (UserBook)
      const userBook = await prisma.userBook.upsert({
        where: {
          userId_bookId: {
            userId: auth.userId,
            bookId: targetBook.id
          }
        },
        create: {
          userId: auth.userId,
          bookId: targetBook.id,
          status: prismaStatus,
          currentPage: currentPage || 0,
          startDate: prismaStatus === ReadingStatus.READING ? new Date() : null,
          finishDate: prismaStatus === ReadingStatus.READ ? new Date() : null
        },
        update: {
          status: prismaStatus,
          currentPage: currentPage !== undefined ? currentPage : undefined
        },
        include: {
          book: true
        }
      });

      return res.status(201).json({
        message: 'Livro adicionado à estante com sucesso',
        userBook
      });
    } catch (error: any) {
      console.error('[API Library POST] Erro:', error);
      return res.status(500).json({ error: 'Erro ao adicionar livro à biblioteca' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
