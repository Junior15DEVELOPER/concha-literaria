// Vercel Serverless Function — /api/users/settings
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // GET: Obter configurações de privacidade atuais
  if (req.method === 'GET') {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: auth.userId }
      });
      return res.status(200).json({ settings });
    } catch (error: any) {
      console.error('[API Settings GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  // PUT: Atualizar configurações de privacidade
  if (req.method === 'PUT') {
    try {
      const {
        profileVisibility,
        activityVisibility,
        libraryVisibility,
        quotesVisibility,
        emailNotifications,
        pushNotifications
      } = req.body;

      const updated = await prisma.userSettings.upsert({
        where: { userId: auth.userId },
        create: {
          userId: auth.userId,
          profileVisibility: profileVisibility || 'PUBLIC',
          activityVisibility: activityVisibility || 'PUBLIC',
          libraryVisibility: libraryVisibility || 'PUBLIC',
          quotesVisibility: quotesVisibility || 'PUBLIC',
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          pushNotifications: pushNotifications !== undefined ? pushNotifications : true
        },
        update: {
          ...(profileVisibility && { profileVisibility }),
          ...(activityVisibility && { activityVisibility }),
          ...(libraryVisibility && { libraryVisibility }),
          ...(quotesVisibility && { quotesVisibility }),
          ...(emailNotifications !== undefined && { emailNotifications }),
          ...(pushNotifications !== undefined && { pushNotifications })
        }
      });

      return res.status(200).json({
        message: 'Configurações atualizadas com sucesso',
        settings: updated
      });
    } catch (error: any) {
      console.error('[API Settings PUT] Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
