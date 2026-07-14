import type { Plugin } from 'vite';
import createHandler from '../../api/v1/qr/create';
import listHandler from '../../api/v1/qr/list';
import shortCodeHandler from '../../api/v1/qr/[shortCode]';
import verifyHandler from '../../api/v1/keys/verify';

export function viteApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api-serverless',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next) => {
        if (!req.url || !req.url.startsWith('/api/v1/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = urlObj.pathname;
          
          // Parse query string into req.query
          req.query = {};
          urlObj.searchParams.forEach((val, key) => {
            req.query[key] = val;
          });

          // Parse JSON body if POST/PUT
          if (['POST', 'PUT', 'PATCH'].includes(req.method || 'GET')) {
            await new Promise<void>((resolve, reject) => {
              let bodyStr = '';
              req.on('data', (chunk: Buffer) => {
                bodyStr += chunk.toString();
              });
              req.on('end', () => {
                try {
                  req.body = bodyStr ? JSON.parse(bodyStr) : {};
                  resolve();
                } catch (e) {
                  req.body = bodyStr;
                  resolve();
                }
              });
              req.on('error', reject);
            });
          }

          // Route dispatch
          if (pathname === '/api/v1/qr/create') {
            await createHandler(req, res);
            return;
          }
          if (pathname === '/api/v1/qr/list') {
            await listHandler(req, res);
            return;
          }
          if (pathname === '/api/v1/keys/verify') {
            await verifyHandler(req, res);
            return;
          }
          if (pathname.startsWith('/api/v1/qr/')) {
            const shortCode = pathname.replace('/api/v1/qr/', '').split('/')[0];
            if (shortCode) {
              req.query.shortCode = shortCode;
              await shortCodeHandler(req, res);
              return;
            }
          }

          // If not matched
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }));
        } catch (err: any) {
          console.error('Vite API Plugin Error:', err);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Server error' } }));
        }
      });
    }
  };
}
