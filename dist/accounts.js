'use strict';

// Tài khoản & phân quyền (dùng chung bản Web và Desktop).
// Bản Web: tài khoản ở Worker (/api/*, D1). Bản Desktop: tài khoản ở host (bridge accountBridge, users.json).
// Giao diện ẩn/khóa thao tác theo quyền; nơi lưu tài khoản kiểm tra lại quyền ở phía máy chủ/host.

const accountPermissions = [
  ['periods', 'Quản lý kỳ kiểm kê', 'Tạo, nhân bản, sửa thông tin cơ sở và xóa kỳ.', 'Kỳ'],
  ['data', 'Nhập số liệu hoạt động', 'Thêm, sửa, xóa nguồn phát thải và thông tin báo cáo.', 'Số liệu'],
  ['factors', 'Thư viện hệ số & phương pháp', 'Thêm, sửa, xóa hệ số; thiết lập phương pháp ĐKĐBĐ.', 'Hệ số'],
  ['import', 'Nhập & khôi phục dữ liệu', 'Nhập bản sao lưu JSON, khôi phục dữ liệu mẫu.', 'Nhập dữ liệu'],
  ['export', 'Xuất báo cáo & dữ liệu', 'In PDF, xuất Excel, CSV và bản sao lưu JSON.', 'Xuất'],
  ['users', 'Quản lý tài khoản', 'Tạo người dùng, phân quyền, khóa và đặt lại mật khẩu.', 'Tài khoản'],
];
const accountPermissionIds = accountPermissions.map(([id]) => id);
const accountRoles = {
  admin: ['Quản trị hệ thống', 'Toàn quyền, gồm quản lý tài khoản.', accountPermissionIds],
  editor: ['Kiểm kê viên', 'Quản lý kỳ, số liệu, hệ số; nhập và xuất dữ liệu.', ['periods', 'data', 'factors', 'import', 'export']],
  entry: ['Nhập liệu', 'Nhập số liệu hoạt động và xuất báo cáo.', ['data', 'export']],
  viewer: ['Xem & xuất báo cáo', 'Chỉ xem số liệu và xuất báo cáo.', ['export']],
  custom: ['Tùy chỉnh', 'Quyền do quản trị chọn riêng cho tài khoản.', null],
};
// Thao tác (data-action trong app.js) cần quyền nào.
const accountActionPermissions = {
  'new-period': 'periods', 'clone-period': 'periods', facility: 'periods', 'delete-period': 'periods',
  'new-row': 'data', 'edit-row': 'data', 'delete-row': 'data', 'facility-profile': 'data',
  'new-factor': 'factors', 'edit-factor': 'factors', 'delete-factor': 'factors', 'use-ipcc-fuel': 'factors',
  'ipcc-use-fuel': 'factors', 'calc-method': 'factors',
  reset: 'import',
  print: 'export', xlsx: 'export', csv: 'export', json: 'export', 'raw-backup': 'export',
};
const accountWritePermissions = ['periods', 'data', 'factors', 'import'];

const accountState = { mode: 'pending', me: null, users: null, usersLoading: false, error: '' };

const accountIsDesktop = () => location.hostname === 'greenledger.local';

/* ---------- Kết nối máy chủ / host ---------- */

