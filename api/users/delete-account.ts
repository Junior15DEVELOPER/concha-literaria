// Vercel Serverless Function — /api/users/delete-account (LGPD / Privacidade)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser, comparePassword } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Confirmação de senha necessária para excluir a conta.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(403).json({ error: 'Senha incorreta. Não foi possível prosseguir com a exclusão.' });
    }

    // Exclusão completa em cascata
    await prisma.user.delete({
      where: { id: auth.userId }
    });

    return res.status(200).json({ message: 'Conta e todos os dados associados foram excluídos com sucesso.' });
  } catch (error: any) {
    console.error('[API Delete Account] Erro:', error);
    return res.status(500).json({ error: 'Erro ao excluir conta' });
  }
}
