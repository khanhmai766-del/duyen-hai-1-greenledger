import { assets } from './assets.mjs';

// GreenLedger Web Worker: trang đăng nhập, tài khoản người dùng có phân quyền và tài nguyên ứng dụng.
// Có binding D1 `DB`: tài khoản lưu trong bảng `users` (xem migrations/0001_accounts.sql).
// Chưa có `DB`: giữ chế độ cũ, một tài khoản vận hành `pxvh1` với mật khẩu từ bí mật GL_OPERATOR_PASSWORD.

const sessionCookie = '__Host-greenledger_session';
const sessionLifetime = 8 * 60 * 60;
const encoder = new TextEncoder();
const pbkdf2Iterations = 100000; // Mức tối đa Cloudflare Workers cho phép với PBKDF2.
const maxFailedLogins = 5;
const lockSeconds = 5 * 60;
const defaultAdmin = 'pxvh1';
const permissionIds = ['periods', 'data', 'factors', 'import', 'export', 'users'];
const roleIds = ['admin', 'editor', 'entry', 'viewer', 'custom'];
const publicPaths = /^\/(login\.css|duyen-hai\.png|(bricolage-grotesque|source-sans-3)-[\w-]+\.woff2)$/;

const usersTable = `CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  must_change INTEGER NOT NULL DEFAULT 0,
  disabled INTEGER NOT NULL DEFAULT 0,
  session_stamp TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER
)`;

/* ---------- Mã hóa ---------- */

const now = () => Math.floor(Date.now() / 1000);
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const randomToken = (size = 16) => base64url(crypto.getRandomValues(new Uint8Array(size)));

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations }, key, 256);
  return base64url(new Uint8Array(bits));
}

async function passwordRecord(password) {
  const salt = randomToken(16);
  return { salt, iterations: pbkdf2Iterations, hash: await derivePassword(password, salt, pbkdf2Iterations) };
}

async function passwordMatchesRecord(password, row) {
  const hash = await derivePassword(password, row.salt, row.iterations);
  return equalBytes(encoder.encode(hash), encoder.encode(row.password_hash));
}

async function sign(payload, env) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.GL_SESSION_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

/* ---------- HTTP ---------- */

