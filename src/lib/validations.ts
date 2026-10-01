import { z } from 'zod';

// ==========================================
// AUTENTICAÇÃO E USUÁRIOS
// ==========================================

export const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  username: z
    .string()
    .min(3, 'O username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'O username deve conter apenas letras, números e underline'),
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha necessária'),
  birthDate: z.string().optional(),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal(''))
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(1, 'Informe a senha')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500, 'A biografia pode ter no máximo 500 caracteres').optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  readingGoalYear: z.number().int().min(1).max(365).optional(),
  dailyMinutesGoal: z.number().int().min(1).max(1440).optional(),
  dailyPagesGoal: z.number().int().min(1).max(2000).optional(),
  themePreference: z.enum(['light', 'dark', 'sepia']).optional(),
  isPublic: z.boolean().optional()
});

// ==========================================
// LIVROS E BIBLIOTECA
// ==========================================

export const readingStatusEnum = z.enum([
  'want_to_read',
  'reading',
  'read',
  'rereading',
  'abandoned',
  'favorite'
]);

export const bookSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(300),
  subtitle: z.string().max(300).optional(),
  authors: z.array(z.string()).min(1, 'Informe ao menos um autor'),
  isbn10: z.string().max(10).optional(),
  isbn13: z.string().max(13).optional(),
  publisher: z.string().max(200).optional(),
  publishedYear: z.number().int().optional(),
  pageCount: z.number().int().min(1, 'Número de páginas deve ser maior que 0'),
  coverUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  language: z.string().default('pt')
});

export const userBookUpdateSchema = z.object({
  status: readingStatusEnum.optional(),
  currentPage: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  isFavorite: z.boolean().optional(),
  reviewText: z.string().max(10000).optional(),
  reviewSpoiler: z.boolean().optional()
});

// ==========================================
// SESSÃO DE LEITURA (CRONÔMETRO)
// ==========================================

export const readingSessionCreateSchema = z.object({
  userBookId: z.string().min(1),
  bookId: z.string().min(1),
  startPage: z.number().int().min(0),
  endPage: z.number().int().min(0),
  durationSeconds: z.number().int().min(1, 'Sessão com duração inválida'),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  mood: z.string().optional()
}).refine((data) => data.endPage >= data.startPage, {
  message: 'A página final deve ser maior ou igual à página inicial',
  path: ['endPage']
});

// ==========================================
// NOTAS E CITAÇÕES
// ==========================================

export const readingNoteSchema = z.object({
  userBookId: z.string().min(1),
  page: z.number().int().min(0).optional(),
  content: z.string().min(1, 'O conteúdo da nota não pode estar vazio').max(5000),
  type: z.enum(['note', 'character', 'reflection', 'vocabulary', 'quote']).default('note'),
  isSpoiler: z.boolean().default(false),
  isPrivate: z.boolean().default(true)
});

export const quoteSchema = z.object({
  bookTitle: z.string().min(1, 'Título do livro é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  text: z.string().min(3, 'Citação muito curta').max(2000),
  page: z.number().int().min(0).optional(),
  context: z.string().max(500).optional(),
  isSpoiler: z.boolean().default(false),
  visibility: z.enum(['public', 'followers', 'private']).default('public')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type UserBookUpdateInput = z.infer<typeof userBookUpdateSchema>;
export type ReadingSessionInput = z.infer<typeof readingSessionCreateSchema>;
export type ReadingNoteInput = z.infer<typeof readingNoteSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
