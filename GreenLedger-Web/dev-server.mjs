// Chạy thử GreenLedger Web cục bộ qua chính Worker (đăng nhập, tài khoản, phân quyền).
// D1 được giả lập bằng node:sqlite và lưu ở .dev/accounts.sqlite; khóa phiên chỉ dùng khi chạy thử.
// Chạy: node dev-server.mjs [cổng]   (mặc định 8787) rồi mở http://localhost:8787
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createD1 } from './dev/d1-sqlite.mjs';
import { loadWorker } from './dev/load-worker.mjs';

const port = Number(process.argv[2] || process.env.PORT || 8787);
await mkdir(new URL('./.dev/', import.meta.url), { recursive: true });
const worker = await loadWorker();
const env = {
  DB: createD1(fileURLToPath(new URL('./.dev/accounts.sqlite', import.meta.url))),
  GL_SESSION_KEY: process.env.GL_SESSION_KEY || 'greenledger-local-dev-only',
};

createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
      method: incoming.method, headers,
      body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end('Lỗi máy chủ chạy thử.');
  }
}).listen(port, '127.0.0.1', () => console.log(`GreenLedger chạy thử: http://localhost:${port}`));
