export type ReadingStatus = 
  | 'reading' 
  | 'want_to_read' 
  | 'read' 
  | 'rereading' 
  | 'abandoned' 
  | 'favorite' 
  | 'wishlist';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio?: string;
  joinedDate: string;
  privacy: {
    isPublic: boolean;
    showLibrary: boolean;
    showStats: boolean;
    allowMessages: boolean;
  };
  themePreference: 'light' | 'dark' | 'sepia' | 'system';
  readingGoalYear: number;
  dailyMinutesGoal: number;
  dailyPagesGoal: number;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  pageCount: number;
  publisher?: string;
  publishYear?: number;
  categories: string[];
  series?: {
    name: string;
    number: number;
  };
  language?: string;
  averageRating?: number;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  status: ReadingStatus;
  currentPage: number;
  totalPages: number;
  rating?: number; // 0 to 5, allows halves
  reviewText?: string;
  reviewDate?: string;
  reviewContainsSpoiler?: boolean;
  isFavorite: boolean;
  collections: string[];
  tags: string[];
  dateAdded: string;
  startDate?: string;
  finishDate?: string;
  lastReadAt?: string;
  totalTimeSpentSeconds: number;
  notesCount: number;
  quotesCount: number;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl?: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  note?: string;
  timestamp: string; // YYYY-MM-DD
}

export type NoteType = 'thought' | 'reflection' | 'character' | 'vocabulary' | 'analysis';

export interface ReadingNote {
  id: string;
  userId: string;
  bookId: string;
  userBookId: string;
  page?: number;
  type: NoteType;
  content: string;
  hasSpoiler: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  bookId: string;
  userBookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string;
  page?: number;
  text: string;
  characterOrContext?: string;
  isOcrScanned: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'books' | 'pages' | 'streak' | 'time' | 'special';
  requiredValue: number;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  type: 'started' | 'progress' | 'finished' | 'review' | 'quote' | 'achievement';
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  content?: string;
  pageProgress?: { current: number; total: number; percentage: number };
  rating?: number;
  achievementTitle?: string;
  achievementIcon?: string;
  likesCount: number;
  isLikedByMe: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  bookCount: number;
  createdAt: string;
}
