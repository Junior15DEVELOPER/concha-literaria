import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Loader2, Check, Share2, Quote as QuoteIcon, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserBook } from '../../types';
import { OcrService, OcrProgress } from '../../services/ocrService';
import { useApp } from '../../context/AppContext';

interface OcrQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBook?: UserBook | null;
}

export const OcrQuoteModal: React.FC<OcrQuoteModalProps> = ({
  isOpen,
  onClose,
  targetBook
}) => {
  const { addQuote, userBooks } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBookId, setSelectedBookId] = useState<string>(targetBook?.id || userBooks[0]?.id || '');
  const [bookTitle, setBookTitle] = useState(targetBook?.book.title || userBooks[0]?.book.title || '');
  const [bookAuthor, setBookAuthor] = useState(targetBook?.book.author || userBooks[0]?.book.author || '');
  const [bookCoverUrl, setBookCoverUrl] = useState(targetBook?.book.coverUrl || userBooks[0]?.book.coverUrl);

  const [page, setPage] = useState<number | undefined>(targetBook?.currentPage);
  const [character, setCharacter] = useState('');
  const [quoteText, setQuoteText] = useState('');

  // OCR state
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Handle Book select change
  const handleBookChange = (id: string) => {
    setSelectedBookId(id);
    const b = userBooks.find((item) => item.id === id);
    if (b) {
      setBookTitle(b.book.title);
      setBookAuthor(b.book.author);
      setBookCoverUrl(b.book.coverUrl);
      setPage(b.currentPage);
    }
  };

  // Process selected file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setImagePreview(URL.createObjectURL(file));

    try {
      const recognized = await OcrService.recognizeText(file, (p) => {
        setOcrProgress(p);
      });
      setQuoteText(recognized);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim()) return;

    addQuote(
      bookTitle,
      bookAuthor,
      page,
      quoteText,
      character,
      Boolean(imagePreview),
      bookCoverUrl
    );

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      // Reset form
      setQuoteText('');
      setImagePreview(null);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Citação & OCR">
      <form onSubmit={handleSaveQuote} className="space-y-4">
        {/* Book Selector */}
        <div>
          <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
            Livro de Origem
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => handleBookChange(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-ink"
          >
            {userBooks.map((ub) => (
              <option key={ub.id} value={ub.id}>
                {ub.book.title} ({ub.book.author})
              </option>
            ))}
          </select>
        </div>

        {/* OCR Image Upload / Capture Section */}
        <div className="bg-surface-hover/60 p-3.5 rounded-2xl border border-dashed border-border/80 text-center space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {imagePreview ? (
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
              <img src={imagePreview} alt="Captura OCR" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs transition-all"
              >
                Trocar Foto
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="py-4 cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1.5">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-ink">
                Fotografar Página para OCR
              </span>
              <span className="text-[11px] text-ink-muted">
                Toque para usar a câmera ou escolher da galeria
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reconhecendo texto ({ocrProgress.progress}%)...</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${ocrProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Quote Editor (Always allowed to edit and review before saving) */}
        <div>
          <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
            Texto da Citação *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Digite ou revise o texto reconhecido pelo OCR aqui..."
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            className="w-full p-3 bg-surface border border-border rounded-xl text-sm text-ink focus:outline-hidden focus:border-primary font-reading leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Página
            </label>
            <input
              type="number"
              placeholder="Ex: 142"
              value={page || ''}
              onChange={(e) => setPage(Number(e.target.value) || undefined)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Personagem / Contexto
            </label>
            <input
              type="text"
              placeholder="Ex: Capitu"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-ink"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!quoteText.trim() || isProcessing}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Citação Salva!</span>
            </>
          ) : (
            <>
              <QuoteIcon className="w-4 h-4" />
              <span>Salvar Citação no Livro</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};
