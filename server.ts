import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', app: 'RoomSewa Janakpur', time: new Date().toISOString() });
});

// Serve direct APK download if requested
app.get('/download/roomsewa.apk', (req, res) => {
  const apkPath = path.resolve(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
  res.download(apkPath, 'RoomSewa-Janakpur.apk', (err) => {
    if (err) {
      res.status(404).send('APK is being generated. Please try again in a few moments.');
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });

    // Intercept /@vite-plugin-pwa entry point in dev mode
    app.get('/@vite-plugin-pwa/*', (req, res) => {
      res.type('application/javascript').send('export default function registerDevSW() {}; export { registerDevSW };');
    });

    // Intercept /@vite/client to disable failing WebSocket connection in sandbox
    app.get('/@vite/client', async (req, res, next) => {
      try {
        const mod = await vite.transformRequest('/@vite/client');
        if (mod && mod.code) {
          let code = mod.code;
          code = code.replace(/await wsTransport\.connect\(handlers\);/g, '/* HMR disabled in sandbox */');
          code = code.replace(/wsTransport\.connect\(handlers\)/g, 'Promise.resolve()');
          code = code.replace(/ws\.send\(JSON\.stringify\(data\)\);/g, 'if (typeof ws !== "undefined" && ws && ws.send) { ws.send(JSON.stringify(data)); }');
          res.type('application/javascript').send(code);
          return;
        }
      } catch (e) {
        console.warn('Fallback vite client transform:', e);
      }
      next();
    });

    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        template = template.replace(/<script id="vite-plugin-pwa:register-dev-sw"[\s\S]*?<\/script>/g, '');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RoomSewa Janakpur server listening on port ${PORT}`);
  });
}

startServer();