function cookieHeader(value, age) {
  return `${sessionCookie}=${value}; Max-Age=${age}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(request) {
  const cookie = (request.headers.get('cookie') || '').split(';').map(item => item.trim())
    .find(item => item.startsWith(`${sessionCookie}=`));
  return cookie ? cookie.slice(sessionCookie.length + 1) : '';
}

function redirect(location, cookie) {
  const headers = new Headers({ location, 'Cache-Control': 'no-store' });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  } });
}

const fail = (status, error) => json({ error }, status);

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

function loginPage(message = '', status = 200, username = '') {
  // Giữ lại tên tài khoản vừa nhập khi đăng nhập không thành công.
  const value = String(username).slice(0, 64).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const body = assets['/login'].body
    .replace('<!-- login-error -->', message ? `<p class="login-error" role="alert">${message}</p>` : '')
    .replace('<!-- account-links -->', '')
    .replace('<input id="username" name="username"', `<input id="username" name="username" value="${value}"`);
  return asset('/login', body, status);
}

async function readForm(request) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return null;
  if (Number(request.headers.get('content-length')) > 2048) return null;
  const body = await request.text();
  return body.length > 2048 ? null : new URLSearchParams(body);
}

async function readJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Cần gửi dữ liệu dạng JSON.');
  if (Number(request.headers.get('content-length')) > 8192) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.');
  const text = await request.text();
  if (text.length > 8192) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.');
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value;
  } catch {
    throw new HttpError(400, 'Dữ liệu JSON không hợp lệ.');
  }
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* ---------- Chế độ cũ: một tài khoản vận hành ---------- */

function legacyContext(request, env, expiry) {
  const viewer = request.headers.get('oai-authenticated-user-id') || '';
  return JSON.stringify([expiry, viewer, env.GL_OPERATOR_PASSWORD]);
}

async function legacySession(request, env) {
  const match = readCookie(request).match(/^(\d{10})\.([\w-]{43})$/);
  if (!match || Number(match[1]) <= now()) return null;
  const expected = await sign(legacyContext(request, env, match[1]), env);
  if (!equalBytes(encoder.encode(match[2]), encoder.encode(expected))) return null;
  return { legacy: true, username: defaultAdmin, display_name: 'Tài khoản vận hành', role: 'admin',
    permissions: JSON.stringify(permissionIds), must_change: 0 };
}

async function legacyLogin(request, env, form) {
  const hashes = await Promise.all([form.get('password') || '', env.GL_OPERATOR_PASSWORD].map(value =>
    crypto.subtle.digest('SHA-256', encoder.encode(value))));
  if (form.get('username') !== defaultAdmin || !equalBytes(...hashes.map(hash => new Uint8Array(hash)))) {
    return loginPage('Tài khoản hoặc mật khẩu chưa đúng.', 401, form.get('username') || '');
  }
  const expiry = String(now() + sessionLifetime);
  return redirect('/', cookieHeader(`${expiry}.${await sign(legacyContext(request, env, expiry), env)}`, sessionLifetime));
}

/* ---------- Tài khoản trong D1 ---------- */

const readyDatabases = new WeakSet();

async function ensureAccounts(env) {
  if (readyDatabases.has(env.DB)) return;
  await env.DB.prepare(usersTable).run();
  const { count } = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
  if (!count) {
    // Tài khoản quản trị đầu tiên. Mật khẩu ban đầu lấy từ bí mật GL_INITIAL_ADMIN_PASSWORD nếu có,
    // nếu không là "pxvh1" theo yêu cầu vận hành; ứng dụng nhắc đổi ngay sau khi đăng nhập.
    const record = await passwordRecord(env.GL_INITIAL_ADMIN_PASSWORD || defaultAdmin);
    const time = now();
    await env.DB.prepare(`INSERT OR IGNORE INTO users (username, display_name, role, permissions, password_hash, salt, iterations,
      must_change, disabled, session_stamp, created_at, updated_at) VALUES (?, ?, 'admin', ?, ?, ?, ?, 1, 0, ?, ?, ?)`)
      .bind(defaultAdmin, 'Quản trị hệ thống', JSON.stringify(permissionIds), record.hash, record.salt, record.iterations,
        randomToken(), time, time).run();
  }
  readyDatabases.add(env.DB);
}

const findUser = (env, username) => env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

function publicUser(row) {
  return {
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    permissions: JSON.parse(row.permissions),
    mustChange: Boolean(row.must_change),
    disabled: Boolean(row.disabled),
    locked: Number(row.locked_until || 0) > now(),
    lastLogin: row.last_login ?? null,
    createdAt: row.created_at ?? null,
  };
}

const can = (row, permission) => JSON.parse(row.permissions).includes(permission);

async function issueSession(env, row) {
  const expiry = String(now() + sessionLifetime);
  const name = base64url(encoder.encode(row.username));
  const signature = await sign(JSON.stringify([expiry, row.username, row.session_stamp]), env);
  return cookieHeader(`${expiry}.${name}.${row.session_stamp}.${signature}`, sessionLifetime);
}

async function accountSession(request, env) {
  const match = readCookie(request).match(/^(\d{10})\.([\w-]{1,96})\.([\w-]{16,32})\.([\w-]{43})$/);
  if (!match || Number(match[1]) <= now()) return null;
  let username;
  try { username = new TextDecoder().decode(Uint8Array.from(atob(match[2].replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))); }
  catch { return null; }
  const expected = await sign(JSON.stringify([match[1], username, match[3]]), env);
  if (!equalBytes(encoder.encode(match[4]), encoder.encode(expected))) return null;
  const row = await findUser(env, username);
  // Dấu phiên đổi khi đổi mật khẩu, quyền hoặc khóa tài khoản: các phiên cũ hết hiệu lực ngay.
  if (!row || row.disabled || row.session_stamp !== match[3]) return null;
  return row;
}

async function accountLogin(env, form) {
  const username = String(form.get('username') || '').trim().toLowerCase();
  const password = form.get('password') || '';
  const row = username ? await findUser(env, username) : null;
  const time = now();
  if (!row || row.disabled) {
    await derivePassword(password, 'greenledger-timing', pbkdf2Iterations); // Giữ thời gian phản hồi như nhau.
    return loginPage('Tài khoản hoặc mật khẩu chưa đúng.', 401, username);
  }
  if (row.locked_until > time) {
    return loginPage(`Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ${Math.ceil((row.locked_until - time) / 60)} phút.`, 429, username);
  }
  if (!(await passwordMatchesRecord(password, row))) {
    const failed = row.failed_count + 1;
    const locked = failed >= maxFailedLogins;
    await env.DB.prepare('UPDATE users SET failed_count = ?, locked_until = ? WHERE username = ?')
      .bind(locked ? 0 : failed, locked ? time + lockSeconds : 0, row.username).run();
    return locked
      ? loginPage(`Nhập sai ${maxFailedLogins} lần. Tài khoản tạm khóa ${lockSeconds / 60} phút.`, 429, username)
      : loginPage(`Tài khoản hoặc mật khẩu chưa đúng. Còn ${maxFailedLogins - failed} lần thử.`, 401, username);
  }
  await env.DB.prepare('UPDATE users SET failed_count = 0, locked_until = 0, last_login = ? WHERE username = ?')
    .bind(time, row.username).run();
  return redirect('/', await issueSession(env, row));
}

/* ---------- Kiểm tra dữ liệu tài khoản ---------- */

function checkPassword(password, username) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new HttpError(400, 'Mật khẩu cần từ 8 đến 128 ký tự.');
  }
  if (password.toLowerCase() === String(username).toLowerCase()) throw new HttpError(400, 'Mật khẩu không được trùng tên tài khoản.');
}

function checkPermissions(value) {
  if (!Array.isArray(value) || value.some(item => !permissionIds.includes(item))) throw new HttpError(400, 'Danh sách quyền không hợp lệ.');
  return permissionIds.filter(item => value.includes(item));
}

function checkProfile(body) {
  const displayName = String(body.displayName ?? '').trim();
  if (!displayName || displayName.length > 80) throw new HttpError(400, 'Tên hiển thị cần từ 1 đến 80 ký tự.');
  if (!roleIds.includes(body.role)) throw new HttpError(400, 'Vai trò không hợp lệ.');
  return { displayName, role: body.role, permissions: checkPermissions(body.permissions) };
}

async function activeManagers(env, except) {
  const { results } = await env.DB.prepare('SELECT username, permissions FROM users WHERE disabled = 0').all();
  return results.filter(row => row.username !== except && can(row, 'users')).length;
}

/* ---------- API ---------- */

async function api(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (method !== 'GET' && request.headers.get('origin') !== url.origin) throw new HttpError(403, 'Yêu cầu không đến từ GreenLedger.');

  if (path === '/api/me' && method === 'GET') {
    return json({ mode: user.legacy ? 'legacy' : 'accounts', user: publicUser(user) });
  }
  if (user.legacy) throw new HttpError(501, 'Cần cơ sở dữ liệu D1 (binding DB) để quản lý tài khoản.');

  if (path === '/api/me/password' && method === 'POST') {
    const body = await readJson(request);
    if (!(await passwordMatchesRecord(String(body.current ?? ''), user))) throw new HttpError(400, 'Mật khẩu hiện tại chưa đúng.');
    checkPassword(body.next, user.username);
    if (body.next === body.current) throw new HttpError(400, 'Mật khẩu mới cần khác mật khẩu hiện tại.');
    const record = await passwordRecord(body.next);
    const stamp = randomToken();
    await env.DB.prepare(`UPDATE users SET password_hash = ?, salt = ?, iterations = ?, must_change = 0, session_stamp = ?,
      updated_at = ? WHERE username = ?`).bind(record.hash, record.salt, record.iterations, stamp, now(), user.username).run();
    const updated = await findUser(env, user.username);
    return json({ user: publicUser(updated) }, 200, { 'Set-Cookie': await issueSession(env, updated) });
  }

  if (!can(user, 'users')) throw new HttpError(403, 'Tài khoản của bạn không có quyền quản lý người dùng.');

  if (path === '/api/users' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM users ORDER BY created_at, username').all();
    return json({ users: results.map(publicUser) });
  }

  if (path === '/api/users' && method === 'POST') {
    const body = await readJson(request);
    const username = String(body.username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
      throw new HttpError(400, 'Tên tài khoản 3–32 ký tự, gồm chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.');
    }
    const profile = checkProfile(body);
    checkPassword(body.password, username);
    if (await findUser(env, username)) throw new HttpError(409, 'Tên tài khoản đã tồn tại.');
    const record = await passwordRecord(body.password);
    const time = now();
    await env.DB.prepare(`INSERT INTO users (username, display_name, role, permissions, password_hash, salt, iterations,
      must_change, disabled, session_stamp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`)
      .bind(username, profile.displayName, profile.role, JSON.stringify(profile.permissions), record.hash, record.salt,
        record.iterations, randomToken(), time, time).run();
    return json({ user: publicUser(await findUser(env, username)) }, 201);
  }

  const target = path.match(/^\/api\/users\/([a-z0-9._-]{3,32})$/)?.[1];
  if (target && (method === 'PATCH' || method === 'DELETE')) {
    const row = await findUser(env, target);
    if (!row) throw new HttpError(404, 'Không tìm thấy tài khoản.');
    const self = row.username === user.username;

    if (method === 'DELETE') {
      if (self) throw new HttpError(400, 'Không thể xóa tài khoản đang đăng nhập.');
      if (can(row, 'users') && !row.disabled && !(await activeManagers(env, row.username))) {
        throw new HttpError(400, 'Cần giữ ít nhất một tài khoản có quyền quản lý người dùng.');
      }
      await env.DB.prepare('DELETE FROM users WHERE username = ?').bind(row.username).run();
      return json({ deleted: row.username });
    }

    const body = await readJson(request);
    const changes = {};
    let newStamp = false;
    if ('displayName' in body || 'role' in body || 'permissions' in body) {
      const profile = checkProfile({ displayName: body.displayName ?? row.display_name, role: body.role ?? row.role,
        permissions: body.permissions ?? JSON.parse(row.permissions) });
      if (self && !profile.permissions.includes('users')) throw new HttpError(400, 'Không thể tự bỏ quyền quản lý người dùng của chính mình.');
      changes.display_name = profile.displayName;
      changes.role = profile.role;
      const permissions = JSON.stringify(profile.permissions);
      if (permissions !== row.permissions) { changes.permissions = permissions; newStamp = true; }
    }
    if ('disabled' in body) {
      if (self && body.disabled) throw new HttpError(400, 'Không thể khóa tài khoản đang đăng nhập.');
      if (Boolean(body.disabled) !== Boolean(row.disabled)) { changes.disabled = body.disabled ? 1 : 0; newStamp = true; }
    }
    if ('password' in body) {
      checkPassword(body.password, row.username);
      const record = await passwordRecord(body.password);
      Object.assign(changes, { password_hash: record.hash, salt: record.salt, iterations: record.iterations,
        must_change: self ? 0 : 1, failed_count: 0, locked_until: 0 });
      newStamp = true;
    }
    if (body.unlock) Object.assign(changes, { failed_count: 0, locked_until: 0 });
    const losesManager = can(row, 'users') && !row.disabled &&
      ((changes.permissions && !JSON.parse(changes.permissions).includes('users')) || changes.disabled === 1);
    if (losesManager && !(await activeManagers(env, row.username))) {
      throw new HttpError(400, 'Cần giữ ít nhất một tài khoản có quyền quản lý người dùng.');
    }
    if (newStamp) changes.session_stamp = randomToken();
    changes.updated_at = now();
    const columns = Object.keys(changes);
    await env.DB.prepare(`UPDATE users SET ${columns.map(column => `${column} = ?`).join(', ')} WHERE username = ?`)
      .bind(...columns.map(column => changes[column]), row.username).run();
    const updated = await findUser(env, row.username);
    const headers = self && newStamp ? { 'Set-Cookie': await issueSession(env, updated) } : {};
    return json({ user: publicUser(updated) }, 200, headers);
  }

  throw new HttpError(404, 'Không có API này.');
}

/* ---------- Điều phối ---------- */

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const read = method === 'GET' || method === 'HEAD';
    if (read && publicPaths.test(path)) return asset(path, method === 'HEAD' ? null : undefined);

    const accounts = Boolean(env.DB && env.GL_SESSION_KEY);
    const configured = accounts || Boolean(env.GL_OPERATOR_PASSWORD && env.GL_SESSION_KEY);
    try {
      if (accounts) await ensureAccounts(env);

      if (method === 'POST' && ['/login', '/logout'].includes(path)) {
        if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
        if (path === '/logout') return redirect('/login', cookieHeader('', 0));
        if (!configured) return loginPage('Tài khoản Web chưa được cấu hình.', 503);
        const form = await readForm(request);
        if (!form) return new Response(null, { status: 400 });
        return accounts ? accountLogin(env, form) : legacyLogin(request, env, form);
      }

      const user = !configured ? null : accounts ? await accountSession(request, env) : await legacySession(request, env);
      if (path.startsWith('/api/')) {
        if (!user) return fail(401, 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');
        return await api(request, env, url, user);
      }
      if (!read) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      if (path === '/login' || path === '/login.html') {
        if (user) return redirect('/');
        return method === 'HEAD' ? asset('/login', null) : loginPage();
      }
      if (!user) return redirect('/login');
      return asset(path === '/index.html' ? '/' : path, method === 'HEAD' ? null : undefined);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.message);
      throw error;
    }
  },
};
