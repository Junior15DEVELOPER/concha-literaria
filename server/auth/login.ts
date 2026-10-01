// Vercel Serverless Function — /api/auth/login
import prisma from '../../src/lib/prisma';
import { comparePassword, createSessionToken } from '../../src/lib/auth';
import { loginSchema } from '../../src/lib/validations';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 1. Validação com Zod
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Credenciais inválidas',
        issues: validation.error.flatten().fieldErrors
      });
    }

    const { email, password } = validation.data;

    // 2. Busca do usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        settings: true,
        streak: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // 3. Comparação de senha com bcrypt
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // 4. Emissão do token de sessão JWT
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    // 5. Retorno seguro
    return res.status(200).json({
      message: 'Login realizado com sucesso',
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
    console.error('[API Login] Erro interno:', error);
    return res.status(500).json({
      error: 'Erro interno ao autenticar usuário',
      detail: error?.message || 'Falha na conexão com banco de dados'
    });
  }
}
