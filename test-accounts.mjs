// Kiểm thử tài khoản và phân quyền của Worker trên D1 giả lập (node:sqlite).
// Chạy: node test-accounts.mjs
import assert from 'node:assert/strict';
import { createD1 } from './dev/d1-sqlite.mjs';
import { loadWorker } from './dev/load-worker.mjs';

const worker = await loadWorker();
const origin = 'https://greenledger.test';
const env = { DB: createD1(), GL_SESSION_KEY: 'test-session-key-not-for-production' };

const cookieOf = response => response.headers.get('set-cookie')?.split(';')[0] ?? '';
const call = (path, { method = 'GET', cookie = '', body, form, headers = {} } = {}) => {
  const init = { method, headers: { origin, ...headers } };
  if (cookie) init.headers.cookie = cookie;
  if (form) { init.body = new URLSearchParams(form).toString(); init.headers['content-type'] = 'application/x-www-form-urlencoded'; }
  if (body) { init.body = JSON.stringify(body); init.headers['content-type'] = 'application/json'; }
  return worker.fetch(new Request(origin + path, init), env);
};
const login = async (username, password) => call('/login', { method: 'POST', form: { username, password } });
const data = async response => response.json();

// 1. Chưa đăng nhập: trang ứng dụng chuyển về /login, API trả 401, tài nguyên công khai vẫn tải được.
assert.equal((await call('/')).headers.get('location'), '/login');
assert.equal((await call('/api/me')).status, 401);
assert.equal((await call('/login.css')).status, 200);

// 2. Tài khoản mặc định pxvh1/pxvh1, được nhắc đổi mật khẩu.
let response = await login('pxvh1', 'pxvh1');
assert.equal(response.status, 303);
let admin = cookieOf(response);
let me = await data(await call('/api/me', { cookie: admin }));
assert.equal(me.mode, 'accounts');
assert.equal(me.user.username, 'pxvh1');
assert.equal(me.user.mustChange, true);
assert.deepEqual(me.user.permissions, ['periods', 'data', 'factors', 'import', 'export', 'users']);
assert.equal((await call('/', { cookie: admin })).status, 200);

// 3. Sai mật khẩu báo lỗi và còn số lần thử.
response = await login('pxvh1', 'sai-mat-khau');
assert.equal(response.status, 401);
assert.match(await response.text(), /Còn 4 lần thử/);

// 4. Tạo người dùng "Xem & xuất báo cáo".
response = await call('/api/users', { method: 'POST', cookie: admin, body: {
  username: 'Nguyen.An', displayName: 'Nguyễn An', role: 'viewer', permissions: ['export'], password: 'TamThoi#2026' } });
assert.equal(response.status, 201);
assert.equal((await data(response)).user.username, 'nguyen.an');
assert.equal((await call('/api/users', { method: 'POST', cookie: admin, body: {
  username: 'nguyen.an', displayName: 'Trùng', role: 'viewer', permissions: ['export'], password: 'TamThoi#2026' } })).status, 409);
assert.equal((await call('/api/users', { method: 'POST', cookie: admin, body: {
  username: 'ab', displayName: 'Ngắn', role: 'viewer', permissions: ['export'], password: 'TamThoi#2026' } })).status, 400);
assert.equal((await call('/api/users', { method: 'POST', cookie: admin, body: {
  username: 'tran.binh', displayName: 'Bình', role: 'viewer', permissions: ['export'], password: '123' } })).status, 400);

// 5. Người xem không quản lý được tài khoản; đăng nhập lần đầu được nhắc đổi mật khẩu.
let viewer = cookieOf(await login('nguyen.an', 'TamThoi#2026'));
me = await data(await call('/api/me', { cookie: viewer }));
assert.equal(me.user.role, 'viewer');
assert.equal(me.user.mustChange, true);
assert.equal((await call('/api/users', { cookie: viewer })).status, 403);

// 6. Đổi mật khẩu: phải đúng mật khẩu hiện tại, đủ dài; xong thì phiên mới vẫn dùng được, mật khẩu cũ hết hiệu lực.
assert.equal((await call('/api/me/password', { method: 'POST', cookie: viewer, body: { current: 'sai', next: 'MatKhauMoi#1' } })).status, 400);
assert.equal((await call('/api/me/password', { method: 'POST', cookie: viewer, body: { current: 'TamThoi#2026', next: 'ngan' } })).status, 400);
response = await call('/api/me/password', { method: 'POST', cookie: viewer, body: { current: 'TamThoi#2026', next: 'MatKhauMoi#1' } });
assert.equal(response.status, 200);
assert.equal((await call('/api/me', { cookie: viewer })).status, 401, 'phiên cũ hết hiệu lực sau khi đổi mật khẩu');
viewer = cookieOf(response);
assert.equal((await data(await call('/api/me', { cookie: viewer }))).user.mustChange, false);
assert.equal((await login('nguyen.an', 'TamThoi#2026')).status, 401);

