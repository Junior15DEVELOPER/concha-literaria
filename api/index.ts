// Unified Serverless Dispatcher — Concha Literária (Vercel)
import healthHandler from '../server/health';
import authLoginHandler from '../server/auth/login';
import authRegisterHandler from '../server/auth/register';
import authMeHandler from '../server/auth/me';
import userProfileHandler from '../server/users/profile';
import userSettingsHandler from '../server/users/settings';
import userDeleteAccountHandler from '../server/users/delete-account';
import userExportHandler from '../server/users/export';
import userImportHandler from '../server/users/import';
import libraryIndexHandler from '../server/library/index';
import libraryUpdateHandler from '../server/library/update';
import collectionsIndexHandler from '../server/collections/index';
import collectionsManageHandler from '../server/collections/manage';
import readingSessionHandler from '../server/reading/session';
import readingStreakHandler from '../server/reading/streak';
import goalsHandler from '../server/goals/index';
import achievementsHandler from '../server/achievements/index';
import booksSearchHandler from '../server/books/search';
import socialPostsHandler from '../server/social/posts';
import socialLikeHandler from '../server/social/like';
import socialCommentsHandler from '../server/social/comments';
import socialFollowHandler from '../server/social/follow';
import socialNotificationsHandler from '../server/social/notifications';
import statisticsHandler from '../server/statistics/index';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse JSON body safely if sent as raw text
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // Continue if body cannot be parsed as JSON
    }
  }

  // Normalize path name
  const rawUrl = req.url || '';
  let pathname = rawUrl.split('?')[0].replace(/\/$/, '') || '/api';
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
  }

  try {
    switch (pathname) {
      case '/api':
      case '/api/health':
        return await healthHandler(req, res);

      case '/api/auth/login':
        return await authLoginHandler(req, res);

      case '/api/auth/register':
        return await authRegisterHandler(req, res);

      case '/api/auth/me':
        return await authMeHandler(req, res);

      case '/api/users/profile':
        return await userProfileHandler(req, res);

      case '/api/users/settings':
        return await userSettingsHandler(req, res);

      case '/api/users/delete-account':
        return await userDeleteAccountHandler(req, res);

      case '/api/users/export':
        return await userExportHandler(req, res);

      case '/api/users/import':
        return await userImportHandler(req, res);

      case '/api/library':
        return await libraryIndexHandler(req, res);

      case '/api/library/update':
        return await libraryUpdateHandler(req, res);

      case '/api/collections':
        return await collectionsIndexHandler(req, res);

      case '/api/collections/manage':
        return await collectionsManageHandler(req, res);

      case '/api/reading/session':
        return await readingSessionHandler(req, res);

      case '/api/reading/streak':
        return await readingStreakHandler(req, res);

      case '/api/goals':
        return await goalsHandler(req, res);

      case '/api/achievements':
        return await achievementsHandler(req, res);

      case '/api/books/search':
        return await booksSearchHandler(req, res);

      case '/api/social/posts':
        return await socialPostsHandler(req, res);

      case '/api/social/like':
        return await socialLikeHandler(req, res);

      case '/api/social/comments':
        return await socialCommentsHandler(req, res);

      case '/api/social/follow':
        return await socialFollowHandler(req, res);

      case '/api/social/notifications':
        return await socialNotificationsHandler(req, res);

      case '/api/statistics':
        return await statisticsHandler(req, res);

      default:
        return res.status(404).json({
          error: 'Rota não encontrada',
          path: pathname,
          availableEndpoints: [
            '/api/health',
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/me',
            '/api/users/profile',
            '/api/users/settings',
            '/api/library',
            '/api/collections',
            '/api/reading/session',
            '/api/goals',
            '/api/achievements',
            '/api/books/search',
            '/api/social/posts',
            '/api/statistics'
          ]
        });
    }
  } catch (error: any) {
    console.error(`[API Router] Erro em ${pathname}:`, error);
    return res.status(500).json({
      error: 'Erro interno no servidor',
      message: error?.message || 'Falha inesperada',
      path: pathname
    });
  }
}
