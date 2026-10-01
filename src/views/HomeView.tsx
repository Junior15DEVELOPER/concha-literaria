import React from 'react';
import { Play, Flame, Trophy, Target, BookOpen, Clock, ChevronRight, Sparkles, Heart, MessageCircle } from 'lucide-react';
import { BookCover } from '../components/common/BookCover';
import { ProgressBar } from '../components/common/ProgressBar';
import { ConchaLogo } from '../components/common/ConchaLogo';
import { useApp } from '../context/AppContext';
import { UserBook } from '../types';

interface HomeViewProps {
  onOpenBookDetail: (book: UserBook) => void;
  onOpenAddBook: () => void;
  onStartReading: (userBookId: string) => void;
  onGoToReadingTab: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenBookDetail,
  onOpenAddBook,
  onStartReading,
  onGoToReadingTab
}) => {
  const { 
    user, 
    userBooks, 
    sessions, 
    currentStreak, 
    achievements, 
    socialPosts, 
    activeSession, 
    togglePostLike,
    quotes
  } = useApp();

  const currentReadingBooks = userBooks.filter((b) => b.status === 'reading');
  const readBooksThisYear = userBooks.filter((b) => b.status === 'read').length;
  const primaryReading = currentReadingBooks[0];

  // Calculate today's minutes read
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = Math.round(
    sessions
      .filter((s) => s.timestamp === todayStr)
      .reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );

  // Unlocked achievements
  const recentAchievements = achievements.filter((a) => a.isUnlocked).slice(-2);

  // Empty state if user has no books yet
  if (userBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in">
        <ConchaLogo variant="symbol" size="xl" className="mb-6 animate-pulse-glow" />
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">
          Comece sua jornada literária
        </h2>
        <p className="text-sm text-ink-muted max-w-xs mb-8 leading-relaxed">
          Sua estante digital, seu diário de pensamentos e o acompanhamento perfeito para cada página.
        </p>
        <button
          onClick={onOpenAddBook}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md transition-all active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>Adicionar primeiro livro</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 pt-2 animate-fade-in">
      {/* 1. Active Session Ongoing Banner (if timer is running) */}
      {activeSession && (
        <div 
          onClick={onGoToReadingTab}
          className="mx-4 p-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-2xl shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-white animate-ping" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Sessão em Andamento</p>
              <p className="text-sm font-serif font-bold line-clamp-1">{activeSession.bookTitle}</p>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">Ver Cronômetro &rarr;</span>
        </div>
      )}

      {/* 2. Currently Reading Spotlight Card */}
      {primaryReading ? (
        <section className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Lendo Agora
            </h2>
            {currentReadingBooks.length > 1 && (
              <span className="text-xs text-primary font-semibold">
                +{currentReadingBooks.length - 1} em leitura
              </span>
            )}
          </div>

          <div className="bg-surface border border-border/80 rounded-3xl p-4 shadow-sm hover:border-primary/30 transition-all">
            <div className="flex gap-4 items-center">
              <div 
                onClick={() => onOpenBookDetail(primaryReading)}
                className="cursor-pointer group"
              >
                <BookCover
                  title={primaryReading.book.title}
                  author={primaryReading.book.author}
                  coverUrl={primaryReading.book.coverUrl}
                  size="md"
                  className="group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 
                  onClick={() => onOpenBookDetail(primaryReading)}
                  className="font-serif font-bold text-base text-ink line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                >
                  {primaryReading.book.title}
                </h3>
                <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                  {primaryReading.book.author}
                </p>

                <div className="mt-3">
                  <ProgressBar
                    current={primaryReading.currentPage}
                    total={primaryReading.totalPages}
                    size="sm"
                  />
                </div>

                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => onStartReading(primaryReading.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Continuar Leitura</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-4">
          <div className="bg-surface border border-dashed border-border rounded-2xl p-5 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-ink-faint mb-2" />
            <p className="text-sm font-semibold text-ink">Nenhum livro sendo lido no momento</p>
            <button
              onClick={onOpenAddBook}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Escolher um livro para ler &rarr;
            </button>
          </div>
        </section>
      )}

      {/* 3. Daily Goals & Streak Cards (Quick Stats Grid) */}
      <section className="px-4 grid grid-cols-2 gap-3">
        {/* Daily Goal Card */}
        <div className="bg-surface border border-border/80 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-ink-muted mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Meta Diária</span>
          </div>
          <p className="text-xl font-bold text-ink">
            {todayMinutes} <span className="text-xs font-normal text-ink-muted">/ {user.dailyMinutesGoal} min</span>
          </p>
          <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-accent transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((todayMinutes / user.dailyMinutesGoal) * 100))}%` }}
            />
          </div>
        </div>

        {/* Yearly Goal Card */}
        <div className="bg-surface border border-border/80 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-ink-muted mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Meta {new Date().getFullYear()}</span>
          </div>
          <p className="text-xl font-bold text-ink">
            {readBooksThisYear} <span className="text-xs font-normal text-ink-muted">/ {user.readingGoalYear} livros</span>
          </p>
          <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((readBooksThisYear / user.readingGoalYear) * 100))}%` }}
            />
          </div>
        </div>
      </section>

      {/* 4. Featured Daily Quote */}
      {quotes.length > 0 && (
        <section className="px-4">
          <div className="bg-gradient-to-br from-surface to-surface-hover border-l-4 border-primary border-t border-r border-b border-border/70 rounded-r-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Citação do Diário</span>
            </div>
            <p className="font-reading italic text-sm text-ink leading-relaxed">
              “{quotes[0].text}”
            </p>
            <p className="text-[11px] text-ink-muted mt-2 font-medium">
              — {quotes[0].bookAuthor}, <span className="italic">{quotes[0].bookTitle}</span>
            </p>
          </div>
        </section>
      )}

      {/* 5. Recent Achievements Showcase */}
      {recentAchievements.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Conquistas Desbloqueadas
            </h2>
          </div>
          <div className="flex gap-2">
            {recentAchievements.map((ach) => (
              <div
                key={ach.id}
                className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-surface border border-border shadow-2xs"
              >
                <span className="text-2xl">{ach.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-ink truncate">{ach.title}</p>
                  <p className="text-[10px] text-ink-muted truncate">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Community Literary Feed */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Comunidade Literária
          </h2>
        </div>

        <div className="space-y-3">
          {socialPosts.map((post) => (
            <div
              key={post.id}
              className="bg-surface border border-border/80 rounded-2xl p-4 shadow-2xs space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink truncate">{post.userName}</p>
                  <p className="text-[10px] text-ink-faint">{post.createdAt}</p>
                </div>
              </div>

              {post.content && (
                <p className="text-xs text-ink font-reading leading-relaxed">
                  {post.content}
                </p>
              )}

              {post.bookTitle && (
                <div className="flex gap-2 p-2 bg-surface-hover/60 rounded-xl border border-border/50 items-center">
                  {post.bookCoverUrl && (
                    <img
                      src={post.bookCoverUrl}
                      alt={post.bookTitle}
                      className="w-8 h-12 object-cover rounded shadow-2xs"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-xs text-ink truncate">{post.bookTitle}</p>
                    {post.bookAuthor && <p className="text-[10px] text-ink-muted truncate">{post.bookAuthor}</p>}
                  </div>
                </div>
              )}

              {/* Social Interactions */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-ink-muted">
                <button
                  onClick={() => togglePostLike(post.id)}
                  className={`flex items-center gap-1 hover:text-primary transition-colors ${
                    post.isLikedByMe ? 'text-primary font-bold' : ''
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLikedByMe ? 'fill-primary' : ''}`} />
                  <span>{post.likesCount}</span>
                </button>
                <div className="flex items-center gap-1 text-[11px]">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.commentsCount} comentários</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
