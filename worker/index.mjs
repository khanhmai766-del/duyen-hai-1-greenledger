import { assets } from './assets.mjs';

function asset(path, method) {
  const item = assets[path];
  if (!item) return new Response('Không tìm thấy trang.', { status: 404 });
  const body = method === "HEAD" ? null : item.base64
    ? Uint8Array.from(atob(item.body), character => character.charCodeAt(0))
    : item.body;
  return new Response(body, { headers: {
    'Content-Type': item.type,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
  } });
}

export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/login' || path === '/login.html') {
      return Response.redirect(new URL('/', url), 302);
    }
    return asset(path === '/index.html' ? '/' : path, request.method);
  },
};
