import express from 'express';
import path from 'path';
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
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
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
