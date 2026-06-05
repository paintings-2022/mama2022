import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Vite plugin to handle saving data.json locally during development
function saveDataPlugin() {
  return {
    name: 'save-data-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/saveData' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const dataPath = path.resolve(__dirname, 'public/data.json');
              const parsedData = JSON.parse(body);
              fs.writeFileSync(dataPath, JSON.stringify(parsedData, null, 2));
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Data saved successfully.' }));
            } catch (err) {
              console.error('Error saving data:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.url === '/api/saveImage' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { url, base64 } = JSON.parse(body);
              const relPath = url.replace(/^\//, '').replace(/\?.*$/, ''); // strip leading slash and query params
              const targetPath = path.resolve(__dirname, 'public', relPath);
              
              const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (!matches || matches.length !== 3) {
                throw new Error('Invalid base64 string');
              }
              const imageBuffer = Buffer.from(matches[2], 'base64');
              
              fs.writeFileSync(targetPath, imageBuffer);
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Image saved successfully.' }));
            } catch (err) {
              console.error('Error saving image:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.url === '/api/restoreImage' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { url } = JSON.parse(body);
              const relPath = url.replace(/^\//, '').replace(/\?.*$/, '');
              const targetPath = path.resolve(__dirname, 'public', relPath);
              const filename = path.basename(relPath);
              
              const rawDirs = ['public/picture/01s', 'public/picture/02s'];
              let originalPath = null;
              
              for (const dir of rawDirs) {
                const base = filename.replace(/\.[^/.]+$/, '');
                const try1 = path.resolve(__dirname, dir, base + '.JPG');
                const try2 = path.resolve(__dirname, dir, base + '.jpg');
                if (fs.existsSync(try1)) originalPath = try1;
                else if (fs.existsSync(try2)) originalPath = try2;
                if (originalPath) break;
              }

              if (!originalPath) throw new Error('Original high-res image not found.');

              const sharp = (await import('sharp')).default;
              await sharp(originalPath)
                .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80, progressive: true })
                .rotate()
                .toFile(targetPath);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Image restored successfully.' }));
            } catch (err) {
              console.error('Error restoring image:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.url === '/api/rotateImage' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { url } = JSON.parse(body);
              const relPath = url.replace(/^\//, '').replace(/\?.*$/, '');
              const compressedPath = path.resolve(__dirname, 'public', relPath);
              const filename = path.basename(relPath);
              
              const rawDirs = ['public/picture/01s', 'public/picture/02s'];
              let originalPath = null;
              
              for (const dir of rawDirs) {
                const base = filename.replace(/\.[^/.]+$/, '');
                const try1 = path.resolve(__dirname, dir, base + '.JPG');
                const try2 = path.resolve(__dirname, dir, base + '.jpg');
                if (fs.existsSync(try1)) originalPath = try1;
                else if (fs.existsSync(try2)) originalPath = try2;
                if (originalPath) break;
              }

              const sharp = (await import('sharp')).default;
              
              if (fs.existsSync(compressedPath)) {
                const buffer = await sharp(compressedPath).rotate(90).toBuffer();
                fs.writeFileSync(compressedPath, buffer);
              }
              
              if (originalPath && fs.existsSync(originalPath)) {
                const buffer = await sharp(originalPath).rotate(90).toBuffer();
                fs.writeFileSync(originalPath, buffer);
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Image rotated successfully.' }));
            } catch (err) {
              console.error('Error rotating image:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.url === '/api/deploy' && req.method === 'POST') {
          exec('git add . && git commit -m "Auto deploy from Admin" && git push', (err, stdout, stderr) => {
            if (err) {
              console.error('Error deploying:', err);
              console.error('stdout:', stdout);
              console.error('stderr:', stderr);
              
              const outStr = (stdout || '') + (stderr || '');
              // Check for nothing to commit in various languages (English, Chinese)
              const isNothingToCommit = outStr.includes('nothing to commit') || outStr.includes('無變更可提交') || outStr.includes('沒有變更');
              
              if (isNothingToCommit) {
                // If there's nothing to commit, we still try to push just in case
                exec('git push', (pushErr, pushOut, pushErrOut) => {
                  if (pushErr) {
                    console.error('Push error:', pushErr, pushOut, pushErrOut);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: pushErr.message + '\n' + pushErrOut }));
                  } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: '目前沒有新變更，且已確認同步到 GitHub。' }));
                  }
                });
              } else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message + '\n' + outStr }));
              }
            } else {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Deploy triggered successfully.' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  base: '/mama2022/', // Required for GitHub Pages deployment
  plugins: [react(), saveDataPlugin()],
});
