// Vercel Serverless Function — /api/statistics/index (Estatísticas & Concha Rewind)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { year } = req.query;
  const currentYear = year ? parseInt(String(year), 10) : new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  try {
    // 1. Busca agregada de sessões, livros e streak
    const [allSessions, readBooks, streak] = await Promise.all([
      prisma.readingSession.findMany({
        where: { userId: auth.userId },
        include: { book: true },
        orderBy: { startedAt: 'asc' }
      }),
      prisma.userBook.findMany({
        where: { userId: auth.userId, status: 'READ' },
        include: { book: true }
      }),
      prisma.readingStreak.findUnique({
        where: { userId: auth.userId }
      })
    ]);

    // 2. Cálculos Globais
    const totalPagesRead = allSessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const totalSeconds = allSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const totalBooksFinished = readBooks.length;

    // Gêneros mais lidos
    const categoryCounts: Record<string, number> = {};
    readBooks.forEach((ub) => {
      ub.book.categories.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });
    const topGenres = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Autores mais lidos
    const authorCounts: Record<string, number> = {};
    readBooks.forEach((ub) => {
      ub.book.authors.forEach((aut) => {
        authorCounts[aut] = (authorCounts[aut] || 0) + 1;
      });
    });
    const topAuthors = Object.entries(authorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Livro mais bem avaliado
    const ratedBooks = readBooks.filter((b) => b.rating !== null && b.rating !== undefined);
    ratedBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const highestRatedBook = ratedBooks[0]
      ? {
          title: ratedBooks[0].book.title,
          author: ratedBooks[0].book.authors.join(', '),
          rating: ratedBooks[0].rating,
          coverUrl: ratedBooks[0].book.coverUrl
        }
      : null;

    // Ritmo Médio (páginas por hora)
    const averagePacePph = totalSeconds > 0 ? Math.round((totalPagesRead / (totalSeconds / 3600))) : 0;

    // 3. Cálculos da Retrospectiva ("Concha Rewind") do ano selecionado (Seção 35)
    const yearSessions = allSessions.filter(
      (s) => s.startedAt >= yearStart && s.startedAt <= yearEnd
    );
    const yearReadBooks = readBooks.filter(
      (b) => b.finishDate && b.finishDate >= yearStart && b.finishDate <= yearEnd
    );

    const yearPages = yearSessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const yearSeconds = yearSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const yearHours = (yearSeconds / 3600).toFixed(1);

    // Mês mais ativo do ano
    const monthCounts = new Array(12).fill(0);
    yearSessions.forEach((s) => {
      monthCounts[s.startedAt.getMonth()] += s.pagesRead;
    });
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    let maxMonthIdx = 0;
    for (let i = 1; i < 12; i++) {
      if (monthCounts[i] > monthCounts[maxMonthIdx]) maxMonthIdx = i;
    }
    const mostActiveMonth = monthCounts[maxMonthIdx] > 0 ? monthNames[maxMonthIdx] : 'Nenhum';

    return res.status(200).json({
      overview: {
        totalBooksFinished,
        totalPagesRead,
        totalHours,
        averagePacePph,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        topGenres,
        topAuthors,
        highestRatedBook
      },
      rewind: {
        year: currentYear,
        booksCount: yearReadBooks.length,
        pagesRead: yearPages,
        readingHours: yearHours,
        mostActiveMonth,
        topAuthor: topAuthors[0]?.name || 'N/A',
        topGenre: topGenres[0]?.name || 'N/A',
        favoriteBook: highestRatedBook
      }
    });
  } catch (error: any) {
    console.error('[API Statistics GET] Erro:', error);
    return res.status(500).json({ error: 'Erro ao calcular estatísticas' });
  }
}
