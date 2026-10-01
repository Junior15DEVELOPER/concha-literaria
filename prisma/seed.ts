// Seed de Desenvolvimento — Concha Literária
// Este script é exclusivo para ambiente de desenvolvimento local.
import { PrismaClient, ReadingStatus, PostType, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Iniciando o Seed de desenvolvimento do Concha Literária...');

  // 1. Limpeza em ordem correta de integridade referencial
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.collectionBook.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.review.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.readingNote.deleteMany();
  await prisma.readingGoal.deleteMany();
  await prisma.readingStreak.deleteMany();
  await prisma.readingSession.deleteMany();
  await prisma.userBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  console.info('🧹 Banco limpo com sucesso.');

  // 2. Conquistas canônicas do sistema
  const achievementsData = [
    {
      id: 'first_session',
      title: 'Primeira Leitura',
      description: 'Concluiu sua primeira sessão de leitura no Concha.',
      category: 'reading',
      iconName: 'BookOpen',
      xpReward: 50
    },
    {
      id: 'first_book_finished',
      title: 'Primeiro Livro Concluído',
      description: 'Finalizou a leitura do seu primeiro livro na plataforma.',
      category: 'books',
      iconName: 'CheckCircle2',
      xpReward: 100
    },
    {
      id: 'streak_7_days',
      title: 'Hábito em Chamas (7 Dias)',
      description: 'Manteve uma sequência de leitura por 7 dias seguidos.',
      category: 'streak',
      iconName: 'Flame',
      xpReward: 150
    },
    {
      id: 'streak_30_days',
      title: 'Mestre da Constância (30 Dias)',
      description: 'Manteve sua sequência de leitura ininterrupta por 30 dias.',
      category: 'streak',
      iconName: 'Flame',
      xpReward: 500
    },
    {
      id: 'pages_100',
      title: 'Centésima Página',
      description: 'Leu mais de 100 páginas acumuladas.',
      category: 'pages',
      iconName: 'FileText',
      xpReward: 50
    },
    {
      id: 'pages_1000',
      title: 'Clube dos Mil',
      description: 'Alcançou a marca incrível de 1.000 páginas lidas.',
      category: 'pages',
      iconName: 'Award',
      xpReward: 300
    },
    {
      id: 'night_reader',
      title: 'Leitor Noturno',
      description: 'Realizou uma sessão de leitura após a meia-noite.',
      category: 'special',
      iconName: 'Moon',
      xpReward: 75
    }
  ];

  for (const ach of achievementsData) {
    await prisma.achievement.create({ data: ach });
  }
  console.info(`🏆 ${achievementsData.length} Conquistas criadas.`);

  // 3. Usuários de desenvolvimento
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('SenhaForte123!', salt);

  const userAlice = await prisma.user.create({
    data: {
      email: 'alice@conchaliteraria.com',
      username: 'alice_leitora',
      name: 'Alice Monteiro',
      passwordHash,
      profile: {
        create: {
          bio: 'Leitora de ficção, clássicos brasileiros e ficção científica.',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          readingGoalYear: 24,
          dailyMinutesGoal: 30,
          dailyPagesGoal: 25,
          themePreference: 'light'
        }
      },
      settings: {
        create: {
          profileVisibility: 'PUBLIC',
          libraryVisibility: 'PUBLIC',
          activityVisibility: 'PUBLIC'
        }
      },
      streak: {
        create: {
          currentStreak: 7,
          longestStreak: 12,
          lastReadDate: new Date(),
          activeDates: ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']
        }
      }
    }
  });

  const userBob = await prisma.user.create({
    data: {
      email: 'bob@conchaliteraria.com',
      username: 'bob_books',
      name: 'Roberto Silva',
      passwordHash,
      profile: {
        bio: 'Historiador e amante de biografias e filosofia.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        readingGoalYear: 18,
        dailyMinutesGoal: 20,
        dailyPagesGoal: 15,
        themePreference: 'sepia'
      },
      settings: {
        create: {
          profileVisibility: 'PUBLIC',
          libraryVisibility: 'PUBLIC'
        }
      },
      streak: {
        create: {
          currentStreak: 3,
          longestStreak: 5,
          lastReadDate: new Date(),
          activeDates: ['2026-09-29', '2026-09-30', '2026-10-01']
        }
      }
    }
  });

  console.info('👥 2 Usuários de teste criados (Alice e Bob). Senha padrão: SenhaForte123!');

  // Seguir
  await prisma.follow.create({
    data: {
      followerId: userAlice.id,
      followingId: userBob.id
    }
  });

  // 4. Livros canônicos
  const book1 = await prisma.book.create({
    data: {
      title: 'Dom Casmurro',
      authors: ['Machado de Assis'],
      publisher: 'Editora Garnier',
      publishedYear: 1899,
      pageCount: 256,
      categories: ['Literatura Brasileira', 'Clássicos', 'Romance'],
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
      description: 'Obra prima de Machado de Assis narrando as memórias de Bento Santiago e a enigmática Capitu.'
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'Memórias Póstumas de Brás Cubas',
      authors: ['Machado de Assis'],
      publisher: 'Tipografia Nacional',
      publishedYear: 1881,
      pageCount: 208,
      categories: ['Literatura Brasileira', 'Realismo', 'Ironia'],
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
      description: 'Um defunto autor dedica suas memórias ao verme que primeiro roeu as frias carnes de seu cadáver.'
    }
  });

  console.info('📚 2 Livros canônicos criados.');

  // 5. UserBook da Alice
  const userBook1 = await prisma.userBook.create({
    data: {
      userId: userAlice.id,
      bookId: book1.id,
      status: ReadingStatus.READING,
      currentPage: 128,
      isFavorite: true,
      startDate: new Date('2026-09-20')
    }
  });

  // UserBook do Bob
  await prisma.userBook.create({
    data: {
      userId: userBob.id,
      bookId: book1.id,
      status: ReadingStatus.READ,
      currentPage: 256,
      rating: 5.0,
      finishDate: new Date('2026-09-28')
    }
  });

  // 6. Sessão de leitura válida da Alice
  await prisma.readingSession.create({
    data: {
      userId: userAlice.id,
      userBookId: userBook1.id,
      bookId: book1.id,
      startPage: 100,
      endPage: 128,
      pagesRead: 28,
      durationSeconds: 1500, // 25 min
      startedAt: new Date(Date.now() - 1500 * 1000),
      endedAt: new Date(),
      notes: 'Capítulo sobre os olhos de ressaca de Capitu. Prosa magistral.'
    }
  });

  // 7. Citação
  await prisma.quote.create({
    data: {
      userId: userAlice.id,
      bookId: book1.id,
      bookTitle: 'Dom Casmurro',
      author: 'Machado de Assis',
      page: 123,
      text: 'Capitu era Capitu, isto é, uma criatura muito particular, mais mulher do que eu era homem.',
      context: 'Descrição clássica de Capitu',
      visibility: 'PUBLIC'
    }
  });

  // 8. Post social no feed
  const post = await prisma.post.create({
    data: {
      userId: userAlice.id,
      type: PostType.BOOK_STARTED,
      content: 'Iniciei a releitura de Dom Casmurro! A cada página a sutileza psicológica de Machado surpreende ainda mais.',
      bookId: book1.id
    }
  });

  // Curtida e comentário do Bob
  await prisma.like.create({
    data: {
      userId: userBob.id,
      postId: post.id
    }
  });

  await prisma.comment.create({
    data: {
      userId: userBob.id,
      postId: post.id,
      content: 'Excelente escolha! Preste atenção especial na narrativa do agregado José Dias.'
    }
  });

  // Atualizar contadores do post
  await prisma.post.update({
    where: { id: post.id },
    data: { likesCount: 1, commentCount: 1 }
  });

  // Notificação para a Alice
  await prisma.notification.create({
    data: {
      userId: userAlice.id,
      actorId: userBob.id,
      type: NotificationType.POST_COMMENT,
      title: 'Novo comentário',
      message: 'Roberto Silva comentou na sua publicação.'
    }
  });

  console.info('✨ Seed de desenvolvimento finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