// 7. Quản trị nâng quyền, khóa tài khoản: phiên của người bị khóa hết hiệu lực, không đăng nhập lại được.
response = await call('/api/users/nguyen.an', { method: 'PATCH', cookie: admin, body: { role: 'entry', permissions: ['data', 'export'] } });
assert.deepEqual((await data(response)).user.permissions, ['data', 'export']);
assert.equal((await call('/api/me', { cookie: viewer })).status, 401, 'đổi quyền làm phiên cũ hết hiệu lực');
viewer = cookieOf(await login('nguyen.an', 'MatKhauMoi#1'));
assert.equal((await data(await call('/api/me', { cookie: viewer }))).user.role, 'entry');
await call('/api/users/nguyen.an', { method: 'PATCH', cookie: admin, body: { disabled: true } });
assert.equal((await call('/api/me', { cookie: viewer })).status, 401);
assert.equal((await login('nguyen.an', 'MatKhauMoi#1')).status, 401);

// 8. Đặt lại mật khẩu: người dùng phải đổi khi đăng nhập; mở khóa sau 5 lần sai.
await call('/api/users/nguyen.an', { method: 'PATCH', cookie: admin, body: { disabled: false, password: 'DatLai#2026' } });
for (let i = 0; i < 4; i++) assert.equal((await login('nguyen.an', 'sai')).status, 401);
response = await login('nguyen.an', 'sai');
assert.equal(response.status, 429);
assert.equal((await login('nguyen.an', 'DatLai#2026')).status, 429, 'đang khóa tạm');
assert.equal((await data(await call('/api/users', { cookie: admin }))).users.find(user => user.username === 'nguyen.an').locked, true);
await call('/api/users/nguyen.an', { method: 'PATCH', cookie: admin, body: { unlock: true } });
viewer = cookieOf(await login('nguyen.an', 'DatLai#2026'));
assert.equal((await data(await call('/api/me', { cookie: viewer }))).user.mustChange, true);

// 9. Bảo vệ tài khoản quản trị: không tự xóa, tự khóa, tự bỏ quyền; luôn còn một người quản lý.
assert.equal((await call('/api/users/pxvh1', { method: 'DELETE', cookie: admin })).status, 400);
assert.equal((await call('/api/users/pxvh1', { method: 'PATCH', cookie: admin, body: { disabled: true } })).status, 400);
assert.equal((await call('/api/users/pxvh1', { method: 'PATCH', cookie: admin, body: { role: 'viewer', permissions: ['export'] } })).status, 400);

// 10. Yêu cầu ghi từ trang khác bị chặn; xóa người dùng.
assert.equal((await call('/api/users/nguyen.an', { method: 'DELETE', cookie: admin, headers: { origin: 'https://evil.example' } })).status, 403);
assert.equal((await call('/api/users/nguyen.an', { method: 'DELETE', cookie: admin })).status, 200);
assert.equal((await data(await call('/api/users', { cookie: admin }))).users.length, 1);

// 11. Quản trị đổi mật khẩu mặc định.
response = await call('/api/me/password', { method: 'POST', cookie: admin, body: { current: 'pxvh1', next: 'QuanTri#2026' } });
assert.equal(response.status, 200);
assert.equal((await login('pxvh1', 'pxvh1')).status, 401);
assert.equal((await login('pxvh1', 'QuanTri#2026')).status, 303);

// 12. Chế độ cũ (chưa có D1): đăng nhập bằng GL_OPERATOR_PASSWORD, /api/me trả mode legacy.
const legacyEnv = { GL_OPERATOR_PASSWORD: 'pxvh1', GL_SESSION_KEY: 'legacy-key' };
response = await worker.fetch(new Request(origin + '/login', { method: 'POST', headers: { origin,
  'content-type': 'application/x-www-form-urlencoded' }, body: 'username=pxvh1&password=pxvh1' }), legacyEnv);
assert.equal(response.status, 303);
me = await (await worker.fetch(new Request(origin + '/api/me', { headers: { cookie: cookieOf(response) } }), legacyEnv)).json();
assert.equal(me.mode, 'legacy');

console.log('PASS: login, default admin, roles, password change, session revocation, lockout, admin safeguards, CSRF, legacy mode');
