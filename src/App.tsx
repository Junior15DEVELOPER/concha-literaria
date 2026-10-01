import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/navigation/Header';
import { BottomNav, TabType } from './components/navigation/BottomNav';
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';
import { ReadingModeView } from './views/ReadingModeView';
import { DiscoverView } from './views/DiscoverView';
import { ProfileView } from './views/ProfileView';

import { AddBookModal } from './components/books/AddBookModal';
import { BookDetailModal } from './components/books/BookDetailModal';
import { OcrQuoteModal } from './components/quotes/OcrQuoteModal';
import { StreakInfoModal } from './components/common/StreakInfoModal';
import { UserBook, Book } from './types';
import { ToastProvider, OfflineBanner } from './components/ui';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './features/auth';

const MainApp: React.FC = () => {
  const { user, addBookToLibrary } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isStreakInfoOpen, setIsStreakInfoOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<UserBook | null>(null);
  const [targetBookForOcr, setTargetBookForOcr] = useState<UserBook | null>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Apply theme classes to root HTML element
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'theme-sepia');
    if (user.themePreference === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (user.themePreference === 'sepia') {
      document.documentElement.classList.add('theme-sepia');
    }
  }, [user.themePreference]);

  const handleStartReading = (userBookId: string) => {
    setActiveTab('reading');
  };

  const handleOpenOcrQuote = (userBook: UserBook) => {
    setTargetBookForOcr(userBook);
    setIsOcrModalOpen(true);
  };

  const handleSelectDiscoverBookToAdd = (book: Book) => {
    const added = addBookToLibrary(book, 'want_to_read');
    setSelectedBookForDetail(added);
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between selection:bg-primary/20">
      {/* Mobile-first centered frame with border on larger screens */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-bg border-x border-border/30 relative shadow-2xl">
        {/* Offline Banner indicator */}
        <OfflineBanner />

        {/* Top Header */}
        <Header
          onOpenAddBook={() => setIsAddBookOpen(true)}
          onOpenStreakInfo={() => setIsStreakInfoOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView
              onOpenBookDetail={(book) => setSelectedBookForDetail(book)}
              onOpenAddBook={() => setIsAddBookOpen(true)}
              onStartReading={handleStartReading}
              onGoToReadingTab={() => setActiveTab('reading')}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              onOpenBookDetail={(book) => setSelectedBookForDetail(book)}
              onOpenAddBook={() => setIsAddBookOpen(true)}
              onGoToDiscover={() => setActiveTab('discover')}
            />
          )}

          {activeTab === 'reading' && (
            <ReadingModeView
              onOpenBookSelect={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverView
              onSelectBookToAdd={handleSelectDiscoverBookToAdd}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Global Modals */}
        <AddBookModal
          isOpen={isAddBookOpen}
          onClose={() => setIsAddBookOpen(false)}
        />

        <BookDetailModal
          isOpen={Boolean(selectedBookForDetail)}
          userBook={selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          onStartReading={handleStartReading}
          onOpenOcrQuote={handleOpenOcrQuote}
        />

        <OcrQuoteModal
          isOpen={isOcrModalOpen}
          onClose={() => {
            setIsOcrModalOpen(false);
            setTargetBookForOcr(null);
          }}
          targetBook={targetBookForOcr}
        />

        <StreakInfoModal
          isOpen={isStreakInfoOpen}
          onClose={() => setIsStreakInfoOpen(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
