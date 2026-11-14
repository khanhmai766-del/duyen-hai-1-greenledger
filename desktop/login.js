'use strict';

// Đăng nhập bản Desktop: gửi tài khoản cho host qua WebView2; host kiểm tra users.json và trả lời nhắn khi sai.
const form = document.querySelector('.login-form');
const username = form.elements.username;
const password = form.elements.password;
const submit = form.querySelector('[type=submit]');
const error = document.querySelector('#desktop-login-error');
const bridge = window.chrome.webview;

form.addEventListener('submit', event => {
  event.preventDefault();
  if (submit.disabled || !username.value.trim() || !password.value) return;
  error.hidden = true;
  submit.disabled = true;
  form.classList.add('is-busy');
  bridge.postMessage('login|' + username.value.trim() + '|' + password.value);
  password.value = '';
});

bridge.addEventListener('message', event => {
  if (typeof event.data !== 'string' || !event.data.startsWith('login-invalid')) return;
  error.textContent = event.data.split('|')[1] || 'Tài khoản hoặc mật khẩu chưa đúng.';
  error.hidden = false;
  submit.disabled = false;
  form.classList.remove('is-busy');
  password.focus();
});
