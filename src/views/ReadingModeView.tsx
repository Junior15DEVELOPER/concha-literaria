import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  BookOpen, 
  Check, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  ChevronDown 
} from 'lucide-react';
import { BookCover } from '../components/common/BookCover';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import { UserBook } from '../types';

interface ReadingModeViewProps {
  onOpenBookSelect: () => void;
}

export const ReadingModeView: React.FC<ReadingModeViewProps> = ({ onOpenBookSelect }) => {
  const { 
    userBooks, 
    activeSession, 
    startReadingSession, 
    pauseReadingSession, 
    resumeReadingSession, 
    finishReadingSession, 
    cancelReadingSession,
    getElapsedSessionSeconds 
  } = useApp();

  // Local ticker for live UI display of the resilient timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Finish session dialog state
  const [isFinishing, setIsFinishing] = useState(false);
  const [finalPage, setFinalPage] = useState<number>(0);
  const [sessionNote, setSessionNote] = useState('');

  // Selected book for reader if no active session
  const readingBooks = userBooks.filter((b) => b.status === 'reading');
  const [chosenUserBookId, setChosenUserBookId] = useState<string>(
    activeSession?.userBookId || readingBooks[0]?.id || userBooks[0]?.id || ''
  );

  const currentBook = userBooks.find((b) => b.id === (activeSession ? activeSession.userBookId : chosenUserBookId));

  // Resilient timer interval ticker
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }

    // Immediately calculate exact elapsed seconds
    setElapsedSeconds(getElapsedSessionSeconds());

    const interval = setInterval(() => {
      setElapsedSeconds(getElapsedSessionSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, activeSession?.isPaused]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!currentBook) return;
    startReadingSession(currentBook.id);
  };

  const handleOpenFinishModal = () => {
    if (!activeSession) return;
    setFinalPage(activeSession.startPage + 10 > activeSession.totalPages ? activeSession.totalPages : activeSession.startPage + 10);
    setIsFinishing(true);
  };

  const handleConfirmFinish = (e: React.FormEvent) => {
    e.preventDefault();
    finishReadingSession(finalPage, sessionNote);
    setIsFinishing(false);
    setSessionNote('');
  };

  if (!currentBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in">
        <BookOpen className="w-12 h-12 text-ink-faint mb-3 opacity-60" />
        <h3 className="font-serif text-xl font-bold text-ink mb-1">
          Nenhum livro para ler no momento
        </h3>
        <p className="text-xs text-ink-muted max-w-xs mb-6 leading-relaxed">
          Adicione um livro à sua biblioteca ou marque um existente como "Lendo" para iniciar o cronômetro.
        </p>
        <button
          onClick={onOpenBookSelect}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Explorar Biblioteca
        </button>
      </div>
    );
  }

  const isReading = Boolean(activeSession);
  const isPaused = activeSession?.isPaused;

  return (
    <div className="min-h-[80vh] flex flex-col justify-between px-4 pb-24 pt-4 animate-fade-in max-w-md mx-auto">
      {/* 1. Book Selector Header */}
      <div className="text-center space-y-2">
        {!isReading && readingBooks.length > 1 && (
          <div className="inline-flex items-center gap-1 bg-surface border border-border px-3 py-1 rounded-full text-xs font-medium text-ink-muted">
            <span>Trocar livro:</span>
            <select
              value={chosenUserBookId}
              onChange={(e) => setChosenUserBookId(e.target.value)}
              className="bg-transparent font-bold text-ink focus:outline-hidden cursor-pointer"
            >
              {readingBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.book.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <BookCover
            title={currentBook.book.title}
            author={currentBook.book.author}
            coverUrl={currentBook.book.coverUrl}
            size="lg"
            className="shadow-xl"
          />
        </div>

        <div className="pt-2">
          <h2 className="font-serif text-xl font-bold text-ink line-clamp-1">
            {currentBook.book.title}
          </h2>
          <p className="text-xs text-ink-muted">{currentBook.book.author}</p>
        </div>

        <div className="max-w-xs mx-auto pt-2">
          <ProgressBar
            current={activeSession ? activeSession.startPage : currentBook.currentPage}
            total={currentBook.totalPages}
            size="sm"
          />
        </div>
      </div>

      {/* 2. Resilient Timer Clock Display */}
      <div className="text-center py-6">
        <div className="inline-block relative">
          <span
            className={`font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-ink ${
              isReading && !isPaused ? 'text-primary drop-shadow-xs' : 'text-ink-muted'
            }`}
          >
            {formatTime(elapsedSeconds)}
          </span>
          {isPaused && (
            <span className="block text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">
              Pausado
            </span>
          )}
        </div>
        <p className="text-xs text-ink-faint mt-2 font-medium">
          {isReading
            ? 'Tempo de imersão literária registrado'
            : 'Prepare sua leitura e toque em iniciar'}
        </p>
      </div>

      {/* 3. Action Controls */}
      <div className="space-y-3">
        {!isReading ? (
          <button
            onClick={handleStart}
            className="w-full py-4 bg-primary hover:bg-primary-hover active:scale-98 text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>INICIAR LEITURA</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              {isPaused ? (
                <button
                  onClick={resumeReadingSession}
                  className="py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={pauseReadingSession}
                  className="py-3.5 bg-surface border border-border text-ink hover:bg-surface-hover rounded-2xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={handleOpenFinishModal}
                className="py-3.5 bg-sage hover:opacity-90 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finalizar Sessão</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('Deseja cancelar esta sessão de leitura sem salvar?')) {
                  cancelReadingSession();
                }
              }}
              className="w-full py-2 text-ink-faint hover:text-ink text-xs font-semibold"
            >
              Cancelar sessão
            </button>
          </div>
        )}
      </div>

      {/* 4. Finish Session Dialog (Asks pages read as per #12) */}
      <Modal isOpen={isFinishing} onClose={() => setIsFinishing(false)} title="Finalizar Sessão de Leitura">
        <form onSubmit={handleConfirmFinish} className="space-y-4 text-xs">
          <div className="bg-surface-hover/80 p-3 rounded-2xl border border-border text-center space-y-1">
            <p className="text-ink-muted">Tempo total lido:</p>
            <p className="font-mono text-2xl font-bold text-primary">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          <div>
            <label className="block font-bold text-ink-muted uppercase tracking-wider mb-1.5">
              Páginas lidas nesta sessão?
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-surface border border-border rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-ink-faint block">Página inicial</span>
                <span className="font-bold text-sm text-ink">{activeSession?.startPage}</span>
              </div>
              <span className="text-ink-muted font-bold">&rarr;</span>
              <div className="flex-1">
                <span className="text-[10px] text-ink-faint block mb-0.5">Página final alcançada</span>
                <input
                  type="number"
                  required
                  min={activeSession?.startPage || 0}
                  max={activeSession?.totalPages || 9999}
                  value={finalPage}
                  onChange={(e) => setFinalPage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface border border-primary/60 rounded-xl text-sm font-bold text-center text-ink focus:outline-hidden"
                  autoFocus
                />
              </div>
            </div>
            <p className="text-[11px] text-primary font-semibold text-center mt-2">
              + {Math.max(0, finalPage - (activeSession?.startPage || 0))} páginas registradas
            </p>
          </div>

          <div>
            <label className="block font-bold text-ink-muted uppercase tracking-wider mb-1">
              Nota rápida da sessão (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Leitura rápida e envolvente, capítulo surpreendente..."
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-ink focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98"
          >
            Confirmar e Salvar no Firebase
          </button>
        </form>
      </Modal>
    </div>
  );
};
