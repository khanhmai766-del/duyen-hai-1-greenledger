import { assets } from './assets.mjs';

const sessionCookie = '__Host-greenledger_session';
const sessionLifetime = 8 * 60 * 60;
const encoder = new TextEncoder();
function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

async function passwordMatches(entered, expected) {
  const hashes = await Promise.all([entered, expected].map(value =>
    crypto.subtle.digest('SHA-256', encoder.encode(value))));
  return equalBytes(...hashes.map(hash => new Uint8Array(hash)));
}

async function sessionSignature(payload, env) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.GL_SESSION_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function sessionContext(request, env, expiry) {
  const viewer = request.headers.get('oai-authenticated-user-id') || '';
  return JSON.stringify([expiry, viewer, env.GL_OPERATOR_PASSWORD]);
}

async function hasSession(request, env) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(item => item.trim())
    .find(item => item.startsWith(`${sessionCookie}=`));
  const match = cookie?.slice(sessionCookie.length + 1).match(/^(\d{10})\.([\w-]{43})$/);
  if (!match || Number(match[1]) <= Date.now() / 1000) return false;
  const expected = await sessionSignature(sessionContext(request, env, match[1]), env);
  return equalBytes(encoder.encode(match[2]), encoder.encode(expected));
}

function cookieHeader(value, age) {
  return `${sessionCookie}=${value}; Max-Age=${age}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(location, cookie) {
  const headers = new Headers({ location, 'Cache-Control': 'no-store' });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

function asset(path, body = assets[path]?.body, status = 200) {
  const item = assets[path];
  if (!Object.hasOwn(assets, path)) return new Response('Không tìm thấy trang.', { status: 404 });
  if (item.base64 && body !== null) body = Uint8Array.from(atob(body), character => character.charCodeAt(0));
  return new Response(body, { status, headers: {
    'Content-Type': item.type,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
  } });
}

function loginPage(message = '', status = 200) {
  const body = assets['/login'].body
    .replace('<!-- login-error -->', message ? `<p class="login-error" role="alert">${message}</p>` : '')
    .replace('<!-- account-links -->', '');
  return asset('/login', body, status);
}

async function login(request, env) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return new Response(null, { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > 2048) return new Response(null, { status: 413 });
  const body = await request.text();
  if (body.length > 2048) return new Response(null, { status: 413 });
  const data = new URLSearchParams(body);
  const username = data.get('username');
  const password = data.get('password') || '';
  if (username !== 'pxvh1' || !(await passwordMatches(password, env.GL_OPERATOR_PASSWORD))) {
    return loginPage('Tài khoản hoặc mật khẩu chưa đúng.', 401);
  }
  const expiry = String(Math.floor(Date.now() / 1000) + sessionLifetime);
  const signature = await sessionSignature(sessionContext(request, env, expiry), env);
  return redirect('/', cookieHeader(`${expiry}.${signature}`, sessionLifetime));
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const read = method === 'GET' || method === 'HEAD';
    if (read && ['/login.css', '/duyen-hai.png'].includes(path)) {
      return asset(path, method === 'HEAD' ? null : undefined);
    }

    const configured = Boolean(env.GL_OPERATOR_PASSWORD && env.GL_SESSION_KEY);
    if (method === 'POST' && ['/login', '/logout'].includes(path)) {
      if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
      if (path === '/logout') return redirect('/login', cookieHeader('', 0));
      if (!configured) return loginPage('Tài khoản Web chưa được cấu hình.', 503);
      return login(request, env);
    }
    if (!read) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });

    const signedIn = configured && await hasSession(request, env);
    if (path === '/login' || path === '/login.html') {
      if (signedIn) return redirect('/');
      return method === 'HEAD' ? asset('/login', null) : loginPage();
    }
    if (!signedIn) return redirect('/login');
    return asset(path === '/index.html' ? '/' : path, method === 'HEAD' ? null : undefined);
  },
};
