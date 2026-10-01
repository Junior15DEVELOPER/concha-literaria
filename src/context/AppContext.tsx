import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  UserBook, 
  Book, 
  ReadingStatus, 
  ReadingSession, 
  ReadingNote, 
  Quote, 
  Achievement, 
  SocialPost, 
  UserCollection 
} from '../types';
import { AchievementsEngine, INITIAL_ACHIEVEMENTS } from '../services/achievementsEngine';

interface ActiveReadingState {
  bookId: string;
  userBookId: string;
  bookTitle: string;
  bookCoverUrl?: string;
  startTime: number;
  startPage: number;
  totalPages: number;
  isPaused: boolean;
  pauseStartTime?: number;
  pausedAccumulatedMs: number;
}

interface AppContextType {
  user: UserProfile;
  userBooks: UserBook[];
  sessions: ReadingSession[];
  notes: ReadingNote[];
  quotes: Quote[];
  collections: UserCollection[];
  achievements: Achievement[];
  socialPosts: SocialPost[];
  activeSession: ActiveReadingState | null;
  currentStreak: number;
  longestStreak: number;
  activeDates: Set<string>;
  
  // Actions
  addBookToLibrary: (book: Book, status: ReadingStatus, currentPage?: number) => UserBook;
  updateBookStatus: (userBookId: string, status: ReadingStatus) => void;
  updateBookProgress: (userBookId: string, page: number) => void;
  saveBookReview: (userBookId: string, rating: number, reviewText: string, containsSpoiler: boolean) => void;
  removeBookFromLibrary: (userBookId: string) => void;
  toggleBookFavorite: (userBookId: string) => void;
  
  // Reading Timer Session Actions
  startReadingSession: (userBookId: string) => void;
  pauseReadingSession: () => void;
  resumeReadingSession: () => void;
  finishReadingSession: (endPage: number, note?: string) => ReadingSession | null;
  cancelReadingSession: () => void;
  getElapsedSessionSeconds: () => number;
  
  // Notes & Quotes
  addNote: (bookId: string, userBookId: string, page: number | undefined, type: any, content: string, hasSpoiler: boolean) => void;
  deleteNote: (noteId: string) => void;
  addQuote: (bookTitle: string, bookAuthor: string, page: number | undefined, text: string, characterOrContext?: string, isOcr?: boolean, bookCoverUrl?: string) => void;
  deleteQuote: (quoteId: string) => void;
  toggleFavoriteQuote: (quoteId: string) => void;
  
