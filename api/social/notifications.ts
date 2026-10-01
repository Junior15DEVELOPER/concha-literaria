// Vercel Serverless Function — /api/social/notifications (Notificações)
import prisma from '../../src/lib/prisma';
import { getAuthenticatedUser } from '../../src/lib/auth';

export default async function handler(req: any, res: any) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  // 1. GET: Listar notificações e contador de não lidas
  if (req.method === 'GET') {
    try {
      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: auth.userId },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                username: true,
                profile: { select: { avatarUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 30
        }),
        prisma.notification.count({
          where: { userId: auth.userId, read: false }
        })
      ]);

      return res.status(200).json({
        notifications,
        unreadCount
      });
    } catch (error: any) {
      console.error('[API Notifications GET] Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
  }

  // 2. PUT: Marcar como lida(s)
  if (req.method === 'PUT') {
    try {
      const { notificationId, markAllAsRead } = req.body || {};

      if (markAllAsRead) {
        await prisma.notification.updateMany({
          where: { userId: auth.userId, read: false },
          data: { read: true }
        });
        return res.status(200).json({ message: 'Todas as notificações foram marcadas como lidas.' });
      }

      if (notificationId) {
        await prisma.notification.updateMany({
          where: { id: String(notificationId), userId: auth.userId },
          data: { read: true }
        });
        return res.status(200).json({ message: 'Notificação marcada como lida.' });
      }

      return res.status(400).json({ error: 'Informe notificationId ou markAllAsRead: true' });
    } catch (error: any) {
      console.error('[API Notifications PUT] Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
