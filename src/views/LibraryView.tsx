import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  BookOpen, 
  Plus, 
  Heart, 
  Tag, 
  FolderPlus,
  Star
} from 'lucide-react';
import { BookCover } from '../components/common/BookCover';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/ui';
import { useApp } from '../context/AppContext';
import { UserBook, ReadingStatus } from '../types';

interface LibraryViewProps {
  onOpenBookDetail: (book: UserBook) => void;
  onOpenAddBook: () => void;
  onGoToDiscover?: () => void;
}

type FilterTab = 'all' | ReadingStatus;
type SortOption = 'date_added' | 'title' | 'author' | 'progress' | 'rating' | 'recently_read';

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenBookDetail,
  onOpenAddBook,
  onGoToDiscover
}) => {
  const { userBooks, collections, createCollection } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  // New collection modal state
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'reading', label: 'Lendo' },
    { id: 'want_to_read', label: 'Quero ler' },
    { id: 'read', label: 'Lidos' },
    { id: 'rereading', label: 'Relendo' },
    { id: 'abandoned', label: 'Abandonados' },
    { id: 'favorite', label: 'Favoritos' }
  ];

  // Filter & Sort computation
  const filteredBooks = useMemo(() => {
    let list = [...userBooks];

    // Filter by Status / Favorite
    if (activeFilter === 'favorite') {
      list = list.filter((b) => b.isFavorite);
    } else if (activeFilter !== 'all') {
      list = list.filter((b) => b.status === activeFilter);
    }

    // Filter by Collection
    if (activeCollection) {
      list = list.filter((b) => b.collections?.includes(activeCollection));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.book.title.toLowerCase().includes(q) ||
          b.book.author.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'title') return a.book.title.localeCompare(b.book.title);
      if (sortBy === 'author') return a.book.author.localeCompare(b.book.author);
      if (sortBy === 'progress') {
        const pA = a.totalPages ? a.currentPage / a.totalPages : 0;
        const pB = b.totalPages ? b.currentPage / b.totalPages : 0;
        return pB - pA;
      }
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'recently_read') return (b.lastReadAt || '').localeCompare(a.lastReadAt || '');
      // default: date_added descending
      return b.dateAdded.localeCompare(a.dateAdded);
    });

    return list;
  }, [userBooks, activeFilter, activeCollection, searchQuery, sortBy]);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    createCollection(newCollectionName.trim());
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  return (
    <div className="space-y-4 pb-24 pt-2 animate-fade-in">
      {/* Search & Layout Header */}
      <div className="px-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar em seus livros ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-hidden focus:border-primary text-ink"
            />
          </div>

          {/* Layout Toggle Button */}
          <div className="flex bg-surface border border-border rounded-xl p-0.5">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'grid' ? 'bg-surface-hover text-primary font-bold' : 'text-ink-muted'
              }`}
              title="Visualização em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'list' ? 'bg-surface-hover text-primary font-bold' : 'text-ink-muted'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'} encontrados</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-surface border border-border rounded-lg px-2 py-1 text-xs font-semibold text-ink focus:outline-hidden"
            >
              <option value="date_added">Adicionados recentemente</option>
              <option value="title">Título (A-Z)</option>
              <option value="author">Autor (A-Z)</option>
              <option value="progress">Maior progresso</option>
              <option value="rating">Melhor avaliação</option>
              <option value="recently_read">Lidos recentemente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Horizontal Scrollable Chips */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none no-scrollbar">
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.id && !activeCollection;
          const count =
            tab.id === 'all'
              ? userBooks.length
              : tab.id === 'favorite'
              ? userBooks.filter((b) => b.isFavorite).length
              : userBooks.filter((b) => b.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setActiveCollection(null);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface border-border text-ink-muted hover:text-ink hover:bg-surface-hover'
              }`}
            >
              {tab.label} <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Collections Row */}
      <div className="px-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setIsCreatingCollection(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-border text-ink-muted text-xs font-medium hover:border-primary hover:text-primary whitespace-nowrap transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Coleção</span>
        </button>

        {collections.map((col) => {
          const isSelected = activeCollection === col.name;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCollection(isSelected ? null : col.name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-accent/20 border-accent text-accent font-bold'
                  : 'bg-surface border-border text-ink-muted hover:text-ink'
              }`}
            >
              📁 {col.name}
            </button>
          );
        })}
      </div>

      {/* Modal for creating a new collection */}
      {isCreatingCollection && (
        <div className="px-4">
          <form onSubmit={handleCreateCollection} className="p-3 bg-surface border border-border rounded-xl flex gap-2">
            <input
              type="text"
              placeholder="Nome da coleção (Ex: Favoritos de Verão)"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-ink focus:outline-hidden"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingCollection(false)}
              className="px-2 py-1.5 text-xs text-ink-muted"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Books Content Container */}
      <div className="px-4">
        {filteredBooks.length > 0 ? (
          viewLayout === 'grid' ? (
            /* Grid View (3 columns on mobile) */
            <div className="grid grid-cols-3 gap-3">
              {filteredBooks.map((ub) => {
                const percentage =
                  ub.totalPages > 0 ? Math.round((ub.currentPage / ub.totalPages) * 100) : 0;

                return (
                  <div
                    key={ub.id}
                    onClick={() => onOpenBookDetail(ub)}
                    className="flex flex-col cursor-pointer group active:scale-98 transition-all"
                  >
                    <div className="relative aspect-2/3 w-full">
                      <BookCover
                        title={ub.book.title}
                        author={ub.book.author}
                        coverUrl={ub.book.coverUrl}
                        size="md"
                        className="w-full h-full object-cover rounded-xl shadow-xs group-hover:shadow-md transition-shadow"
                      />
                      {ub.isFavorite && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-primary backdrop-blur-xs">
                          <Heart className="w-3 h-3 fill-primary" />
                        </div>
                      )}
                      {ub.rating ? (
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-gold text-[10px] font-bold backdrop-blur-xs">
                          <Star className="w-2.5 h-2.5 fill-gold" />
                          <span>{ub.rating}</span>
                        </div>
                      ) : null}
                    </div>

                    <h4 className="font-serif font-bold text-xs text-ink line-clamp-1 mt-1.5 group-hover:text-primary transition-colors">
                      {ub.book.title}
                    </h4>
                    <p className="text-[10px] text-ink-muted line-clamp-1">{ub.book.author}</p>

                    <div className="mt-1">
                      <div className="w-full bg-border-subtle h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2.5">
              {filteredBooks.map((ub) => (
                <div
                  key={ub.id}
                  onClick={() => onOpenBookDetail(ub)}
                  className="flex gap-3 p-3 bg-surface border border-border/80 rounded-2xl cursor-pointer hover:border-primary/40 transition-all active:scale-99"
                >
                  <BookCover
                    title={ub.book.title}
                    author={ub.book.author}
                    coverUrl={ub.book.coverUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-ink line-clamp-1">
                          {ub.book.title}
                        </h4>
                        {ub.isFavorite && <Heart className="w-3.5 h-3.5 fill-primary text-primary" />}
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-1">{ub.book.author}</p>
                    </div>

                    <div className="mt-2">
                      <ProgressBar
                        current={ub.currentPage}
                        total={ub.totalPages}
                        size="sm"
                        showLabels={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty Search or Library State conforme Seção 40 */
          <EmptyState
            title={searchQuery ? 'Nenhum livro corresponde à busca' : 'Seu próximo livro começa aqui.'}
            description={
              searchQuery
                ? 'Tente buscar por outro termo ou adicione uma nova obra à sua estante.'
                : 'Explore o catálogo, pesquise clássicos ou escaneie o código de barras para começar a montar sua estante.'
            }
            actionLabel={searchQuery ? 'Adicionar Livro' : 'Descobrir Livros'}
            onAction={searchQuery ? onOpenAddBook : (onGoToDiscover || onOpenAddBook)}
          />
        )}
      </div>
    </div>
  );
};
