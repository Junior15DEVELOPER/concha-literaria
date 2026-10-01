// Unified Serverless Dispatcher with Lazy Dynamic Imports — Concha Literária (Vercel)
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
      case '/api/health': {
        const mod = await import('../server/health');
        return await mod.default(req, res);
      }

      case '/api/auth/login': {
        const mod = await import('../server/auth/login');
        return await mod.default(req, res);
      }

      case '/api/auth/register': {
        const mod = await import('../server/auth/register');
        return await mod.default(req, res);
      }

      case '/api/auth/me': {
        const mod = await import('../server/auth/me');
        return await mod.default(req, res);
      }

      case '/api/users/profile': {
        const mod = await import('../server/users/profile');
        return await mod.default(req, res);
      }

      case '/api/users/settings': {
        const mod = await import('../server/users/settings');
        return await mod.default(req, res);
      }

      case '/api/users/delete-account': {
        const mod = await import('../server/users/delete-account');
        return await mod.default(req, res);
      }

      case '/api/users/export': {
        const mod = await import('../server/users/export');
        return await mod.default(req, res);
      }

      case '/api/users/import': {
        const mod = await import('../server/users/import');
        return await mod.default(req, res);
      }

      case '/api/library': {
        const mod = await import('../server/library/index');
        return await mod.default(req, res);
      }

      case '/api/library/update': {
        const mod = await import('../server/library/update');
        return await mod.default(req, res);
      }

      case '/api/collections': {
        const mod = await import('../server/collections/index');
        return await mod.default(req, res);
      }

      case '/api/collections/manage': {
        const mod = await import('../server/collections/manage');
        return await mod.default(req, res);
      }

      case '/api/reading/session': {
        const mod = await import('../server/reading/session');
        return await mod.default(req, res);
      }

      case '/api/reading/streak': {
        const mod = await import('../server/reading/streak');
        return await mod.default(req, res);
      }

      case '/api/goals': {
        const mod = await import('../server/goals/index');
        return await mod.default(req, res);
      }

      case '/api/achievements': {
        const mod = await import('../server/achievements/index');
        return await mod.default(req, res);
      }

      case '/api/books/search': {
        const mod = await import('../server/books/search');
        return await mod.default(req, res);
      }

      case '/api/social/posts': {
        const mod = await import('../server/social/posts');
        return await mod.default(req, res);
      }

      case '/api/social/like': {
        const mod = await import('../server/social/like');
        return await mod.default(req, res);
      }

      case '/api/social/comments': {
        const mod = await import('../server/social/comments');
        return await mod.default(req, res);
      }

      case '/api/social/follow': {
        const mod = await import('../server/social/follow');
        return await mod.default(req, res);
      }

      case '/api/social/notifications': {
        const mod = await import('../server/social/notifications');
        return await mod.default(req, res);
      }

      case '/api/statistics': {
        const mod = await import('../server/statistics/index');
        return await mod.default(req, res);
      }

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