  // Collections & Profile
  createCollection: (name: string, description?: string, color?: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  
  // Social
  togglePostLike: (postId: string) => void;
  addPostComment: (postId: string, text: string) => void;
  publishSocialPost: (post: Partial<SocialPost>) => void;
  
  // Data Backup
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr_me',
  email: 'leitor@conchaliteraria.com',
  name: 'Leitor Apaixonado',
  handle: '@conchaleitor',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Amante de cafés quentes, romances clássicos e histórias que aquecem a alma.',
  joinedDate: new Date().toISOString(),
  privacy: {
    isPublic: true,
    showLibrary: true,
    showStats: true,
    allowMessages: true
  },
  themePreference: 'light',
  readingGoalYear: 24,
  dailyMinutesGoal: 30,
  dailyPagesGoal: 20
};

const INITIAL_BOOKS: UserBook[] = [
  {
    id: 'ub_1',
    userId: 'usr_me',
    bookId: 'cur_1',
    book: {
      id: 'cur_1',
      title: 'A Biblioteca da Meia-Noite',
      author: 'Matt Haig',
      description: 'Entre a vida e a morte, há uma biblioteca com infinitos livros que mostram as vidas que poderíamos ter vivido.',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg',
      pageCount: 308,
      publisher: 'Bertrand Brasil',
      publishYear: 2020,
      categories: ['Ficção Contemporânea', 'Fantasia'],
      averageRating: 4.6
    },
    status: 'reading',
    currentPage: 142,
    totalPages: 308,
    isFavorite: true,
    collections: ['Favoritos'],
    tags: ['reflexão', 'vida', 'aconchegante'],
    dateAdded: '2026-08-10',
    startDate: '2026-08-15',
    lastReadAt: new Date().toISOString(),
    totalTimeSpentSeconds: 7420,
    notesCount: 2,
    quotesCount: 1
  },
  {
    id: 'ub_2',
    userId: 'usr_me',
    bookId: 'cur_2',
    book: {
      id: 'cur_2',
      title: 'Torto Arado',
      author: 'Itamar Vieira Junior',
      description: 'No coração do sertão baiano, as irmãs Bibiana e Belonísia encontram uma misteriosa faca.',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1569438072i/48981268.jpg',
      pageCount: 264,
      publisher: 'Todavia',
      publishYear: 2019,
      categories: ['Literatura Brasileira'],
      averageRating: 4.8
    },
    status: 'read',
    currentPage: 264,
    totalPages: 264,
    rating: 5,
    reviewText: 'Uma obra-prima contemporânea. A força de Bibiana e Belonísia é inesquecível.',
    reviewDate: '2026-08-05',
    isFavorite: true,
    collections: ['Favoritos', 'Nacionais'],
    tags: ['brasil', 'premiado'],
    dateAdded: '2026-07-20',
    startDate: '2026-07-22',
    finishDate: '2026-08-05',
    lastReadAt: '2026-08-05',
    totalTimeSpentSeconds: 16800,
    notesCount: 3,
    quotesCount: 2
  }
];

const INITIAL_SESSIONS: ReadingSession[] = [
  {
    id: 'sess_1',
    userId: 'usr_me',
    bookId: 'cur_1',
    bookTitle: 'A Biblioteca da Meia-Noite',
    bookCoverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg',
    startTime: Date.now() - 86400000,
    endTime: Date.now() - 86400000 + 1800000,
    durationSeconds: 1800,
    startPage: 110,
    endPage: 142,
    pagesRead: 32,
    note: 'Capítulo sobre a vida no Ártico, fascinante.',
    timestamp: new Date().toISOString().split('T')[0]
  }
];

const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q_1',
    userId: 'usr_me',
    bookId: 'cur_1',
    userBookId: 'ub_1',
    bookTitle: 'A Biblioteca da Meia-Noite',
    bookAuthor: 'Matt Haig',
    bookCoverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg',
    page: 86,
    text: 'Não é preciso entender a vida. É preciso apenas vivê-la.',
    characterOrContext: 'Nora Seed',
    isOcrScanned: false,
    isFavorite: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    userId: 'usr_sarah',
    userName: 'Sarah Mendes',
    userHandle: '@sarahleituras',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    type: 'finished',
    bookTitle: 'Torto Arado',
    bookAuthor: 'Itamar Vieira Junior',
    bookCoverUrl: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1569438072i/48981268.jpg',
    content: 'Acabei de fechar o livro com lágrimas nos olhos. Que escrita sublime! 5 estrelas favoritadas.',
    rating: 5,
    likesCount: 24,
    isLikedByMe: false,
    commentsCount: 3,
    createdAt: 'Há 2 horas'
  },
  {
    id: 'post_2',
    userId: 'usr_lucas',
    userName: 'Lucas Prado',
    userHandle: '@lucas_books',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'quote',
    bookTitle: 'A Biblioteca da Meia-Noite',
    bookAuthor: 'Matt Haig',
    content: '“Nunca subestime a grande importância das pequenas coisas.”',
    likesCount: 18,
    isLikedByMe: true,
    commentsCount: 1,
    createdAt: 'Há 5 horas'
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state from localStorage (or fallback to defaults)
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('concha_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [userBooks, setUserBooks] = useState<UserBook[]>(() => {
    const saved = localStorage.getItem('concha_userBooks');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [sessions, setSessions] = useState<ReadingSession[]>(() => {
    const saved = localStorage.getItem('concha_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [notes, setNotes] = useState<ReadingNote[]>(() => {
    const saved = localStorage.getItem('concha_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('concha_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [collections, setCollections] = useState<UserCollection[]>(() => {
    const saved = localStorage.getItem('concha_collections');
    return saved ? JSON.parse(saved) : [
      { id: 'col_1', userId: 'usr_me', name: 'Favoritos da Vida', color: '#9C3826', bookCount: 2, createdAt: new Date().toISOString() },
      { id: 'col_2', userId: 'usr_me', name: 'Clube do Livro', color: '#366048', bookCount: 1, createdAt: new Date().toISOString() }
    ];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('concha_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('concha_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  // Active reading timer session (saved in localStorage for recovery across tab closes)
  const [activeSession, setActiveSession] = useState<ActiveReadingState | null>(() => {
    const saved = localStorage.getItem('concha_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Streaks calculation
  const streakData = AchievementsEngine.calculateStreak(sessions);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('concha_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('concha_userBooks', JSON.stringify(userBooks));
  }, [userBooks]);

  useEffect(() => {
    localStorage.setItem('concha_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('concha_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('concha_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('concha_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('concha_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('concha_posts', JSON.stringify(socialPosts));
  }, [socialPosts]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('concha_active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('concha_active_session');
    }
  }, [activeSession]);

  // Evaluate achievements whenever books, sessions or quotes change
  useEffect(() => {
    const { achievements: evaluated, newlyUnlocked } = AchievementsEngine.evaluate(
      achievements,
      userBooks,
      sessions,
      quotes,
      streakData.currentStreak
    );

    if (newlyUnlocked.length > 0) {
      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    setAchievements(evaluated);
  }, [userBooks.length, sessions.length, quotes.length, streakData.currentStreak]);

  // --- ACTIONS ---

  const addBookToLibrary = (book: Book, status: ReadingStatus, currentPage = 0): UserBook => {
    // Check if already in library
    const existing = userBooks.find(b => b.bookId === book.id || (book.isbn && b.book.isbn === book.isbn));
    if (existing) {
      const updated = {
        ...existing,
        status,
        currentPage: status === 'read' ? existing.totalPages : currentPage
      };
      setUserBooks(prev => prev.map(b => b.id === existing.id ? updated : b));
      return updated;
    }

    const newUserBook: UserBook = {
      id: `ub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      bookId: book.id,
      book,
      status,
      currentPage: status === 'read' ? book.pageCount : currentPage,
      totalPages: book.pageCount,
      isFavorite: false,
      collections: [],
      tags: [],
      dateAdded: new Date().toISOString().split('T')[0],
      startDate: status === 'reading' ? new Date().toISOString().split('T')[0] : undefined,
      finishDate: status === 'read' ? new Date().toISOString().split('T')[0] : undefined,
      totalTimeSpentSeconds: 0,
      notesCount: 0,
      quotesCount: 0
    };

    setUserBooks(prev => [newUserBook, ...prev]);

    // Create a social post if enabled
    if (status === 'reading') {
      publishSocialPost({
        type: 'started',
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCoverUrl: book.coverUrl,
        content: `Iniciei a leitura de "${book.title}"!`
      });
    }

    return newUserBook;
  };

  const updateBookStatus = (userBookId: string, status: ReadingStatus) => {
    setUserBooks(prev => prev.map(b => {
      if (b.id !== userBookId) return b;
      return {
        ...b,
        status,
        finishDate: status === 'read' ? new Date().toISOString().split('T')[0] : b.finishDate,
        currentPage: status === 'read' ? b.totalPages : b.currentPage
      };
    }));
  };

  const updateBookProgress = (userBookId: string, page: number) => {
    setUserBooks(prev => prev.map(b => {
      if (b.id !== userBookId) return b;
      const validPage = Math.min(Math.max(0, page), b.totalPages);
      const isFinished = validPage >= b.totalPages;
      return {
        ...b,
        currentPage: validPage,
        status: isFinished ? 'read' : b.status === 'want_to_read' ? 'reading' : b.status,
        finishDate: isFinished ? (b.finishDate || new Date().toISOString().split('T')[0]) : b.finishDate,
        lastReadAt: new Date().toISOString()
      };
    }));
  };

  const saveBookReview = (userBookId: string, rating: number, reviewText: string, containsSpoiler: boolean) => {
    setUserBooks(prev => prev.map(b => {
      if (b.id !== userBookId) return b;
      return {
        ...b,
        rating,
        reviewText,
        reviewContainsSpoiler: containsSpoiler,
        reviewDate: new Date().toISOString().split('T')[0]
      };
    }));

    const ub = userBooks.find(b => b.id === userBookId);
    if (ub && reviewText) {
      publishSocialPost({
        type: 'review',
        bookTitle: ub.book.title,
        bookAuthor: ub.book.author,
        bookCoverUrl: ub.book.coverUrl,
        rating,
        content: reviewText
      });
    }
  };

  const removeBookFromLibrary = (userBookId: string) => {
    setUserBooks(prev => prev.filter(b => b.id !== userBookId));
  };

  const toggleBookFavorite = (userBookId: string) => {
    setUserBooks(prev => prev.map(b => b.id === userBookId ? { ...b, isFavorite: !b.isFavorite } : b));
  };

  // --- Reading Timer Sessions ---

  const startReadingSession = (userBookId: string) => {
    const userBook = userBooks.find(b => b.id === userBookId);
    if (!userBook) return;

    setActiveSession({
      bookId: userBook.bookId,
      userBookId: userBook.id,
      bookTitle: userBook.book.title,
      bookCoverUrl: userBook.book.coverUrl,
      startTime: Date.now(),
      startPage: userBook.currentPage,
      totalPages: userBook.totalPages,
      isPaused: false,
      pausedAccumulatedMs: 0
    });
  };

  const pauseReadingSession = () => {
    if (!activeSession || activeSession.isPaused) return;
    setActiveSession({
      ...activeSession,
      isPaused: true,
      pauseStartTime: Date.now()
    });
  };

  const resumeReadingSession = () => {
    if (!activeSession || !activeSession.isPaused) return;
    const additionalPause = activeSession.pauseStartTime ? Date.now() - activeSession.pauseStartTime : 0;
    setActiveSession({
      ...activeSession,
      isPaused: false,
      pauseStartTime: undefined,
      pausedAccumulatedMs: activeSession.pausedAccumulatedMs + additionalPause
    });
  };

  const getElapsedSessionSeconds = (): number => {
    if (!activeSession) return 0;
    const now = Date.now();
    let currentPauseDuration = 0;
    if (activeSession.isPaused && activeSession.pauseStartTime) {
      currentPauseDuration = now - activeSession.pauseStartTime;
    }
    const totalMs = now - activeSession.startTime - activeSession.pausedAccumulatedMs - currentPauseDuration;
    return Math.max(0, Math.floor(totalMs / 1000));
  };

  const finishReadingSession = (endPage: number, note?: string): ReadingSession | null => {
    if (!activeSession) return null;

    const durationSeconds = getElapsedSessionSeconds();
    const validEndPage = Math.min(Math.max(activeSession.startPage, endPage), activeSession.totalPages);
    const pagesRead = Math.max(0, validEndPage - activeSession.startPage);

    const newSession: ReadingSession = {
      id: `sess_${Date.now()}`,
      userId: user.id,
      bookId: activeSession.bookId,
      bookTitle: activeSession.bookTitle,
      bookCoverUrl: activeSession.bookCoverUrl,
      startTime: activeSession.startTime,
      endTime: Date.now(),
      durationSeconds: Math.max(durationSeconds, 60), // minimum 1 min
      startPage: activeSession.startPage,
      endPage: validEndPage,
      pagesRead,
      note,
      timestamp: new Date().toISOString().split('T')[0]
    };

    // Save session
    setSessions(prev => [newSession, ...prev]);

    // Update book progress
    updateBookProgress(activeSession.userBookId, validEndPage);

    // Update book time spent
    setUserBooks(prev => prev.map(b => {
      if (b.id !== activeSession.userBookId) return b;
      return {
        ...b,
        totalTimeSpentSeconds: (b.totalTimeSpentSeconds || 0) + newSession.durationSeconds
      };
    }));

    // Clear active session
    setActiveSession(null);

    // Confetti if finished book
    if (validEndPage >= activeSession.totalPages) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      publishSocialPost({
        type: 'finished',
        bookTitle: activeSession.bookTitle,
        bookCoverUrl: activeSession.bookCoverUrl,
        content: `Terminei de ler "${activeSession.bookTitle}"! 🎉`
      });
    }

    return newSession;
  };

  const cancelReadingSession = () => {
    setActiveSession(null);
  };

  // --- Notes & Quotes ---

  const addNote = (bookId: string, userBookId: string, page: number | undefined, type: any, content: string, hasSpoiler: boolean) => {
    const newNote: ReadingNote = {
      id: `note_${Date.now()}`,
      userId: user.id,
      bookId,
      userBookId,
      page,
      type,
      content,
      hasSpoiler,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setUserBooks(prev => prev.map(b => b.id === userBookId ? { ...b, notesCount: (b.notesCount || 0) + 1 } : b));
  };

  const deleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (note) {
      setUserBooks(prev => prev.map(b => b.id === note.userBookId ? { ...b, notesCount: Math.max(0, (b.notesCount || 1) - 1) } : b));
    }
  };

  const addQuote = (
    bookTitle: string,
    bookAuthor: string,
    page: number | undefined,
    text: string,
    characterOrContext?: string,
    isOcr = false,
    bookCoverUrl?: string
  ) => {
    const newQuote: Quote = {
      id: `quote_${Date.now()}`,
      userId: user.id,
      bookId: `b_${Date.now()}`,
      userBookId: '',
      bookTitle,
      bookAuthor,
      bookCoverUrl,
      page,
      text,
      characterOrContext,
      isOcrScanned: isOcr,
      isFavorite: false,
      createdAt: new Date().toISOString()
    };

    setQuotes(prev => [newQuote, ...prev]);

    publishSocialPost({
      type: 'quote',
      bookTitle,
      bookAuthor,
      bookCoverUrl,
      content: `“${text}”`
    });
  };

  const deleteQuote = (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const toggleFavoriteQuote = (quoteId: string) => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, isFavorite: !q.isFavorite } : q));
  };

  // --- Collections & Profile ---

  const createCollection = (name: string, description?: string, color = '#9C3826') => {
    const newCol: UserCollection = {
      id: `col_${Date.now()}`,
      userId: user.id,
      name,
      description,
      color,
      bookCount: 0,
      createdAt: new Date().toISOString()
    };
    setCollections(prev => [...prev, newCol]);
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  // --- Social ---

  const togglePostLike = (postId: string) => {
    setSocialPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const isLiked = !post.isLikedByMe;
      return {
        ...post,
        isLikedByMe: isLiked,
        likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
      };
    }));
  };

  const addPostComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    setSocialPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        commentsCount: post.commentsCount + 1
      };
    }));
  };

  const publishSocialPost = (post: Partial<SocialPost>) => {
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userHandle: user.handle,
      userAvatar: user.avatarUrl,
      type: post.type || 'progress',
      bookTitle: post.bookTitle,
      bookAuthor: post.bookAuthor,
      bookCoverUrl: post.bookCoverUrl,
      content: post.content,
      rating: post.rating,
      likesCount: 0,
      isLikedByMe: false,
      commentsCount: 0,
      createdAt: 'Agora mesmo'
    };
    setSocialPosts(prev => [newPost, ...prev]);
  };

  // --- Data Backup & Restore ---

  const exportDataJson = (): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      userBooks,
      sessions,
      notes,
      quotes,
      collections,
      achievements
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataJson = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.user) setUser(data.user);
      if (Array.isArray(data.userBooks)) setUserBooks(data.userBooks);
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (Array.isArray(data.notes)) setNotes(data.notes);
      if (Array.isArray(data.quotes)) setQuotes(data.quotes);
      if (Array.isArray(data.collections)) setCollections(data.collections);
      if (Array.isArray(data.achievements)) setAchievements(data.achievements);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userBooks,
        sessions,
        notes,
        quotes,
        collections,
        achievements,
        socialPosts,
        activeSession,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        activeDates: streakData.activeDates,
        addBookToLibrary,
        updateBookStatus,
        updateBookProgress,
        saveBookReview,
        removeBookFromLibrary,
        toggleBookFavorite,
        startReadingSession,
        pauseReadingSession,
        resumeReadingSession,
        finishReadingSession,
        cancelReadingSession,
        getElapsedSessionSeconds,
        addNote,
        deleteNote,
        addQuote,
        deleteQuote,
        toggleFavoriteQuote,
        createCollection,
        updateUserProfile,
        togglePostLike,
        addPostComment,
        publishSocialPost,
        exportDataJson,
        importDataJson
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
