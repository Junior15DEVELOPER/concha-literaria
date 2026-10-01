import { Achievement, UserBook, ReadingSession, ReadingNote, Quote } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    title: 'Primeiro Passo',
    description: 'Inicie e conclua sua primeira sessão de leitura.',
    icon: '⏳',
    category: 'time',
    requiredValue: 1,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'first_book',
    title: 'Página Final',
    description: 'Marque seu primeiro livro como lido na biblioteca.',
    icon: '📖',
    category: 'books',
    requiredValue: 1,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'streak_3',
    title: 'Aquecendo as Páginas',
    description: 'Mantenha 3 dias consecutivos de leitura.',
    icon: '🔥',
    category: 'streak',
    requiredValue: 3,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'streak_7',
    title: 'Hábito de Ouro',
    description: 'Mantenha 7 dias consecutivos de leitura ininterrupta.',
    icon: '✨',
    category: 'streak',
    requiredValue: 7,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'streak_30',
    title: 'Mestre da Constância',
    description: 'Alcance uma sequência lendária de 30 dias de leitura.',
    icon: '🏆',
    category: 'streak',
    requiredValue: 30,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'pages_100',
    title: 'Centésima Página',
    description: 'Acumule 100 páginas lidas nas suas sessões.',
    icon: '📜',
    category: 'pages',
    requiredValue: 100,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'pages_1000',
    title: 'Clube dos Mil',
    description: 'Leia 1.000 páginas no total da sua jornada.',
    icon: '📚',
    category: 'pages',
    requiredValue: 1000,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'night_owl',
    title: 'Leitor Noturno',
    description: 'Complete uma sessão de leitura após as 22h.',
    icon: '🌙',
    category: 'special',
    requiredValue: 1,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'early_bird',
    title: 'Leitor Matinal',
    description: 'Complete uma sessão de leitura antes das 08h da manhã.',
    icon: '☀️',
    category: 'special',
    requiredValue: 1,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'quotes_5',
    title: 'Guardião de Trechos',
    description: 'Salve 5 citações memoráveis dos seus livros.',
    icon: '🖋️',
    category: 'special',
    requiredValue: 5,
    currentValue: 0,
    isUnlocked: false
  },
  {
    id: 'marathon_60',
    title: 'Maratona Literária',
    description: 'Realize uma única sessão contínua de leitura de 60 minutos ou mais.',
    icon: '☕',
    category: 'time',
    requiredValue: 60,
    currentValue: 0,
    isUnlocked: false
  }
];

export class AchievementsEngine {
  /**
   * Recalculate achievement progress based on real user data
   */
  static evaluate(
    currentAchievements: Achievement[],
    userBooks: UserBook[],
    sessions: ReadingSession[],
    quotes: Quote[],
    currentStreak: number
  ): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
    const booksReadCount = userBooks.filter(b => b.status === 'read').length;
    const totalPagesRead = sessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);
    const hasNightSession = sessions.some(s => {
      const hour = new Date(s.endTime).getHours();
      return hour >= 22 || hour < 4;
    });
    const hasMorningSession = sessions.some(s => {
      const hour = new Date(s.endTime).getHours();
      return hour >= 5 && hour < 8;
    });
    const maxSessionMinutes = sessions.reduce((max, s) => Math.max(max, Math.round(s.durationSeconds / 60)), 0);

    const newlyUnlocked: Achievement[] = [];
    const baseList = currentAchievements.length ? currentAchievements : INITIAL_ACHIEVEMENTS;

    const updated = baseList.map(item => {
      let currentValue = item.currentValue;
      let shouldUnlock = item.isUnlocked;

      switch (item.id) {
        case 'first_session':
          currentValue = sessions.length;
          break;
        case 'first_book':
          currentValue = booksReadCount;
          break;
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
          currentValue = currentStreak;
          break;
        case 'pages_100':
        case 'pages_1000':
          currentValue = totalPagesRead;
          break;
        case 'night_owl':
          currentValue = hasNightSession ? 1 : 0;
          break;
        case 'early_bird':
          currentValue = hasMorningSession ? 1 : 0;
          break;
        case 'quotes_5':
          currentValue = quotes.length;
          break;
        case 'marathon_60':
          currentValue = maxSessionMinutes;
          break;
      }

      if (!shouldUnlock && currentValue >= item.requiredValue) {
        shouldUnlock = true;
        newlyUnlocked.push({
          ...item,
          currentValue,
          isUnlocked: true,
          unlockedAt: new Date().toISOString()
        });
      }

      return {
        ...item,
        currentValue,
        isUnlocked: shouldUnlock,
        unlockedAt: shouldUnlock ? (item.unlockedAt || new Date().toISOString()) : undefined
      };
    });

    return { achievements: updated, newlyUnlocked };
  }

  /**
   * Calculate consecutive streak days based on sessions
   */
  static calculateStreak(sessions: ReadingSession[]): {
    currentStreak: number;
    longestStreak: number;
    activeDates: Set<string>;
  } {
    if (!sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDates: new Set() };
    }

    // Set of distinct dates in YYYY-MM-DD format
    const activeDates = new Set<string>();
    sessions.forEach(s => {
      const d = new Date(s.endTime || s.startTime);
      const dateStr = d.toISOString().split('T')[0];
      activeDates.add(dateStr);
    });

    const sortedDates = Array.from(activeDates).sort().reverse();
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDates };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is active today or yesterday
    let currentStreak = 0;
    const hasToday = activeDates.has(todayStr);
    const hasYesterday = activeDates.has(yesterdayStr);

    if (hasToday || hasYesterday) {
      let checkDate = new Date(hasToday ? todayStr : yesterdayStr);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate max historical streak
    let longestStreak = currentStreak;
    const allAscending = Array.from(activeDates).sort();
    let tempStreak = 0;
    let prevTime = 0;

    allAscending.forEach(dateStr => {
      const currentTime = new Date(dateStr).getTime();
      if (prevTime === 0) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((currentTime - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevTime = currentTime;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    });

    return {
      currentStreak,
      longestStreak,
      activeDates
    };
  }
}