const accountApi = {
  async call(desktopMethod, desktopArgs, webPath, webMethod = 'GET', body) {
    if (accountIsDesktop()) {
      const bridge = window.chrome.webview.hostObjects.sync.accountBridge;
      const result = JSON.parse(bridge[desktopMethod](...desktopArgs));
      if (!result.ok) throw Error(result.error || 'Thao tác không thành công.');
      return result;
    }
    const response = await fetch(webPath, {
      method: webMethod,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401) { location.href = '/login'; throw Error('Phiên đăng nhập đã hết hạn.'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || 'Máy chủ chưa xử lý được yêu cầu.');
    return data;
  },
  me: () => accountApi.call('Me', [], '/api/me'),
  changePassword: (current, next) => accountApi.call('ChangePassword', [current, next], '/api/me/password', 'POST', { current, next }),
  listUsers: () => accountApi.call('ListUsers', [], '/api/users'),
  createUser: user => accountApi.call('CreateUser', [JSON.stringify(user)], '/api/users', 'POST', user),
  updateUser: (username, changes) => accountApi.call('UpdateUser', [username, JSON.stringify(changes)],
    '/api/users/' + encodeURIComponent(username), 'PATCH', changes),
  deleteUser: username => accountApi.call('DeleteUser', [username], '/api/users/' + encodeURIComponent(username), 'DELETE'),
};

function accountLogout() {
  if (accountIsDesktop()) { window.chrome.webview.hostObjects.sync.accountBridge.Logout(); return; }
  const form = document.createElement('form');
  form.method = 'post';
  form.action = '/logout';
  document.body.append(form);
  form.submit();
}

async function loadAccount() {
  try {
    const result = await accountApi.me();
    accountState.me = result.user;
    accountState.mode = result.mode || (accountIsDesktop() ? 'desktop' : 'accounts');
  } catch (error) {
    // Mở trực tiếp dist/ (không qua Worker hay host): không có tài khoản, giữ toàn quyền như trước.
    accountState.mode = 'local';
    accountState.me = null;
  }
  if (typeof render === 'function') render();
}

function accountCan(permission) {
  if (accountState.mode === 'pending' || accountState.mode === 'local') return true;
  return Boolean(accountState.me?.permissions.includes(permission));
}

const accountCanWrite = () => accountWritePermissions.some(accountCan);
const accountPermissionName = id => accountPermissions.find(([key]) => key === id)?.[1] || id;
const accountRoleName = role => accountRoles[role]?.[0] || 'Tùy chỉnh';
const accountInitials = name => String(name || '?').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
const accountManages = () => ['accounts', 'desktop'].includes(accountState.mode) && accountCan('users');

function accountRoleFor(permissions) {
  const sorted = accountPermissionIds.filter(id => permissions.includes(id)).join();
  return Object.entries(accountRoles).find(([id, [, , preset]]) => preset && preset.join() === sorted)?.[0] || 'custom';
}

function accountDate(seconds) {
  if (!seconds) return 'Chưa đăng nhập';
  return new Date(seconds * 1000).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function accountPasswordScore(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return value ? Math.min(4, Math.max(1, score)) : 0;
}

function accountTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('') + '#' + (bytes[0] % 90 + 10);
}

/* ---------- Giao diện ---------- */

const accountIcon = path => `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"></path></svg>`;
const accountCheck = accountIcon('M5 12.5 10 17.5 19 7.5');
const accountCross = accountIcon('M7 7l10 10M17 7 7 17');

function accountPasswordField(name, label, autocomplete) {
  return `<label class="account-field">${label}
    <span class="account-secret"><input name="${name}" type="password" autocomplete="${autocomplete}" maxlength="128" required>
    <button type="button" class="account-reveal quiet" data-account-reveal aria-label="Hiện mật khẩu" aria-pressed="false">${accountIcon('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z')}</button></span></label>`;
}

function accountToolbar() {
  const me = accountState.me;
  if (!me) return '';
  return `<details class="account-menu">
    <summary><span class="account-avatar small" aria-hidden="true">${esc(accountInitials(me.displayName))}</span><span class="account-menu-name">${esc(me.displayName)}</span></summary>
    <div class="web-toolbar-menu account-menu-items">
      <p class="account-menu-head"><strong>${esc(me.displayName)}</strong><span>@${esc(me.username)} · ${esc(accountRoleName(me.role))}</span></p>
      ${btn('Tài khoản &amp; mật khẩu', 'tab', '', 'data-tab="8"')}
      <button type="button" data-account-logout>Đăng xuất</button>
    </div>
  </details>`;
}

function accountsPage() {
  const me = accountState.me;
  if (accountState.mode === 'pending') return '<section class="panel accounts-empty"><p>Đang tải thông tin tài khoản…</p></section>';
  if (accountState.mode === 'local' || !me) {
    return `<section class="panel accounts-empty"><h2>Chưa kết nối máy chủ tài khoản</h2>
      <p>Trang đang mở trực tiếp từ thư mục <code>dist/</code> nên không có đăng nhập. Chạy qua Worker (<code>node dev-server.mjs</code> hoặc bản triển khai) hay bản cài máy để dùng tài khoản và phân quyền.</p></section>`;
  }
  const permissions = accountPermissions.map(([id, name, detail]) => {
    const has = me.permissions.includes(id);
    return `<li class="${has ? 'granted' : 'denied'}"><span class="account-perm-mark">${has ? accountCheck : accountCross}</span>
      <span><strong>${name}</strong><small>${detail}</small></span></li>`;
  }).join('');
  const legacy = accountState.mode === 'legacy';
  return `<div class="accounts">
    ${me.mustChange ? `<div class="account-alert" role="alert">${accountIcon('M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z')}
      <span><strong>Bạn đang dùng mật khẩu mặc định hoặc mật khẩu tạm.</strong> Hãy đổi mật khẩu ngay bên dưới để bảo vệ hồ sơ kiểm kê.</span></div>` : ''}
    <section class="panel account-profile" aria-labelledby="account-profile-title">
      <div class="account-identity">
        <span class="account-avatar large" aria-hidden="true">${esc(accountInitials(me.displayName))}</span>
        <div><h2 id="account-profile-title">${esc(me.displayName)}</h2>
          <p class="account-handle">@${esc(me.username)}</p>
          <span class="account-role role-${esc(me.role)}">${esc(accountRoleName(me.role))}</span></div>
      </div>
      <h3 class="account-subtitle">Quyền của bạn</h3>
      <ul class="account-perm-list">${permissions}</ul>
      <button type="button" class="account-logout" data-account-logout>${accountIcon('M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 17l5-5-5-5 M15 12H4')}Đăng xuất</button>
    </section>

    <section class="panel account-password" aria-labelledby="account-password-title">
      <h2 id="account-password-title">Đổi mật khẩu</h2>
      <p class="sub">Mật khẩu từ 8 ký tự, nên có chữ hoa, chữ thường, số và ký tự đặc biệt. Đổi xong, phiên trên thiết bị khác sẽ hết hiệu lực.</p>
      ${legacy ? '<p class="note warning">Bản Web chưa gắn cơ sở dữ liệu D1 nên mật khẩu đang lấy từ cấu hình máy chủ (GL_OPERATOR_PASSWORD) và không đổi được tại đây.</p>' : `
      <form id="account-password-form" class="account-form" novalidate>
        ${accountPasswordField('current', 'Mật khẩu hiện tại', 'current-password')}
        ${accountPasswordField('next', 'Mật khẩu mới', 'new-password')}
        <div class="account-strength" data-score="0" aria-live="polite"><span class="account-strength-bar"><i></i><i></i><i></i><i></i></span><span class="account-strength-text">Nhập mật khẩu mới</span></div>
        ${accountPasswordField('confirm', 'Nhập lại mật khẩu mới', 'new-password')}
        <p class="account-form-error" role="alert"></p>
        <button type="submit" class="primary">Cập nhật mật khẩu</button>
      </form>`}
    </section>

    ${accountManages() ? accountUsersSection() : ''}
    ${accountRolesSection()}
  </div>`;
}

function accountUsersSection() {
  if (!accountState.users && !accountState.usersLoading) loadAccountUsers();
  const rows = (accountState.users || []).map(user => {
    const self = user.username === accountState.me.username;
    const status = user.disabled ? ['locked', 'Đã khóa'] : user.locked ? ['warning', 'Tạm khóa (nhập sai)']
      : user.mustChange ? ['pending', 'Chờ đổi mật khẩu'] : ['active', 'Hoạt động'];
    const chips = accountPermissions.filter(([id]) => user.permissions.includes(id))
      .map(([, name, , short]) => `<span class="account-chip" title="${esc(name)}">${short}</span>`).join('') || '<span class="sub">Không có quyền</span>';
    return `<tr class="${user.disabled ? 'is-disabled' : ''}">
      <td><div class="account-user"><span class="account-avatar" aria-hidden="true">${esc(accountInitials(user.displayName))}</span>
        <span><strong>${esc(user.displayName)}${self ? ' <em>(bạn)</em>' : ''}</strong><small>@${esc(user.username)}</small></span></div></td>
      <td><span class="account-role role-${esc(user.role)}">${esc(accountRoleName(user.role))}</span></td>
      <td><div class="account-chips">${chips}</div></td>
      <td><span class="account-status status-${status[0]}">${status[1]}</span></td>
      <td class="account-last">${esc(accountDate(user.lastLogin))}</td>
      <td><div class="account-actions">
        <button type="button" class="small" data-account-edit="${esc(user.username)}">Sửa quyền</button>
        <button type="button" class="small" data-account-reset="${esc(user.username)}">Đặt lại mật khẩu</button>
        ${user.locked && !user.disabled ? `<button type="button" class="small" data-account-unlock="${esc(user.username)}">Mở khóa</button>` : ''}
        ${self ? '' : `<button type="button" class="small" data-account-toggle="${esc(user.username)}">${user.disabled ? 'Mở lại' : 'Khóa'}</button>
        <button type="button" class="small danger" data-account-delete="${esc(user.username)}">Xóa</button>`}
      </div></td>
    </tr>`;
  }).join('');
  return `<section class="panel account-users" aria-labelledby="account-users-title">
    <div class="panel-head"><div><h2 id="account-users-title">Người dùng &amp; phân quyền</h2>
      <p class="sub">${accountState.users ? accountState.users.length + ' tài khoản' : 'Đang tải danh sách…'} · Quản trị đặt vai trò và từng quyền cho mỗi người.</p></div>
      <button type="button" class="primary" data-account-new>+ Thêm người dùng</button></div>
    ${accountState.error ? `<p class="note warning" role="alert">${esc(accountState.error)}</p>` : ''}
    <div class="table-wrap account-table"><table>
      <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Quyền</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th>Thao tác</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="sub">Đang tải…</td></tr>'}</tbody>
    </table></div>
  </section>`;
}

function accountRolesSection() {
  const roles = Object.entries(accountRoles).filter(([id]) => id !== 'custom');
  return `<section class="panel account-roles" aria-labelledby="account-roles-title">
    <h2 id="account-roles-title">Vai trò mẫu</h2>
    <p class="sub">Chọn vai trò để điền nhanh quyền; quản trị vẫn có thể bật hoặc tắt từng quyền cho mỗi người (vai trò "Tùy chỉnh").</p>
    <div class="table-wrap"><table class="account-matrix">
      <thead><tr><th>Quyền</th>${roles.map(([id, [name]]) => `<th><span class="account-role role-${id}">${name}</span></th>`).join('')}</tr></thead>
      <tbody>${accountPermissions.map(([id, name, detail]) => `<tr><th scope="row"><strong>${name}</strong><small>${detail}</small></th>
        ${roles.map(([, [, , preset]]) => `<td>${preset.includes(id) ? `<span class="account-yes" aria-label="Có">${accountCheck}</span>` : '<span class="account-no" aria-label="Không">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}

async function loadAccountUsers() {
  accountState.usersLoading = true;
  try {
    accountState.users = (await accountApi.listUsers()).users;
    accountState.error = '';
  } catch (error) {
    accountState.error = error.message;
    accountState.users = [];
  }
  accountState.usersLoading = false;
  if (tab === 8) render();
}

/* ---------- Hộp thoại người dùng ---------- */

function accountUserDialog(user) {
  const editing = Boolean(user);
  const permissions = user ? user.permissions : accountRoles.entry[2];
  const role = user ? user.role : 'entry';
  const self = editing && user.username === accountState.me.username;
  const body = `<div class="form-grid account-dialog">
    <label class="field">Tên tài khoản<input name="username" value="${esc(user?.username || '')}" ${editing ? 'readonly' : 'required'} maxlength="32" autocapitalize="none" spellcheck="false" placeholder="vd: nguyen.an"></label>
    <label class="field">Tên hiển thị<input name="displayName" value="${esc(user?.displayName || '')}" required maxlength="80" placeholder="vd: Nguyễn Văn An"></label>
    <label class="field span2">Vai trò<select name="role">${Object.entries(accountRoles).map(([id, [name, detail]]) =>
      `<option value="${id}" ${id === role ? 'selected' : ''}>${name} — ${detail}</option>`).join('')}</select></label>
    <fieldset class="span2 account-perm-picker"><legend>Quyền thực thi</legend>
      ${accountPermissions.map(([id, name, detail]) => `<label class="account-perm-option">
        <input type="checkbox" name="perm" value="${id}" ${permissions.includes(id) ? 'checked' : ''} ${self && id === 'users' ? 'disabled' : ''}>
        <span><strong>${name}</strong><small>${detail}${self && id === 'users' ? ' Không thể tự bỏ quyền này.' : ''}</small></span></label>`).join('')}
    </fieldset>
    ${editing ? '' : `<div class="span2 account-temp">
      <label class="field">Mật khẩu tạm<span class="account-secret"><input name="password" type="text" required minlength="8" maxlength="128" value="${accountTempPassword()}" autocomplete="new-password"></span></label>
      <button type="button" class="small" data-account-generate>Tạo mật khẩu khác</button>
      <p class="sub">Gửi mật khẩu tạm cho người dùng qua kênh riêng. Họ sẽ được nhắc đổi ngay khi đăng nhập.</p></div>`}
  </div>`;
  modal(editing ? 'Sửa quyền · ' + esc(user.displayName) : 'Thêm người dùng', body, data => {
    const chosen = [...document.querySelectorAll('#modal input[name=perm]')].filter(box => box.checked || box.disabled && self).map(box => box.value);
    const payload = { displayName: String(data.get('displayName') || '').trim(), role: data.get('role'), permissions: chosen };
    if (!editing) Object.assign(payload, { username: String(data.get('username') || '').trim().toLowerCase(), password: data.get('password') });
    accountSubmit(editing ? accountApi.updateUser(user.username, payload) : accountApi.createUser(payload),
      editing ? 'Đã cập nhật quyền của ' + payload.displayName : 'Đã tạo tài khoản ' + payload.username);
    return false;
  }, true);
  const dialog = document.querySelector('#modal');
  const roleSelect = dialog.querySelector('[name=role]');
  const boxes = [...dialog.querySelectorAll('input[name=perm]')];
  roleSelect.addEventListener('change', () => {
    const preset = accountRoles[roleSelect.value][2];
    if (preset) boxes.forEach(box => { if (!box.disabled) box.checked = preset.includes(box.value); });
  });
  boxes.forEach(box => box.addEventListener('change', () => {
    roleSelect.value = accountRoleFor(boxes.filter(item => item.checked).map(item => item.value));
  }));
  dialog.querySelector('[data-account-generate]')?.addEventListener('click', () => {
    dialog.querySelector('[name=password]').value = accountTempPassword();
  });
}

function accountResetDialog(user) {
  modal('Đặt lại mật khẩu · ' + esc(user.displayName), `<div class="form-grid account-dialog">
    <label class="field span2">Mật khẩu tạm mới<span class="account-secret"><input name="password" type="text" required minlength="8" maxlength="128" value="${accountTempPassword()}" autocomplete="new-password"></span></label>
    <p class="sub span2">Các phiên đang đăng nhập của @${esc(user.username)} sẽ hết hiệu lực. Người dùng được nhắc đổi mật khẩu ở lần đăng nhập tới.</p>
  </div>`, data => {
    accountSubmit(accountApi.updateUser(user.username, { password: data.get('password') }), 'Đã đặt lại mật khẩu cho @' + user.username);
    return false;
  });
  document.querySelector('#modal button[type=submit]').textContent = 'Đặt lại mật khẩu';
}

async function accountSubmit(promise, message) {
  const dialog = document.querySelector('#modal');
  const submit = dialog.querySelector('button[type=submit]');
  const error = dialog.querySelector('#form-error');
  submit.disabled = true;
  error.textContent = '';
  try {
    await promise;
    dialog.close();
    toast(message);
    accountState.users = null;
    render();
  } catch (failure) {
    error.textContent = failure.message;
  } finally {
    submit.disabled = false;
  }
}

async function accountQuick(promise, message) {
  try {
    await promise;
    toast(message);
  } catch (failure) {
    toast('Chưa thực hiện được: ' + failure.message);
  }
  accountState.users = null;
  render();
}

/* ---------- Sự kiện ---------- */

document.addEventListener('click', event => {
  const target = event.target;
  // Chặn thao tác không đủ quyền trước khi app.js xử lý.
  const action = target.closest?.('[data-action]');
  const needed = action && accountActionPermissions[action.dataset.action];
  if (needed && !accountCan(needed)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Tài khoản của bạn không có quyền "' + accountPermissionName(needed) + '".');
    return;
  }
  if (target.closest?.('[data-account-logout]')) { accountLogout(); return; }
  const reveal = target.closest?.('[data-account-reveal]');
  if (reveal) {
    const input = reveal.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    reveal.setAttribute('aria-pressed', String(show));
    reveal.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    return;
  }
  if (target.closest?.('[data-account-go]')) { tab = 8; render(); return; }
  if (target.closest?.('[data-account-new]')) { accountUserDialog(null); return; }
  const find = attribute => {
    const element = target.closest?.(`[${attribute}]`);
    return element && accountState.users?.find(user => user.username === element.getAttribute(attribute));
  };
  let user;
  if ((user = find('data-account-edit'))) accountUserDialog(user);
  else if ((user = find('data-account-reset'))) accountResetDialog(user);
  else if ((user = find('data-account-unlock'))) accountQuick(accountApi.updateUser(user.username, { unlock: true }), 'Đã mở khóa @' + user.username);
  else if ((user = find('data-account-toggle'))) {
    accountQuick(accountApi.updateUser(user.username, { disabled: !user.disabled }),
      (user.disabled ? 'Đã mở lại tài khoản @' : 'Đã khóa tài khoản @') + user.username);
  } else if ((user = find('data-account-delete'))) {
    const removed = user;
    confirmAction('Xóa tài khoản?', `Xóa vĩnh viễn tài khoản ${removed.displayName} (@${removed.username})? Hồ sơ kiểm kê không bị ảnh hưởng.`,
      () => { accountQuick(accountApi.deleteUser(removed.username), 'Đã xóa tài khoản @' + removed.username); return true; });
  }
}, true);

document.addEventListener('change', event => {
  if (event.target.id === 'import' && !accountCan('import')) {
    event.stopImmediatePropagation();
    event.target.value = '';
    toast('Tài khoản của bạn không có quyền "' + accountPermissionName('import') + '".');
  }
}, true);

document.addEventListener('input', event => {
  const form = event.target.closest?.('#account-password-form');
  if (!form || event.target.name !== 'next') return;
  const score = accountPasswordScore(event.target.value);
  const meter = form.querySelector('.account-strength');
  meter.dataset.score = String(score);
  meter.querySelector('.account-strength-text').textContent =
    ['Nhập mật khẩu mới', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][score] + (event.target.value && event.target.value.length < 8 ? ' · cần ít nhất 8 ký tự' : '');
});

document.addEventListener('submit', async event => {
  const form = event.target.closest?.('#account-password-form');
  if (!form) return;
  event.preventDefault();
  const error = form.querySelector('.account-form-error');
  const data = new FormData(form);
  const current = data.get('current'), next = data.get('next'), confirm = data.get('confirm');
  error.textContent = !current ? 'Nhập mật khẩu hiện tại.' : next.length < 8 ? 'Mật khẩu mới cần ít nhất 8 ký tự.'
    : next !== confirm ? 'Mật khẩu nhập lại chưa khớp.' : next === current ? 'Mật khẩu mới cần khác mật khẩu hiện tại.' : '';
  if (error.textContent) return;
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  try {
    const result = await accountApi.changePassword(current, next);
    accountState.me = result.user;
    toast('Đã đổi mật khẩu');
    render();
  } catch (failure) {
    error.textContent = failure.message;
    submit.disabled = false;
  }
});

/* ---------- Gắn vào trang sau mỗi render ---------- */

function decorateAccount() {
  const me = accountState.me;
  // Khóa nút không đủ quyền và giải thích lý do.
  for (const element of document.querySelectorAll('#app [data-action]')) {
    const needed = accountActionPermissions[element.dataset.action];
    if (!needed) continue;
    const allowed = accountCan(needed);
    if (!allowed && !element.dataset.accountLocked) {
      element.dataset.accountLocked = '1';
      element.disabled = true;
      element.title = 'Cần quyền "' + accountPermissionName(needed) + '"';
    }
  }
  const importInput = document.querySelector('#import');
  if (importInput && !accountCan('import')) { importInput.disabled = true; importInput.title = 'Cần quyền "' + accountPermissionName('import') + '"'; }
  // Ô ký hiệu tài khoản ở thanh trên (bản Desktop) hiện chữ viết tắt tên người dùng.
  // Chỉ ghi khi khác: ghi lại cùng chữ vẫn làm DOM đổi và gây vòng lặp với MutationObserver bên dưới.
  if (me) for (const avatar of document.querySelectorAll('.topbar .avatar')) {
    const initials = accountInitials(me.displayName);
    if (avatar.textContent !== initials) avatar.textContent = initials;
    avatar.title = me.displayName + ' · ' + accountRoleName(me.role);
  }
  // Nhắc đổi mật khẩu mặc định / mật khẩu tạm ở mọi trang (trừ trang tài khoản đã có cảnh báo riêng).
  // Ở Tổng quan, thanh trên nằm đè lên hero nên đặt lời nhắc trong khối chữ của hero.
  const host = document.querySelector('#app .ov-hero-copy') || document.querySelector('#app main');
  const banner = document.querySelector('#app .account-banner');
  if (me?.mustChange && host && !banner && tab !== 8) {
    host.insertAdjacentHTML('afterbegin', `<div class="account-banner${host.classList.contains('ov-hero-copy') ? ' on-dark' : ''}" role="status">${accountIcon('M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z')}
      <span>Bạn đang dùng mật khẩu mặc định hoặc mật khẩu tạm.</span><button type="button" class="small" data-account-go>Đổi mật khẩu</button></div>`);
  } else if (banner && (!me?.mustChange || tab === 8)) banner.remove();
}

let accountDecorateQueued = false;
function queueAccountDecorate() {
  if (accountDecorateQueued) return;
  accountDecorateQueued = true;
  queueMicrotask(() => { accountDecorateQueued = false; decorateAccount(); });
}

document.addEventListener('DOMContentLoaded', () => {
  // Lớp chặn cuối: mọi lần lưu đi qua commit() của app.js; tài khoản chỉ xem không ghi được dữ liệu.
  if (typeof commit === 'function') {
    const originalCommit = commit;
    window.commit = function (...args) {
      if (!accountCanWrite()) { toast('Tài khoản của bạn chỉ có quyền xem và xuất báo cáo, không lưu được thay đổi.'); return false; }
      return originalCommit.apply(this, args);
    };
  }
  const app = document.querySelector('#app');
  if (app) new MutationObserver(queueAccountDecorate).observe(app, { childList: true, subtree: true });
  loadAccount();
});
