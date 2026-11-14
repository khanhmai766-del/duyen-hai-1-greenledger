'use strict';

// Ba hiệu ứng chuyển từ React Bits sang JavaScript thuần (bản tham khảo: Phu-thuoc/react-bits/,
// giấy phép MIT + Commons Clause, chỉ dùng trong GreenLedger):
//   1. SpotlightCard (Components/SpotlightCard): vệt sáng theo con trỏ và viền ánh sáng trên thẻ.
//   2. RotatingText (TextAnimations/RotatingText): chữ đổi lần lượt, từng ký tự trượt vào.
//   3. StatusMark (Micro/StatusMark): dấu ✓ / ✕ tự vẽ trong thông báo lưu.
// Tệp tự gắn hiệu ứng sau mỗi lần render() thay nội dung #app (MutationObserver), không cần sửa app.js.

const reactBits = {
  reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? { matches: false },
};

/* ---------- 1. SpotlightCard ---------- */

const spotlightThemes = {
  // Thẻ kính tối trong hero.
  dark: { color: '#ffffff', fill: 0.15, edge: 0.6 },
  // Panel nền trắng: dùng xanh chủ đạo, rất nhẹ để không lấn số liệu.
  light: { color: '#1f604c', fill: 0.07, edge: 0.45 },
};
const spotlightTargets = [['.ov-step, .ov-stat', 'dark'], ['.dashboard > .charts > .panel, .dashboard > .panel', 'light']];
const spotlightSize = 240;
const spotlightProximity = 80;
const spotlights = new Set();
const pointer = { x: 0, y: 0, active: false };
let spotlightFrame = 0;
let spotlightLast = 0;

// Dải màu tắt dần mượt (giữ nguyên công thức falloff của React Bits).
function spotlightFalloff(color, softness) {
  const core = (1 - softness) ** 1.5 * 0.85;
  const stop = (alpha, at) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
  const list = [stop(1, 0)];
  for (let i = 0; i <= 14; i++) {
    const t = core + ((1 - core) * i) / 14;
    const g = (t - core) / (1 - core);
    const smooth = 1 - g * g * (3 - 2 * g);
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
    list.push(stop(smooth + (glow - smooth) * softness, t));
  }
  return list.join(', ');
}

function attachSpotlight(root, themeName) {
  const theme = spotlightThemes[themeName];
  const light = document.createElement('span');
  const edge = document.createElement('span');
  light.className = 'rb-spot-light';
  edge.className = 'rb-spot-edge';
  light.setAttribute('aria-hidden', 'true');
  edge.setAttribute('aria-hidden', 'true');
  root.prepend(light);
  root.append(edge);
  root.classList.add('rb-spot');
  root.dataset.rbSpot = themeName;
  spotlights.add({ root, light, edge, theme, fillStops: spotlightFalloff(theme.color, 0.7), edgeStops: spotlightFalloff(theme.color, 1),
    x: 0, y: 0, presence: 0, focus: null });
}

function paintSpotlight(spot) {
  const circle = (size, stops) => `radial-gradient(circle ${size.toFixed(1)}px at ${spot.x.toFixed(1)}px ${spot.y.toFixed(1)}px, ${stops})`;
  spot.light.style.background = circle(spotlightSize, spot.fillStops);
  spot.edge.style.background = circle(spotlightSize * 0.6, spot.edgeStops);
  spot.light.style.opacity = String(spot.presence * spot.theme.fill);
  spot.edge.style.opacity = String(spot.presence * spot.theme.edge);
}

function spotlightTick(now) {
  spotlightFrame = 0;
  const dt = Math.min(0.05, Math.max(0.001, (now - spotlightLast) / 1000));
  spotlightLast = now;
  const reduce = reactBits.reduced.matches;
  let busy = false;
  for (const spot of spotlights) {
    if (!spot.root.isConnected) { spotlights.delete(spot); continue; }
    const rect = spot.root.getBoundingClientRect();
    let tx = spot.x, ty = spot.y, target = 0;
    if (spot.focus && spot.root.contains(spot.focus)) {
      const box = spot.focus.getBoundingClientRect();
      tx = box.left + box.width / 2 - rect.left;
      ty = box.top + box.height / 2 - rect.top;
      target = 1;
    } else if (pointer.active) {
      tx = pointer.x - rect.left;
      ty = pointer.y - rect.top;
      const gap = Math.hypot(Math.max(0, -tx, tx - rect.width), Math.max(0, -ty, ty - rect.height));
      target = gap === 0 ? 1 : Math.max(0, 1 - gap / spotlightProximity) ** 2;
    }
    if (target === 0 && spot.presence === 0) continue;
    if (spot.presence < 0.02 && target > 0) { spot.x = tx; spot.y = ty; }
    const follow = reduce ? 1 : 1 - Math.exp(-dt / (0.015 + 0.3 * 0.22));
    spot.x += (tx - spot.x) * follow;
    spot.y += (ty - spot.y) * follow;
    const fade = reduce ? 1 : 1 - Math.exp(-dt / (target > spot.presence ? 0.1 : 0.32));
    spot.presence += (target - spot.presence) * fade;
    if (Math.abs(target - spot.presence) < 0.002) spot.presence = target;
    paintSpotlight(spot);
    if (Math.abs(tx - spot.x) > 0.1 || Math.abs(ty - spot.y) > 0.1 || spot.presence !== target) busy = true;
  }
  if (busy) wakeSpotlights();
}

