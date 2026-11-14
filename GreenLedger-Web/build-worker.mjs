import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

const assets = {};
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.mp4': 'video/mp4',
};
const htmlRoutes = { 'index.html': '/', 'login.html': '/login' };
for (const filename of (await readdir('dist')).sort()) {
  const type = types[extname(filename)];
  if (!type) continue;
  const path = htmlRoutes[filename] || '/' + filename;
  const base64 = type.startsWith('image/') || type.startsWith('font/') || type.startsWith('video/') || extname(filename) === '.docx';
  const body = await readFile(`dist/${filename}`, base64 ? 'base64' : 'utf8');
  assets[path] = { type, body, base64 };
}

const worker = await readFile('worker/index.mjs', 'utf8');
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', worker.replace("import { assets } from './assets.mjs';",
  () => `const assets = ${JSON.stringify(assets)};`));
