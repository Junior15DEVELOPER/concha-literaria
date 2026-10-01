import React, { useState } from 'react';
import { Search, Compass, Sparkles, BookOpen, Star, Plus, Loader2 } from 'lucide-react';
import { BookCover } from '../components/common/BookCover';
import { BookProvider } from '../services/bookProvider';
import { Book } from '../types';

interface DiscoverViewProps {
  onSelectBookToAdd: (book: Book) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onSelectBookToAdd }) => {
  const curated = BookProvider.getCuratedDiscover();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres = [
    'Literatura Brasileira',
    'Ficção Científica',
    'Fantasia Épica',
    'Romance de Época',
    'Filosofia & Reflexão',
    'Mistério & Suspense',
    'Não-Ficção'
  ];

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    try {
      const results = await BookProvider.searchBooks(q, 18);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    setQuery(genre);
    handleSearch(undefined, genre);
  };

  return (
    <div className="space-y-6 pb-24 pt-2 animate-fade-in">
      {/* 1. Search Header */}
      <div className="px-4 space-y-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">Descobrir Livros</h2>
          <p className="text-xs text-ink-muted">Encontre sua próxima grande história</p>
        </div>

        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar novos títulos, autores ou temas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Explorar'}
          </button>
        </form>

        {/* Genre Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {genres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => handleGenreClick(g)}
                className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-ink-muted hover:text-ink hover:bg-surface-hover'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live Search Results (if user has searched) */}
      {searchResults.length > 0 && (
        <section className="px-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Resultados para "{query}" ({searchResults.length})
            </h3>
            <button
              onClick={() => {
                setSearchResults([]);
                setQuery('');
                setSelectedGenre(null);
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              Limpar busca
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {searchResults.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelectBookToAdd(book)}
                className="flex flex-col cursor-pointer group active:scale-98 transition-all"
              >
                <div className="relative aspect-2/3 w-full">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    size="md"
                    className="w-full h-full object-cover rounded-xl shadow-xs group-hover:shadow-md transition-all"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBookToAdd(book);
                    }}
                    className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-primary text-white shadow-md hover:scale-110 transition-transform"
                    title="Adicionar à biblioteca"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                <h4 className="font-serif font-bold text-xs text-ink line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                  {book.title}
                </h4>
                <p className="text-[10px] text-ink-muted line-clamp-1">{book.author}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Curated Recommendations (if no active search) */}
      {searchResults.length === 0 && (
        <div className="space-y-6">
          {curated.map((section, idx) => (
            <section key={idx} className="px-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-serif font-bold text-base text-ink">
                  {section.category}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {section.books.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => onSelectBookToAdd(book)}
                    className="flex flex-col cursor-pointer group active:scale-98 transition-all"
                  >
                    <div className="relative aspect-2/3 w-full">
                      <BookCover
                        title={book.title}
                        author={book.author}
                        coverUrl={book.coverUrl}
                        size="md"
                        className="w-full h-full object-cover rounded-xl shadow-xs group-hover:shadow-md transition-all"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBookToAdd(book);
                        }}
                        className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-primary text-white shadow-md hover:scale-110 transition-transform"
                        title="Adicionar à biblioteca"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    <h4 className="font-serif font-bold text-xs text-ink line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[10px] text-ink-muted line-clamp-1">{book.author}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
