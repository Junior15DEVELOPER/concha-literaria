import { Book } from '../types';

export class BookProvider {
  /**
   * Search books by keyword, title, author or ISBN via Google Books API + Open Library fallback
   */
  static async searchBooks(query: string, maxResults = 15): Promise<Book[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      // 1. Try Google Books API
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=${maxResults}&printType=books`;
      const response = await fetch(googleUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return data.items.map((item: any) => this.normalizeGoogleBook(item));
        }
      }
    } catch (e) {
      console.warn('Google Books search failed, falling back to OpenLibrary:', e);
    }

    try {
      // 2. Open Library Fallback
      const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=${maxResults}`;
      const olResponse = await fetch(olUrl);
      if (olResponse.ok) {
        const olData = await olResponse.json();
        if (olData.docs && olData.docs.length > 0) {
          return olData.docs.map((doc: any) => this.normalizeOpenLibraryDoc(doc));
        }
      }
    } catch (e) {
      console.error('OpenLibrary search also failed:', e);
    }

    return [];
  }

  /**
   * Search book specifically by ISBN (EAN-13 or ISBN-10)
   */
  static async getBookByIsbn(isbn: string): Promise<Book | null> {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanIsbn) return null;

    // Try Google Books by ISBN
    try {
      const gUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
      const res = await fetch(gUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return this.normalizeGoogleBook(data.items[0]);
        }
      }
    } catch (e) {
      console.warn('Google ISBN lookup error:', e);
    }

    // Try OpenLibrary ISBN
    try {
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
      const res = await fetch(olUrl);
      if (res.ok) {
        const data = await res.json();
        const bookData = data[`ISBN:${cleanIsbn}`];
        if (bookData) {
          return {
            id: `ol_${cleanIsbn}`,
            isbn: cleanIsbn,
            title: bookData.title || 'Título Desconhecido',
            author: bookData.authors?.map((a: any) => a.name).join(', ') || 'Autor Desconhecido',
            description: typeof bookData.notes === 'string' ? bookData.notes : undefined,
            coverUrl: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small,
            pageCount: bookData.number_of_pages || 250,
            publisher: bookData.publishers?.map((p: any) => p.name).join(', '),
            publishYear: bookData.publish_date ? parseInt(bookData.publish_date) || undefined : undefined,
            categories: bookData.subjects?.map((s: any) => s.name).slice(0, 4) || ['Literatura'],
            averageRating: 4.5
          };
        }
      }
    } catch (e) {
      console.warn('OpenLibrary ISBN lookup error:', e);
    }

    return null;
  }

  /**
   * Normalize Google Books item
   */
  private static normalizeGoogleBook(item: any): Book {
    const info = item.volumeInfo || {};
    const industryIds = info.industryIdentifiers || [];
    const isbnObj = industryIds.find((id: any) => id.type === 'ISBN_13') || industryIds.find((id: any) => id.type === 'ISBN_10');
    const isbn = isbnObj ? isbnObj.identifier : undefined;

    let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    if (coverUrl && coverUrl.startsWith('http://')) {
      coverUrl = coverUrl.replace('http://', 'https://');
    }
    // Boost zoom/resolution if available
    if (coverUrl && coverUrl.includes('&zoom=')) {
      coverUrl = coverUrl.replace(/&zoom=[0-9]/, '&zoom=1');
    }

    let publishYear: number | undefined;
    if (info.publishedDate) {
      const year = parseInt(info.publishedDate.substring(0, 4));
      if (!isNaN(year)) publishYear = year;
    }

    return {
      id: item.id || `gb_${Math.random().toString(36).substr(2, 9)}`,
      isbn,
      title: info.title || 'Sem título',
      author: info.authors ? info.authors.join(', ') : 'Autor desconhecido',
      description: info.description,
      coverUrl,
      pageCount: info.pageCount || 200,
      publisher: info.publisher,
      publishYear,
      categories: info.categories || ['Literatura & Ficção'],
      language: info.language,
      averageRating: info.averageRating || 4.2
    };
  }

  /**
   * Normalize OpenLibrary doc
   */
  private static normalizeOpenLibraryDoc(doc: any): Book {
    const isbn = doc.isbn ? doc.isbn[0] : undefined;
    const coverId = doc.cover_i;
    const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined;

    return {
      id: doc.key?.replace('/works/', '') || `ol_${Math.random().toString(36).substr(2, 9)}`,
      isbn,
      title: doc.title || 'Sem título',
      author: doc.author_name ? doc.author_name.join(', ') : 'Autor desconhecido',
      coverUrl,
      pageCount: doc.number_of_pages_median || 240,
      publisher: doc.publisher ? doc.publisher[0] : undefined,
      publishYear: doc.first_publish_year,
      categories: doc.subject ? doc.subject.slice(0, 3) : ['Literatura'],
      averageRating: 4.3
    };
  }

  /**
   * Get curated trending / discover books
   */
  static getCuratedDiscover(): { category: string; books: Book[] }[] {
    return [
      {
        category: "Destaques & Aconchego Literário",
        books: [
          {
            id: "cur_1",
            title: "A Biblioteca da Meia-Noite",
            author: "Matt Haig",
            description: "Entre a vida e a morte, há uma biblioteca com infinitos livros que mostram as vidas que poderíamos ter vivido.",
            coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
            pageCount: 308,
            publisher: "Bertrand Brasil",
            publishYear: 2020,
            categories: ["Ficção Contemporânea", "Fantasia"],
            averageRating: 4.6
          },
          {
            id: "cur_2",
            title: "Torto Arado",
            author: "Itamar Vieira Junior",
            description: "No coração do sertão baiano, as irmãs Bibiana e Belonísia encontram uma misteriosa faca que mudará suas vidas para sempre.",
            coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1569438072i/48981268.jpg",
            pageCount: 264,
            publisher: "Todavia",
            publishYear: 2019,
            categories: ["Literatura Brasileira", "Ficção"],
            averageRating: 4.8
          },
          {
            id: "cur_3",
            title: "O Retrato de Dorian Gray",
            author: "Oscar Wilde",
            description: "Um jovem de beleza excepcional troca sua alma para manter a juventude eterna enquanto seu retrato envelhece e carrega seus pecados.",
            coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1546103428i/5297.jpg",
            pageCount: 256,
            publisher: "Penguin Companhia",
            publishYear: 1890,
            categories: ["Clássico", "Ficção Gótica"],
            averageRating: 4.7
          }
        ]
      },
      {
        category: "Clássicos Inesquecíveis",
        books: [
          {
            id: "cur_4",
            title: "Dom Casmurro",
            author: "Machado de Assis",
            description: "Bento Santiago rememora sua juventude e seu amor por Capitu, atormentado pela dúvida do ciúme e da traição.",
            coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327899732i/82888.jpg",
            pageCount: 256,
            publisher: "Garnier",
            publishYear: 1899,
            categories: ["Clássico Brasileiro", "Realismo"],
            averageRating: 4.9
          },
          {
            id: "cur_5",
            title: "1984",
            author: "George Orwell",
            description: "Em um futuro distópico sob vigilância constante do Grande Irmão, Winston Smith ousa pensar e amar livremente.",
            coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg",
            pageCount: 336,
            publisher: "Companhia das Letras",
            publishYear: 1949,
            categories: ["Distopia", "Ficção Científica"],
            averageRating: 4.8
          }
        ]
      }
    ];
  }
}