function wakeSpotlights() {
  if (spotlightFrame || !spotlights.size) return;
  spotlightLast = performance.now();
  spotlightFrame = requestAnimationFrame(spotlightTick);
}

window.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  Object.assign(pointer, { x: event.clientX, y: event.clientY, active: true });
  wakeSpotlights();
}, { passive: true });
document.addEventListener('pointerout', event => {
  if (event.relatedTarget) return;
  pointer.active = false;
  wakeSpotlights();
});
window.addEventListener('scroll', wakeSpotlights, { capture: true, passive: true });
document.addEventListener('focusin', event => {
  const root = event.target.closest?.('.rb-spot');
  if (!root || !event.target.matches(':focus-visible')) return;
  for (const spot of spotlights) if (spot.root === root) spot.focus = event.target;
  wakeSpotlights();
});
document.addEventListener('focusout', event => {
  for (const spot of spotlights) if (spot.focus === event.target && !spot.root.contains(event.relatedTarget)) spot.focus = null;
  wakeSpotlights();
});

/* ---------- 2. RotatingText ---------- */

const graphemes = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('vi', { granularity: 'grapheme' }) : null;
const splitGraphemes = text => (graphemes ? Array.from(graphemes.segment(text), part => part.segment) : Array.from(text));
const rotateInterval = 2600;
const rotateEase = 'cubic-bezier(.22, 1, .36, 1)';

function renderRotateWord(holder, word) {
  holder.replaceChildren(...splitGraphemes(word).map(char => {
    const span = document.createElement('span');
    span.className = char === ' ' ? 'rb-rotate-char rb-rotate-space' : 'rb-rotate-char';
    span.textContent = char;
    return span;
  }));
}

function attachRotatingText(element) {
  let words;
  try { words = JSON.parse(element.dataset.rotateWords); } catch { return; }
  if (!Array.isArray(words) || words.length < 2) return;
  element.dataset.rbRotate = 'on';
  // Trình đọc màn hình chỉ đọc một từ cố định; phần chạy chữ ẩn với công nghệ hỗ trợ.
  const spoken = document.createElement('span');
  spoken.className = 'rb-sr-only';
  spoken.textContent = words[0];
  const holder = document.createElement('span');
  holder.className = 'rb-rotate-word';
  holder.setAttribute('aria-hidden', 'true');
  element.replaceChildren(spoken, holder);
  renderRotateWord(holder, words[0]);
  if (reactBits.reduced.matches) return;
  let index = 0;
  const step = async () => {
    if (!element.isConnected) return;
    if (document.hidden) { setTimeout(step, rotateInterval); return; }
    const leaving = [...holder.children];
    await Promise.all(leaving.map((char, i) => char.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-110%)', opacity: 0 }],
      { duration: 260, delay: i * 18, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' }).finished.catch(() => {})));
    if (!element.isConnected) return;
    const from = holder.getBoundingClientRect().width;
    index = (index + 1) % words.length;
    renderRotateWord(holder, words[index]);
    const to = holder.getBoundingClientRect().width;
    holder.animate([{ width: from + 'px' }, { width: to + 'px' }], { duration: 320, easing: rotateEase });
    [...holder.children].forEach((char, i) => char.animate(
      [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 520, delay: i * 25, easing: rotateEase, fill: 'backwards' }));
    setTimeout(step, rotateInterval);
  };
  setTimeout(step, rotateInterval);
}

/* ---------- 3. StatusMark trong thông báo ---------- */

function toastStatus(text) {
  if (/^Đã\s/.test(text)) return 'done';
  if (/^(Chưa|Không)\s/.test(text)) return 'failed';
  return '';
}

function decorateToast(toast) {
  if (toast.querySelector('.rb-status')) return;
  const text = toast.textContent;
  const status = toastStatus(text);
  if (!status) return;
  const mark = document.createElement('span');
  mark.className = 'rb-status';
  mark.dataset.status = status;
  mark.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle class="rb-status-ring" cx="12" cy="12" r="10"></circle>
    <path class="rb-status-check" d="M7.5 12.25 10.5 15.25 16.75 8.75" pathLength="1"></path>
    <path class="rb-status-cross" d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" pathLength="1"></path></svg>`;
  const label = document.createElement('span');
  label.textContent = text;
  toast.replaceChildren(mark, label);
  toast.classList.add('rb-toast');
}

/* ---------- Gắn sau mỗi lần render ---------- */

function mountReactBits() {
  for (const [selector, theme] of spotlightTargets) {
    for (const root of document.querySelectorAll(selector)) if (!root.dataset.rbSpot) attachSpotlight(root, theme);
  }
  for (const element of document.querySelectorAll('[data-rotate-words]:not([data-rb-rotate])')) attachRotatingText(element);
}

new MutationObserver(mountReactBits).observe(document.querySelector('#app'), { childList: true });
const toastElement = document.querySelector('#toast');
if (toastElement) new MutationObserver(() => decorateToast(toastElement)).observe(toastElement, { childList: true });
mountReactBits();
