import React, { useState, useRef, useEffect } from 'react';
import { Search, Camera, Hash, Edit3, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { BookCover } from '../common/BookCover';
import { Book, ReadingStatus } from '../../types';
import { BookProvider } from '../../services/bookProvider';
import { BarcodeScannerService } from '../../services/barcodeScanner';
import { useApp } from '../../context/AppContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabMode = 'search' | 'scan' | 'isbn' | 'manual';

export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose }) => {
  const { addBookToLibrary } = useApp();
  const [activeMode, setActiveMode] = useState<TabMode>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected book for addition
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chosenStatus, setChosenStatus] = useState<ReadingStatus>('reading');
  const [initialCurrentPage, setInitialCurrentPage] = useState(0);

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedIsbn, setScannedIsbn] = useState('');

  // Manual ISBN State
  const [manualIsbn, setManualIsbn] = useState('');
  const [isIsbnSearching, setIsIsbnSearching] = useState(false);

  // Manual Book Form State
  const [manualForm, setManualForm] = useState({
    title: '',
    author: '',
    pageCount: 200,
    publisher: '',
    category: 'Ficção',
    description: '',
    coverUrl: ''
  });

  // Handle Book Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await BookProvider.searchBooks(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Start Camera Scanning
  const startCamera = () => {
    setScanError(null);
    setIsScanning(true);
    setTimeout(() => {
      if (videoRef.current) {
        BarcodeScannerService.startScanning(
          videoRef.current,
          async (isbn) => {
            setScannedIsbn(isbn);
            BarcodeScannerService.stopAllStreams(videoRef.current);
            setIsScanning(false);
            // Search by scanned ISBN
            setIsSearching(true);
            const book = await BookProvider.getBookByIsbn(isbn);
            setIsSearching(false);
            if (book) {
              setSelectedBook(book);
            } else {
              setScanError(`Livro com ISBN ${isbn} não encontrado. Tente pesquisar pelo título.`);
            }
          },
          (err) => {
            console.error('Scan error:', err);
            setScanError('Não foi possível acessar a câmera. Verifique as permissões.');
            setIsScanning(false);
          }
        );
      }
    }, 300);
  };

  const stopCamera = () => {
    BarcodeScannerService.stopAllStreams(videoRef.current);
    setIsScanning(false);
  };

  useEffect(() => {
    if (activeMode === 'scan' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, isOpen]);

  // Handle ISBN Search
  const handleIsbnSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIsbn.trim()) return;
    setIsIsbnSearching(true);
    setScanError(null);
    try {
      const book = await BookProvider.getBookByIsbn(manualIsbn);
      if (book) {
        setSelectedBook(book);
      } else {
        setScanError('Nenhum livro encontrado com este ISBN. Verifique o código digitado.');
      }
    } catch {
      setScanError('Erro ao consultar ISBN. Tente novamente.');
    } finally {
      setIsIsbnSearching(false);
    }
  };

  // Handle Manual Book Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title || !manualForm.author) return;

    const newBook: Book = {
      id: `man_${Date.now()}`,
      title: manualForm.title,
      author: manualForm.author,
      pageCount: Number(manualForm.pageCount) || 200,
      publisher: manualForm.publisher,
      categories: [manualForm.category],
      description: manualForm.description,
      coverUrl: manualForm.coverUrl || undefined,
      averageRating: 5
    };

    setSelectedBook(newBook);
  };

  // Save Book to Library
  const handleConfirmAdd = () => {
    if (!selectedBook) return;
    addBookToLibrary(selectedBook, chosenStatus, initialCurrentPage);
    // Reset and close
    setSelectedBook(null);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Livro">
      {/* If book is selected, show configuration screen */}
      {selectedBook ? (
        <div className="space-y-4">
          <div className="flex gap-3 bg-surface-hover/60 p-3 rounded-2xl border border-border">
            <BookCover
              title={selectedBook.title}
              author={selectedBook.author}
              coverUrl={selectedBook.coverUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-bold text-base text-ink line-clamp-1">
                {selectedBook.title}
              </h4>
              <p className="text-xs text-ink-muted line-clamp-1">{selectedBook.author}</p>
              <p className="text-[11px] text-ink-faint mt-1">
                {selectedBook.pageCount} páginas {selectedBook.publisher ? `· ${selectedBook.publisher}` : ''}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
              Status de Leitura
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'reading', label: '📖 Lendo' },
                  { id: 'want_to_read', label: '🔖 Quero ler' },
                  { id: 'read', label: '✅ Lido' },
                  { id: 'rereading', label: '🔄 Relendo' },
                  { id: 'abandoned', label: '⏸️ Abandonei' },
                  { id: 'favorite', label: '⭐ Favorito' }
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setChosenStatus(st.id)}
                  className={`py-2 px-1 text-xs rounded-xl border text-center transition-all ${
                    chosenStatus === st.id
                      ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                      : 'bg-surface border-border text-ink hover:bg-surface-hover'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {chosenStatus === 'reading' && (
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Página atual inicial
              </label>
              <input
                type="number"
                min="0"
                max={selectedBook.pageCount}
                value={initialCurrentPage}
                onChange={(e) => setInitialCurrentPage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-hidden focus:border-primary"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedBook(null)}
              className="flex-1 py-2.5 rounded-xl border border-border text-ink-muted text-sm font-medium hover:bg-surface-hover"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm transition-all"
            >
              Salvar na Biblioteca
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Mode Selector Tabs */}
          <div className="flex bg-surface-hover/80 p-1 rounded-xl border border-border/60 mb-4">
            {(
              [
                { id: 'search', label: 'Pesquisa', icon: Search },
                { id: 'scan', label: 'Câmera', icon: Camera },
                { id: 'isbn', label: 'ISBN', icon: Hash },
                { id: 'manual', label: 'Manual', icon: Edit3 }
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveMode(tab.id);
                    setScanError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-surface text-primary shadow-xs border border-border/40'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Search */}
          {activeMode === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="text"
                    placeholder="Título, autor ou palavra-chave..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary text-ink"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </button>
              </form>

              {/* Results List */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {searchResults.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="flex gap-3 p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={book.coverUrl}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-sm text-ink line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-ink-muted line-clamp-1">{book.author}</p>
                      <p className="text-[11px] text-ink-faint mt-1">
                        {book.pageCount} páginas {book.publishYear ? `· ${book.publishYear}` : ''}
                      </p>
                    </div>
                  </div>
                ))}

                {hasSearched && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-6 text-ink-muted">
                    <p className="text-sm">Nenhum livro encontrado para "{searchQuery}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualForm((prev) => ({ ...prev, title: searchQuery }));
                        setActiveMode('manual');
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:underline"
                    >
                      Cadastrar manualmente &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Barcode Camera Scan */}
          {activeMode === 'scan' && (
            <div className="space-y-3 text-center">
              <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Laser Overlay Guide */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="w-4/5 h-28 border-2 border-dashed border-accent/80 rounded-xl relative flex items-center justify-center shadow-lg">
                    <div className="w-full h-0.5 bg-accent animate-pulse" />
                  </div>
                  <span className="text-[11px] text-white/90 font-medium mt-3 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
                    Aponte para o código de barras no verso do livro
                  </span>
                </div>
              </div>

              {scanError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual ISBN */}
          {activeMode === 'isbn' && (
            <form onSubmit={handleIsbnSearch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Código ISBN (10 ou 13 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 9788535914849"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary text-ink"
                  autoFocus
                />
              </div>

              {scanError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isIsbnSearching || !manualIsbn.trim()}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isIsbnSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar ISBN'}
              </button>
            </form>
          )}

          {/* TAB 4: Manual Form */}
          {activeMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Título do Livro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Memórias Póstumas de Brás Cubas"
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Autor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Machado de Assis"
                    value={manualForm.author}
                    onChange={(e) => setManualForm({ ...manualForm, author: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Total de Páginas *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualForm.pageCount}
                    onChange={(e) => setManualForm({ ...manualForm, pageCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Gênero / Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Clássico, Fantasia..."
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Editora (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Companhia das Letras"
                    value={manualForm.publisher}
                    onChange={(e) => setManualForm({ ...manualForm, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Avançar &rarr;
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
