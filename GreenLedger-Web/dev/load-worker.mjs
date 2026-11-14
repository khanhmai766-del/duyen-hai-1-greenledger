// Đóng gói Worker như khi triển khai (node build-worker.mjs) rồi nạp bản đóng gói dưới dạng ES module.
import { execFileSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export async function loadWorker() {
  execFileSync(process.execPath, ['build-worker.mjs'], { cwd: root, stdio: 'inherit' });
  const target = new URL('../dist/server/worker.mjs', import.meta.url);
  await copyFile(new URL('../dist/server/index.js', import.meta.url), target);
  return (await import(pathToFileURL(fileURLToPath(target)).href + '?t=' + Date.now())).default;
}
