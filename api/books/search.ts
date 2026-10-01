// Vercel Serverless Function — /api/books/search
import prisma from '../../src/lib/prisma';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { q, isbn, limit = '15' } = req.query;

  if (!q && !isbn) {
    return res.status(400).json({ error: 'Parâmetro de busca (q ou isbn) é obrigatório' });
  }

  try {
    const cleanIsbn = isbn ? String(isbn).replace(/[^0-9X]/gi, '') : null;
    const maxResults = Math.min(parseInt(String(limit), 10) || 15, 40);

    // 1. Primeiro verifica se já existe em cache no banco PostgreSQL (Seção 25)
    if (cleanIsbn) {
      const cached = await prisma.book.findFirst({
        where: {
          OR: [{ isbn13: cleanIsbn }, { isbn10: cleanIsbn }]
        }
      });
      if (cached) {
        return res.status(200).json({ books: [cached], source: 'database_cache' });
      }
    }

    // 2. Consulta Google Books API
    const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : '';
    const queryParam = cleanIsbn ? `isbn:${cleanIsbn}` : encodeURIComponent(String(q));
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${queryParam}&maxResults=${maxResults}&printType=books${googleApiKey}`;

    let results: any[] = [];

    try {
      const gRes = await fetch(googleUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          results = gData.items.map((item: any) => {
            const info = item.volumeInfo || {};
            const identifiers = info.industryIdentifiers || [];
            const isbn13 = identifiers.find((id: any) => id.type === 'ISBN_13')?.identifier;
            const isbn10 = identifiers.find((id: any) => id.type === 'ISBN_10')?.identifier;

            let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
            if (cover && cover.startsWith('http://')) {
              cover = cover.replace('http://', 'https://');
            }

            return {
              id: item.id,
              title: info.title || 'Título Desconhecido',
              subtitle: info.subtitle || null,
              authors: info.authors || ['Autor Desconhecido'],
              publisher: info.publisher || null,
              publishedYear: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4), 10) || null : null,
              pageCount: info.pageCount || 200,
              description: info.description || null,
              isbn10: isbn10 || null,
              isbn13: isbn13 || null,
              categories: info.categories || ['Literatura'],
              coverUrl: cover || null,
              language: info.language || 'pt'
            };
          });
        }
      }
    } catch (gErr) {
      console.warn('[API BookSearch] Google Books falhou, tentando Open Library:', gErr);
    }

    // 3. Fallback Open Library API se Google Books não retornar resultados
    if (results.length === 0) {
      const olUrl = cleanIsbn
        ? `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
        : `https://openlibrary.org/search.json?q=${encodeURIComponent(String(q))}&limit=${maxResults}`;

      try {
        const olRes = await fetch(olUrl);
        if (olRes.ok) {
          const olData = await olRes.json();
          if (cleanIsbn && olData[`ISBN:${cleanIsbn}`]) {
            const b = olData[`ISBN:${cleanIsbn}`];
            results = [
              {
                id: `ol_${cleanIsbn}`,
                title: b.title || 'Título Desconhecido',
                authors: b.authors?.map((a: any) => a.name) || ['Autor Desconhecido'],
                publisher: b.publishers?.map((p: any) => p.name).join(', ') || null,
                publishedYear: b.publish_date ? parseInt(b.publish_date, 10) || null : null,
                pageCount: b.number_of_pages || 250,
                description: typeof b.notes === 'string' ? b.notes : null,
                isbn13: cleanIsbn,
                categories: b.subjects?.map((s: any) => s.name).slice(0, 4) || ['Literatura'],
                coverUrl: b.cover?.large || b.cover?.medium || b.cover?.small || null,
                language: 'pt'
              }
            ];
          } else if (olData.docs && olData.docs.length > 0) {
            results = olData.docs.map((doc: any) => {
              const coverId = doc.cover_i;
              return {
                id: `ol_${doc.key.replace('/works/', '')}`,
                title: doc.title,
                authors: doc.author_name || ['Autor Desconhecido'],
                publisher: doc.publisher ? doc.publisher[0] : null,
                publishedYear: doc.first_publish_year || null,
                pageCount: doc.number_of_pages_median || 200,
                isbn13: doc.isbn ? doc.isbn[0] : null,
                categories: doc.subject ? doc.subject.slice(0, 3) : ['Literatura'],
                coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
                language: doc.language ? doc.language[0] : 'pt'
              };
            });
          }
        }
      } catch (olErr) {
        console.error('[API BookSearch] Open Library também falhou:', olErr);
      }
    }

    return res.status(200).json({ books: results, source: 'external_apis' });
  } catch (error: any) {
    console.error('[API BookSearch] Erro geral:', error);
    return res.status(500).json({ error: 'Erro ao buscar livros' });
  }
}
