import { mkdir, readFile, writeFile } from 'node:fs/promises';

const assets = {};
const files = [
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/login', 'login.html', 'text/html; charset=utf-8'],
  ['/style.css', 'style.css', 'text/css; charset=utf-8'],
  ['/login.css', 'login.css', 'text/css; charset=utf-8'],
  ['/engine.js', 'engine.js', 'text/javascript; charset=utf-8'],
  ['/app.js', 'app.js', 'text/javascript; charset=utf-8'],
  ['/duyen-hai.png', 'duyen-hai.png', 'image/png'],
];

for (const [path, filename, type] of files) {
  const base64 = type.startsWith('image/');
  const body = await readFile(`dist/${filename}`, base64 ? 'base64' : 'utf8');
  assets[path] = { type, body, base64 };
}

const worker = await readFile('worker/index.mjs', 'utf8');
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', worker.replace("import { assets } from './assets.mjs';",
  () => `const assets = ${JSON.stringify(assets)};`));
