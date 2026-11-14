'use strict';

const form = document.querySelector('.login-form');
const username = form.elements.username;
const password = form.elements.password;
const submit = form.querySelector('[type=submit]');
const error = document.querySelector('#desktop-login-error');
const bridge = window.chrome.webview;

form.addEventListener('submit', event => {
  event.preventDefault();
  if (submit.disabled) return;
  error.hidden = true;
  submit.disabled = true;
  bridge.postMessage('login|' + username.value + '|' + password.value);
  password.value = '';
});

bridge.addEventListener('message', event => {
  if (event.data !== 'login-invalid') return;
  error.hidden = false;
  submit.disabled = false;
  password.focus();
});
