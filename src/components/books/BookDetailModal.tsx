import React, { useState } from 'react';
import { 
  Star, 
  Play, 
  BookOpen, 
  Edit, 
  Trash2, 
  Plus, 
  Heart, 
  Quote as QuoteIcon, 
  Check, 
  Share2,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { BookCover } from '../common/BookCover';
import { ProgressBar } from '../common/ProgressBar';
import { UserBook, ReadingStatus, NoteType } from '../../types';
import { useApp } from '../../context/AppContext';

interface BookDetailModalProps {
  userBook: UserBook | null;
  isOpen: boolean;
  onClose: () => void;
  onStartReading: (userBookId: string) => void;
  onOpenOcrQuote: (book: UserBook) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  userBook,
  isOpen,
  onClose,
  onStartReading,
  onOpenOcrQuote
}) => {
  const { 
    updateBookStatus, 
    updateBookProgress, 
    saveBookReview, 
    removeBookFromLibrary, 
    toggleBookFavorite,
    notes,
    quotes,
    addNote,
    deleteNote
  } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'quotes' | 'review'>('info');

  // Progress edit
  const [currentPageInput, setCurrentPageInput] = useState(userBook?.currentPage || 0);

  // New Note Form
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePage, setNotePage] = useState<number | undefined>(userBook?.currentPage);
  const [noteType, setNoteType] = useState<NoteType>('thought');
  const [noteSpoiler, setNoteSpoiler] = useState(false);

  // Review Form
  const [rating, setRating] = useState(userBook?.rating || 0);
  const [reviewText, setReviewText] = useState(userBook?.reviewText || '');
  const [reviewSpoiler, setReviewSpoiler] = useState(userBook?.reviewContainsSpoiler || false);
  const [reviewSavedAlert, setReviewSavedAlert] = useState(false);

  if (!userBook) return null;

  const bookNotes = notes.filter((n) => n.userBookId === userBook.id || n.bookId === userBook.bookId);
  const bookQuotes = quotes.filter((q) => q.userBookId === userBook.id || q.bookTitle === userBook.book.title);

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookProgress(userBook.id, currentPageInput);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    addNote(userBook.bookId, userBook.id, notePage, noteType, noteContent, noteSpoiler);
    setNoteContent('');
    setIsAddingNote(false);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    saveBookReview(userBook.id, rating, reviewText, reviewSpoiler);
    setReviewSavedAlert(true);
    setTimeout(() => setReviewSavedAlert(false), 2500);
  };

  const statusLabels: Record<ReadingStatus, string> = {
    reading: 'Lendo atualmente',
    want_to_read: 'Quero ler',
    read: 'Lido',
    rereading: 'Relendo',
    abandoned: 'Abandonado',
    favorite: 'Favorito',
    wishlist: 'Lista de Desejos'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-5">
        {/* Book Header Card */}
        <div className="flex gap-4 items-start">
          <BookCover
            title={userBook.book.title}
            author={userBook.book.author}
            coverUrl={userBook.book.coverUrl}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                {statusLabels[userBook.status]}
              </span>
              <button
                onClick={() => toggleBookFavorite(userBook.id)}
                className="p-1 text-ink-muted hover:text-primary transition-colors"
                title="Favoritar livro"
              >
                <Heart
                  className={`w-5 h-5 ${userBook.isFavorite ? 'fill-primary text-primary' : ''}`}
                />
              </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-ink line-clamp-2 mt-1 leading-snug">
              {userBook.book.title}
            </h3>
            <p className="text-xs text-ink-muted line-clamp-1">{userBook.book.author}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-ink-faint">
              <span>{userBook.totalPages} págs</span>
              {userBook.book.publisher && <span>&middot; {userBook.book.publisher}</span>}
              {userBook.book.publishYear && <span>&middot; {userBook.book.publishYear}</span>}
            </div>

            {/* Quick Action Button to Start Reading Session */}
            <button
              onClick={() => {
                onClose();
                onStartReading(userBook.id);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Iniciar Sessão de Leitura</span>
            </button>
          </div>
        </div>

        {/* Reading Progress Block */}
        <div className="bg-surface-hover/60 p-3.5 rounded-2xl border border-border/80">
          <ProgressBar current={userBook.currentPage} total={userBook.totalPages} size="md" />

          <form onSubmit={handleUpdateProgress} className="flex items-center gap-2 mt-3">
            <span className="text-xs text-ink-muted font-medium whitespace-nowrap">
              Atualizar página:
            </span>
            <input
              type="number"
              min="0"
              max={userBook.totalPages}
              value={currentPageInput}
              onChange={(e) => setCurrentPageInput(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-surface border border-border rounded-lg text-xs font-semibold text-center focus:outline-hidden focus:border-primary text-ink"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-surface border border-border hover:bg-surface-hover text-xs font-bold text-ink rounded-lg transition-colors shadow-2xs"
            >
              Salvar
            </button>
          </form>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-border/60 text-xs font-semibold">
          {[
            { id: 'info', label: 'Detalhes' },
            { id: 'notes', label: `Diário (${bookNotes.length})` },
            { id: 'quotes', label: `Citações (${bookQuotes.length})` },
            { id: 'review', label: 'Minha Avaliação' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 pb-2.5 text-center transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: INFO / SINOPSE */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-xs">
            {userBook.book.description && (
              <div>
                <h4 className="font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Sinopse
                </h4>
                <p className="text-ink leading-relaxed font-reading text-sm opacity-90 whitespace-pre-line">
                  {userBook.book.description}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                Alterar Status
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'reading', label: 'Lendo' },
                    { id: 'want_to_read', label: 'Quero ler' },
                    { id: 'read', label: 'Lido' },
                    { id: 'rereading', label: 'Relendo' },
                    { id: 'abandoned', label: 'Abandonei' },
                    { id: 'favorite', label: 'Favorito' }
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateBookStatus(userBook.id, st.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      userBook.status === st.id
                        ? 'bg-primary text-white border-primary shadow-2xs'
                        : 'bg-surface border-border text-ink hover:bg-surface-hover'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove from library action */}
            <div className="pt-2 border-t border-border/40 flex justify-end items-center">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-[11px] text-red-600 font-medium">Tem certeza?</span>
                  <button
                    onClick={() => {
                      removeBookFromLibrary(userBook.id);
                      setIsConfirmingDelete(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Sim, remover
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 border border-border text-ink-muted hover:bg-surface rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 py-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover da biblioteca</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB: DIARY / NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                Anotações de Leitura
              </span>
              <button
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Nota</span>
              </button>
            </div>

            {/* Note Creation Form */}
            {isAddingNote && (
              <form onSubmit={handleSaveNote} className="bg-surface-hover/80 p-3 rounded-2xl border border-border space-y-2.5 animate-fade-in">
                <div className="flex gap-2">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as NoteType)}
                    className="px-2 py-1 bg-surface border border-border rounded-lg text-xs font-semibold text-ink"
                  >
                    <option value="thought">💭 Pensamento</option>
                    <option value="reflection">✨ Reflexão</option>
                    <option value="character">👤 Personagem</option>
                    <option value="vocabulary">📖 Vocabulário</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Pág (opcional)"
                    value={notePage || ''}
                    onChange={(e) => setNotePage(Number(e.target.value) || undefined)}
                    className="w-28 px-2 py-1 bg-surface border border-border rounded-lg text-xs text-ink"
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Escreva sua reflexão ou observação deste trecho..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-ink focus:outline-hidden focus:border-primary font-reading"
                  required
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteSpoiler}
                      onChange={(e) => setNoteSpoiler(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    <span>Contém spoiler</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1 rounded-lg text-xs text-ink-muted hover:bg-surface"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-2xs"
                    >
                      Salvar Nota
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Notes List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bookNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-surface border border-border rounded-xl space-y-1 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-ink-faint">
                    <span className="font-semibold text-primary">
                      {note.page ? `Página ${note.page}` : 'Nota geral'}
                    </span>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-ink-faint hover:text-red-600 transition-colors"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-ink font-reading leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}

              {bookNotes.length === 0 && !isAddingNote && (
                <p className="text-center py-6 text-xs text-ink-muted">
                  Nenhuma anotação neste livro ainda. Registre pensamentos e reflexões conforme lê.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                Trechos & Citações
              </span>
              <button
                onClick={() => onOpenOcrQuote(userBook)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Citação / OCR</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bookQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-surface-card border-l-4 border-primary border-t border-r border-b border-border/70 rounded-r-xl space-y-1.5"
                >
                  <p className="font-serif italic text-xs text-ink leading-relaxed">
                    “{q.text}”
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span>
                      {q.characterOrContext ? `${q.characterOrContext} · ` : ''}
                      {q.page ? `pág. ${q.page}` : ''}
                    </span>
                    {q.isOcrScanned && (
                      <span className="text-[10px] bg-accent/15 text-accent font-bold px-1.5 py-0.5 rounded">
                        OCR
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {bookQuotes.length === 0 && (
                <p className="text-center py-6 text-xs text-ink-muted">
                  Nenhuma citação favoritada. Use o OCR da câmera para capturar trechos direto da página física!
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB: REVIEW & STARS */}
        {activeTab === 'review' && (
          <form onSubmit={handleSaveReview} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-ink-muted uppercase tracking-wider mb-2">
                Sua Avaliação (1 a 5 estrelas)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-ink-muted hover:text-gold transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-gold text-gold drop-shadow-xs'
                          : 'text-border-subtle'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-bold text-sm text-ink">
                  {rating > 0 ? `${rating}.0 / 5.0` : 'Sem nota'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink-muted uppercase tracking-wider mb-1">
                Resenha Literária
              </label>
              <textarea
                rows={4}
                placeholder="Escreva sua opinião, análise dos personagens e impacto da história..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-ink focus:outline-hidden focus:border-primary font-reading"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewSpoiler}
                  onChange={(e) => setReviewSpoiler(e.target.checked)}
                  className="rounded text-primary focus:ring-0"
                />
                <span>Contém revelações do enredo (spoiler)</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Publicar Resenha
              </button>
            </div>

            {reviewSavedAlert && (
              <div className="p-2 rounded-xl bg-sage-light text-sage text-center font-bold text-xs animate-fade-in">
                ✓ Resenha e avaliação salvas com sucesso!
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
};
