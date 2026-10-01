// Vercel Serverless Function — /api/auth/register
import prisma from '../../src/lib/prisma';
import { hashPassword, createSessionToken } from '../../src/lib/auth';
import { registerSchema } from '../../src/lib/validations';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 1. Validação estrita com Zod
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        issues: validation.error.flatten().fieldErrors
      });
    }

    const { name, username, email, password, birthDate, avatarUrl } = validation.data;

    // 2. Verificar se e-mail ou username já existem
    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Este nome de usuário já está em uso' });
    }

    // 3. Hash da senha
    const passwordHash = await hashPassword(password);

    // 4. Criação atômica do usuário com perfil, configurações e streak
    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            avatarUrl: avatarUrl || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            readingGoalYear: 24,
            dailyMinutesGoal: 30,
            dailyPagesGoal: 20,
            themePreference: 'light'
          }
        },
        settings: {
          create: {
            profileVisibility: 'PUBLIC',
            activityVisibility: 'PUBLIC',
            libraryVisibility: 'PUBLIC'
          }
        },
        streak: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            activeDates: []
          }
        }
      },
      include: {
        profile: true,
        settings: true,
        streak: true
      }
    });

    // 5. Emissão do token JWT seguro
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    // 6. Resposta sem expor dados sensíveis
    return res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        settings: user.settings,
        streak: user.streak
      }
    });
  } catch (error: any) {
    console.error('[API Register] Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno ao processar cadastro' });
  }
}
