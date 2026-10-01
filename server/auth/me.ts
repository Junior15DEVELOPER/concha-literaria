// Vercel Serverless Function — /api/auth/me
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) {
      return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        profile: true,
        settings: true,
        streak: true,
        _count: {
          select: {
            library: true,
            quotes: true,
            notes: true,
            followers: true,
            following: true,
            achievements: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        settings: user.settings,
        streak: user.streak,
        counts: user._count
      }
    });
  } catch (error: any) {
    console.error('[API Me] Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar perfil do usuário' });
  }
}
