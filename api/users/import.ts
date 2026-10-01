// Vercel Serverless Function — /api/users/import (Importação Segura com Validação e Confirmação)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';
import { ReadingStatus } from '@prisma/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { backupData, action = 'preview' } = req.body;

  if (!backupData || typeof backupData !== 'object') {
    return res.status(400).json({ error: 'Arquivo ou conteúdo de backup JSON inválido.' });
  }

  try {
    const rawLibrary = Array.isArray(backupData.library) ? backupData.library : [];
    const rawSessions = Array.isArray(backupData.sessions) ? backupData.sessions : [];
    const rawQuotes = Array.isArray(backupData.quotes) ? backupData.quotes : [];
    const rawNotes = Array.isArray(backupData.notes) ? backupData.notes : [];

    // 1. AÇÃO 'PREVIEW': Valida e reporta ao leitor sem modificar o banco
    if (action === 'preview') {
      const existingUserBooks = await prisma.userBook.findMany({
        where: { userId: auth.userId },
        include: { book: true }
      });

      const existingTitles = new Set(existingUserBooks.map((ub) => ub.book.title.toLowerCase().trim()));
      const duplicateBooks: string[] = [];
      const newBooks: string[] = [];

      rawLibrary.forEach((item: any) => {
        const title = (item.book?.title || item.title || '').toLowerCase().trim();
        if (title) {
          if (existingTitles.has(title)) {
            duplicateBooks.push(item.book?.title || item.title);
          } else {
            newBooks.push(item.book?.title || item.title);
          }
        }
      });

      return res.status(200).json({
        valid: true,
        report: {
          totalBooksInBackup: rawLibrary.length,
          newBooksCount: newBooks.length,
          duplicateBooksCount: duplicateBooks.length,
          duplicateBooksList: duplicateBooks.slice(0, 5),
          sessionsCount: rawSessions.length,
          quotesCount: rawQuotes.length,
          notesCount: rawNotes.length
        },
        message: 'Backup validado com sucesso. Confirme para prosseguir com a mesclagem segura.'
      });
    }

    // 2. AÇÃO 'COMMIT': Importação confirmada pelo usuário
    if (action === 'commit') {
      let importedBooks = 0;
      let importedQuotes = 0;

      await prisma.$transaction(async (tx) => {
        for (const item of rawLibrary) {
          const bookData = item.book || item;
          if (!bookData.title) continue;

          // Cria ou reutiliza Book
          let book = null;
          if (bookData.isbn13) {
            book = await tx.book.findUnique({ where: { isbn13: bookData.isbn13 } });
          }
          if (!book) {
            book = await tx.book.create({
              data: {
                title: bookData.title,
                authors: Array.isArray(bookData.authors) ? bookData.authors : [bookData.author || 'Autor Desconhecido'],
                pageCount: bookData.pageCount || 200,
                coverUrl: bookData.coverUrl || null,
                categories: Array.isArray(bookData.categories) ? bookData.categories : [],
                language: 'pt'
              }
            });
          }

          // Insere UserBook
          const status = (item.status?.toUpperCase() in ReadingStatus)
            ? (item.status.toUpperCase() as ReadingStatus)
            : ReadingStatus.WANT_TO_READ;

          await tx.userBook.upsert({
            where: {
              userId_bookId: {
                userId: auth.userId,
                bookId: book.id
              }
            },
            create: {
              userId: auth.userId,
              bookId: book.id,
              status,
              currentPage: item.currentPage || 0,
              rating: item.rating || null,
              isFavorite: Boolean(item.isFavorite)
            },
            update: {
              // Preserva dados sem sobrescrever silenciosamente se já existente
            }
          });
          importedBooks++;
        }

        // Importa citações
        for (const q of rawQuotes) {
          if (!q.text) continue;
          await tx.quote.create({
            data: {
              userId: auth.userId,
              bookTitle: q.bookTitle || 'Obra',
              author: q.author || q.bookAuthor || 'Autor',
              text: q.text,
              page: q.page || null,
              context: q.context || q.characterOrContext || null,
              visibility: 'PUBLIC'
            }
          });
          importedQuotes++;
        }
      });

      return res.status(200).json({
        message: 'Importação concluída com sucesso!',
        importedBooks,
        importedQuotes
      });
    }

    return res.status(400).json({ error: 'Ação inválida. Use preview ou commit.' });
  } catch (error: any) {
    console.error('[API Import] Erro:', error);
    return res.status(500).json({ error: 'Erro durante o processamento da importação' });
  }
}
