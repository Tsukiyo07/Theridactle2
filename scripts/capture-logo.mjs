import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../client');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save-favicon') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { image } = JSON.parse(body);
        const base64Data = image.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Save to client/favicon.png and client/apple-touch-icon.png
        const favPath = path.join(clientDir, 'favicon.png');
        const touchPath = path.join(clientDir, 'apple-touch-icon.png');
        fs.writeFileSync(favPath, buffer);
        fs.writeFileSync(touchPath, buffer);

        console.log(`[SUCCESS] Saved 512x512 transparent liquid metal logo to:`);
        console.log(`  - ${favPath} (${buffer.length} bytes)`);
        console.log(`  - ${touchPath} (${buffer.length} bytes)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', size: buffer.length }));

        setTimeout(() => {
          console.log('[INFO] Finished capture. Shutting down server.');
          process.exit(0);
        }, 500);
      } catch (err) {
        console.error('[ERROR] Failed to save favicon:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve static files from client directory
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/capture-liquid.html';
  const filePath = path.join(clientDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.json': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3888, '127.0.0.1', () => {
  console.log('[INFO] Capture server listening on http://127.0.0.1:3888');

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  const browserPath = chromePaths.find(p => fs.existsSync(p));
  if (!browserPath) {
    console.error('[ERROR] No Chrome or Edge executable found.');
    process.exit(1);
  }

  console.log(`[INFO] Launching browser: ${browserPath}`);
  const args = [
    '--headless=new',
    '--disable-gpu-vsync',
    '--use-gl=angle',
    '--enable-webgl',
    '--window-size=800,800',
    'http://127.0.0.1:3888/capture-liquid.html'
  ];

  const child = spawn(browserPath, args, { stdio: 'inherit' });
  child.on('error', err => {
    console.error('[ERROR] Browser launch failed:', err);
  });
});
