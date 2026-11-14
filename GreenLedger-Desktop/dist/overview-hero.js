'use strict';

// Hero của trang Tổng quan: số liệu kỳ đang mở và mô hình 3D Nhà máy Nhiệt điện Duyên Hải 1 (Sketchfab).
const overviewModel = {
  id: 'bdc122add7754c989a976fdd5b01012d',
  page: 'https://sketchfab.com/3d-models/nha-may-nhiet-ien-duyen-hai-vinh-long-bdc122add7754c989a976fdd5b01012d',
  preferenceKey: 'greenledger.overviewModel',
  frame: null,
  ready: false,
  introPlayed: false,
};

const overviewSteps = [
  [1, 'Nhập số liệu', 'Tổng năm hoặc 12 tháng', 'M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12h8 M8 16h5'],
  [4, 'Chọn hệ số', 'IPCC 2006 · GWP · lưới điện', 'M3 5h4v15H3z M7 5h4v15H7z M14 5l4-1 4 15-4 1z'],
  [2, 'Tính & ĐKĐBĐ', 'Từng khí, từng nguồn', 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8 7h8 M8 12h2 M14 12h2 M8 16h2 M14 16h2'],
  [3, 'Lập báo cáo', 'PDF · XLSX · CSV', 'M6 3h8l4 4v14H6z M14 3v5h4 M9 17v-3 M12 17v-5 M15 17v-4'],
];

function overviewMotionReduced() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Mặc định luôn luân phiên video ↔ mô hình 3D mỗi lần mở trang. Nút "Chỉ xem video" chỉ có tác dụng
// trong lần mở hiện tại, không lưu lại. Xóa lựa chọn cũ từng được lưu ở bản trước.
overviewModel.enabled = true;
try { localStorage.removeItem(overviewModel.preferenceKey); } catch { /* không có localStorage */ }

function overviewModelEnabled() {
  return overviewModel.enabled;
}

// Tự xoay 360° qua Sketchfab Viewer API (giao thức postMessage, không nạp script ngoài vào trang).
// Không dùng tham số autospin: nó xoay sai trục với mô hình này nên mô hình trôi khỏi khung.
// Ở đây camera quay quanh trục thẳng đứng (Z) đi qua điểm nhìn, nên mô hình luôn nằm giữa khung.
const overviewOrbit = {
  origin: 'https://sketchfab.com',
  version: '1.12.1',
  apiId: 'greenledger-overview',
  secondsPerTurn: 30,
  nextRequest: 1,
  pending: new Map(),
  active: false,
  paused: false,
  visible: true,
  frameId: 0,
};

// Luân phiên trong hero: video 20 giây → mô hình 3D xoay đúng một vòng 360° → quay lại video, lặp liên tục.
// Khi bật giảm chuyển động: chỉ hiện mô hình đứng yên, không luân phiên.
const overviewCycle = {
  phase: overviewMotionReduced() ? 'model' : 'video',
  turned: 0,
  videoTime: 0,
};

function showOverviewPhase() {
  const hero = document.querySelector('.ov-hero');
  hero?.classList.toggle('ov-show-model', overviewModelEnabled() && overviewCycle.phase === 'model' && overviewModel.ready);
}

function setOverviewPhase(phase) {
  overviewCycle.phase = phase;
  overviewCycle.turned = 0;
  if (phase === 'video') {
    overviewCycle.videoTime = 0;
    const video = document.querySelector('.ov-hero-video');
    if (video) video.currentTime = 0;
  }
  showOverviewPhase();
  syncOverviewVideo();
}

// Hết video: chuyển sang mô hình nếu đã tải xong, nếu chưa thì chiếu lại video và chờ lượt sau.
function overviewVideoEnded() {
  if (!overviewModelEnabled()) return;
  if (overviewModel.ready && overviewModel.frame) setOverviewPhase('model');
  else setOverviewPhase('video');
}

function resetOverviewOrbit() {
  cancelAnimationFrame(overviewOrbit.frameId);
  clearTimeout(overviewOrbit.hoverTimer);
  overviewOrbit.observer?.disconnect();
  Object.assign(overviewOrbit, { active: false, paused: false, visible: true, frameId: 0, base: null, observer: null });
  overviewOrbit.pending.clear();
}

function sketchfabPost(message) {
  overviewModel.frame?.contentWindow?.postMessage({ ...message, instanceId: overviewOrbit.apiId }, overviewOrbit.origin);
}

function sketchfabRequest(type, fields) {
  return new Promise(resolve => {
    const requestId = overviewOrbit.nextRequest++;
    overviewOrbit.pending.set(requestId, resolve);
    sketchfabPost({ type, requestId, ...fields });
  });
}

const sketchfabCall = (member, ...args) => sketchfabRequest('api.request', { member, arguments: args });

async function captureOverviewOrbitBase() {
  const [error, camera] = await sketchfabCall('getCameraLookAt');
  if (error || !camera?.position || !camera?.target) return false;
  overviewOrbit.base = camera;
  overviewOrbit.angle = 0;
  return true;
}

// Chỉ xoay khi khối mô hình đang trong màn hình. Gọi lại sau mỗi render() vì khối cũ bị thay.
function observeOverviewMedia() {
  overviewOrbit.observer?.disconnect();
  overviewOrbit.visible = true;
  const media = document.querySelector('.ov-hero-media');
  if (!media || !('IntersectionObserver' in window)) return;
  overviewOrbit.observer = new IntersectionObserver(([entry]) => { overviewOrbit.visible = entry.isIntersecting; });
  overviewOrbit.observer.observe(media);
}

async function startOverviewOrbit() {
  if (overviewOrbit.active || overviewOrbit.starting || overviewMotionReduced() || !overviewModel.frame) return;
  overviewOrbit.starting = true;
  const captured = await captureOverviewOrbitBase();
  overviewOrbit.starting = false;
  if (!captured || overviewOrbit.active) return;
  overviewOrbit.active = true;
  observeOverviewMedia();
  let last = performance.now();
  let sent = 0;
  const tick = now => {
    if (!overviewOrbit.active) return;
    // Tính theo thời gian thực để tốc độ đúng cả khi trình duyệt giảm số khung hình; tối đa 1 s mỗi bước sau khi tab bị ẩn.
    const elapsed = Math.min(now - last, 1000);
    last = now;
    const moving = overviewCycle.phase === 'model' && !overviewOrbit.paused && overviewOrbit.visible && overviewOrbit.base;
    if (moving) {
      const step = elapsed / 1000 * (2 * Math.PI / overviewOrbit.secondsPerTurn);
      overviewOrbit.angle += step;
      overviewCycle.turned += step;
      // Xoay đủ một vòng thì chuyển về video.
      if (overviewCycle.turned >= 2 * Math.PI) setOverviewPhase('video');
    }
    if (moving && now - sent >= 33) {
      const { position: [px, py, pz], target } = overviewOrbit.base;
      const [tx, ty] = target;
      const dx = px - tx, dy = py - ty, c = Math.cos(overviewOrbit.angle), s = Math.sin(overviewOrbit.angle);
      sketchfabCall('setCameraLookAt', [tx + dx * c - dy * s, ty + dx * s + dy * c, pz], target, 0);
      sent = now;
    }
    overviewOrbit.frameId = requestAnimationFrame(tick);
  };
  overviewOrbit.frameId = requestAnimationFrame(tick);
}

function overviewViewerReady() {
  overviewModel.ready = true;
  document.querySelector('.ov-hero')?.classList.add('ov-model-ready');
  showOverviewPhase();
  startOverviewOrbit();
}

window.addEventListener('message', event => {
  const data = event.data;
  if (!overviewModel.frame || event.source !== overviewModel.frame.contentWindow || event.origin !== overviewOrbit.origin
      || !data || data.instanceId !== overviewOrbit.apiId) return;
  if (data.type === 'api.ready') {
    if (data.error !== undefined) return;
    sketchfabRequest('api.initialize', { name: overviewOrbit.version }).then(() => {
      // Nếu viewerready đã phát trước khi khởi tạo xong, vẫn bắt đầu sau một nhịp chờ.
      setTimeout(() => { if (!overviewOrbit.active) overviewViewerReady(); }, 6000);
    });
  } else if (data.type === 'api.initialize.result' || data.type === 'api.request.result') {
    const resolve = overviewOrbit.pending.get(data.requestId);
    overviewOrbit.pending.delete(data.requestId);
    resolve?.(Array.isArray(data.results) ? data.results : []);
  } else if (data.type === 'api.event' && Array.isArray(data.results) && data.results[0] === 'viewerready') {
    overviewViewerReady();
  }
});

function overviewModelUrl() {
  const params = new URLSearchParams({
    api_version: overviewOrbit.version, api_id: overviewOrbit.apiId,
    // camera=0: bỏ hiệu ứng bay vào để vòng xoay bắt đầu từ góc nhìn chuẩn (chụp lúc bay vào thì camera còn ở rất xa).
    autostart: '1', preload: '1', transparent: '1', camera: '0',
    ui_theme: 'dark', ui_hint: '0', ui_infos: '0', ui_controls: '0', ui_stop: '0', ui_inspector: '0',
    ui_settings: '0', ui_vr: '0', ui_ar: '0', ui_help: '0', ui_annotations: '0', ui_watermark_link: '0',
  });
  return `https://sketchfab.com/models/${overviewModel.id}/embed?${params}`;
}

function overviewIcon(path) {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"></path></svg>`;
}

// Video mô phỏng 20 giây (cắt từ port_view.MP4, 1280×720, không tiếng). Ở chế độ luân phiên video chạy một lượt
// rồi nhường cho mô hình 3D; ở chế độ "chỉ video" thì lặp liên tục. Phát/dừng do syncOverviewVideo() điều khiển.
function overviewVideo(modelOn) {
  return `<video class="ov-hero-poster ov-hero-video" src="port-view.mp4" muted playsinline preload="auto"${modelOn ? '' : ' loop'}
    aria-label="Video mô phỏng Nhà máy Nhiệt điện Duyên Hải 1"></video>`;
}

// Phát video khi nó đang trong màn hình và đang tới lượt video; dừng khi khuất hoặc tới lượt mô hình.
function syncOverviewVideo() {
  overviewModel.videoObserver?.disconnect();
  const video = document.querySelector('.ov-hero-video');
  if (!video) return;
  if (!video.dataset.bound) {
    video.dataset.bound = '1';
    // render() tạo thẻ video mới: chạy tiếp từ giây đang xem thay vì từ đầu.
    if (overviewCycle.videoTime > 0) video.currentTime = overviewCycle.videoTime;
    video.addEventListener('timeupdate', () => { overviewCycle.videoTime = video.currentTime; });
    video.addEventListener('ended', overviewVideoEnded);
  }
  const update = visible => {
    const wanted = !overviewMotionReduced() && (!overviewModelEnabled() || overviewCycle.phase === 'video');
    if (visible && wanted) video.play().catch(() => {});
    else video.pause();
  };
  if (!('IntersectionObserver' in window)) { update(true); return; }
  overviewModel.videoObserver = new IntersectionObserver(([entry]) => update(entry.isIntersecting));
  overviewModel.videoObserver.observe(video);
}

function overviewHero(period) {
  const summary = E.summary(period, db);
  const intro = !overviewModel.introPlayed && !overviewMotionReduced();
  overviewModel.introPlayed = true;
  const modelOn = overviewModelEnabled();
  const scopes = [summary.scope1 > 0 && 'P1', summary.scope2 > 0 && 'P2', summary.bio > 0 && 'SH'].filter(Boolean);
  const steps = overviewSteps.map(([target, title, detail, path], index) => `<li>
      <button type="button" class="ov-step" data-action="tab" data-tab="${target}">
        <span class="ov-step-icon">${overviewIcon(path)}</span>
        <span class="ov-step-title">${title}</span>
        <span class="ov-step-detail">${detail}</span>
      </button>
      <span class="ov-step-index" aria-hidden="true">0${index + 1}</span>
    </li>`).join('');

  const showModel = modelOn && overviewCycle.phase === 'model' && overviewModel.ready;
  return `<section class="ov-hero${intro ? ' ov-intro' : ''}${modelOn ? '' : ' ov-model-off'}${overviewModel.ready ? ' ov-model-ready' : ''}${showModel ? ' ov-show-model' : ''}" aria-labelledby="ov-hero-title">
    <div class="ov-hero-media">
      ${overviewVideo(modelOn)}
      <div class="ov-model-slot" data-overview-model></div>
    </div>
    <div class="ov-hero-shade" aria-hidden="true"></div>

    <div class="ov-hero-copy">
      <p class="ov-proof">
        <span class="ov-proof-marks" aria-hidden="true">${(scopes.length ? scopes : ['GL']).map(mark => `<span>${mark}</span>`).join('')}</span>
        <span>${period.rows.length} nguồn phát thải · kỳ ${esc(period.year)} · ${esc(period.gwp.toUpperCase())} GWP-100</span>
      </p>
      <h1 id="ov-hero-title">Kiểm kê <em>khí nhà kính</em><br>rõ đến từng <span class="rb-rotate" data-rotate-words='["nguồn","hệ số","bước tính"]'>nguồn</span></h1>
      <p class="ov-lede">${esc(period.facility)}. Từ hóa đơn, đồng hồ đo và sổ vận hành đến tổng phát thải, độ không đảm bảo đo và báo cáo theo IPCC 2006.</p>
      <div class="ov-cta">
        <button type="button" class="ov-cta-main" data-action="go-report">
          <span class="ov-cta-dot">${overviewIcon('M13 2 4 14h7l-1 8 9-12h-7z')}</span>Xuất báo cáo
        </button>
        <button type="button" class="ov-cta-ghost" data-action="tab" data-tab="2">Xem chi tiết tính toán</button>
      </div>
    </div>

    <aside class="ov-stat" aria-label="Kết quả kỳ ${esc(period.year)}">
      <p class="ov-stat-label">Tổng phát thải · Phạm vi 1 + 2</p>
      <p class="ov-stat-value"><strong data-count-to="${summary.total}">${n(summary.total)}</strong><span>tCO₂e</span></p>
      <dl class="ov-stat-list">
        <div><dt>Phạm vi 1</dt><dd>${n(summary.scope1)}</dd></div>
        <div><dt>Phạm vi 2</dt><dd>${n(summary.scope2)}</dd></div>
        <div><dt>ĐKĐBĐ · k = ${n(summary.k, 2)}</dt><dd>± ${n(summary.percent)}%</dd></div>
        <div><dt>CO₂ sinh học</dt><dd>${n(summary.bio, 4)} t</dd></div>
      </dl>
    </aside>

    <ol class="ov-steps" aria-label="Quy trình kiểm kê">${steps}</ol>

    <div class="ov-hero-foot">
      <button type="button" class="ov-model-toggle" data-overview-model-toggle aria-pressed="${modelOn}">${modelOn ? 'Chỉ xem video' : 'Luân phiên video và mô hình 3D'}</button>
      <p class="ov-credit">Mô hình 3D: <a href="${overviewModel.page}" target="_blank" rel="noopener noreferrer">Nhà máy Nhiệt điện Duyên Hải · 3DPLUS.vn</a> trên Sketchfab</p>
    </div>
  </section>`;
}

// Giữ iframe Sketchfab khi render() thay nội dung #app, để mô hình không tải lại mỗi lần lưu.
function overviewParking() {
  let parking = document.querySelector('#overview-model-parking');
  if (!parking) {
    parking = document.createElement('div');
    parking.id = 'overview-model-parking';
    parking.setAttribute('aria-hidden', 'true');
    document.body.append(parking);
  }
  return parking;
}

function moveOverviewFrame(target) {
  if (!overviewModel.frame || overviewModel.frame.parentNode === target) return;
  if (typeof target.moveBefore === 'function' && overviewModel.frame.isConnected) target.moveBefore(overviewModel.frame, null);
  else target.append(overviewModel.frame);
}

function parkOverviewModel() {
  if (overviewModel.frame) moveOverviewFrame(overviewParking());
}

function dropOverviewModel() {
  resetOverviewOrbit();
  overviewModel.frame?.remove();
  overviewModel.frame = null;
  overviewModel.ready = false;
  overviewCycle.phase = overviewMotionReduced() ? 'model' : 'video';
  overviewCycle.turned = 0;
}

function mountOverviewModel() {
  const slot = document.querySelector('[data-overview-model]');
  if (!slot) {
    overviewModel.introPlayed = false;
    overviewModel.videoObserver?.disconnect();
    dropOverviewModel();
    overviewCycle.videoTime = 0;
    return;
  }
  trackOverviewTopbar();
  syncOverviewVideo();
  playOverviewIntro();
  if (!overviewModelEnabled()) { dropOverviewModel(); return; }
  if (!overviewModel.frame) {
    const frame = document.createElement('iframe');
    frame.className = 'ov-model-frame';
    frame.title = 'Mô hình 3D Nhà máy Nhiệt điện Duyên Hải 1';
    frame.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    frame.setAttribute('allowfullscreen', '');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    // Không cho khung ngoài điều hướng trang GreenLedger; liên kết Sketchfab mở cửa sổ riêng.
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.addEventListener('load', () => {
      // Dự phòng khi không nhận được viewerready: hiện khung sau một nhịp chờ.
      setTimeout(() => {
        overviewModel.ready = true;
        document.querySelector('.ov-hero')?.classList.add('ov-model-ready');
        showOverviewPhase();
      }, 4000);
    });
    // Rê chuột vào mô hình thì dừng xoay để người dùng tự kéo xem; rời chuột thì xoay tiếp từ góc nhìn mới.
    // Dừng tối đa 10 giây để chuột nằm yên trên mô hình không làm vòng luân phiên đứng mãi.
    const resume = async () => {
      clearTimeout(overviewOrbit.hoverTimer);
      if (overviewOrbit.active) await captureOverviewOrbitBase();
      overviewOrbit.paused = false;
    };
    frame.addEventListener('pointerenter', () => {
      overviewOrbit.paused = true;
      clearTimeout(overviewOrbit.hoverTimer);
      overviewOrbit.hoverTimer = setTimeout(resume, 10000);
    });
    frame.addEventListener('pointerleave', resume);
    resetOverviewOrbit();
    frame.src = overviewModelUrl();
    overviewModel.frame = frame;
  }
  moveOverviewFrame(slot);
  if (overviewOrbit.active) observeOverviewMedia();
}

// Thanh trên nằm đè lên hero; đẩy nội dung hero xuống đúng bằng chiều cao thanh (thanh xuống dòng ở màn hình hẹp).
function trackOverviewTopbar() {
  overviewModel.topbarObserver?.disconnect();
  const bar = document.querySelector('.main > .topbar');
  const hero = document.querySelector('.ov-hero');
  if (!bar || !hero) return;
  const update = () => hero.style.setProperty('--ov-topbar', bar.offsetHeight + 'px');
  update();
  if ('ResizeObserver' in window) {
    overviewModel.topbarObserver = new ResizeObserver(update);
    overviewModel.topbarObserver.observe(bar);
  }
}

function playOverviewIntro() {
  const hero = document.querySelector('.ov-hero.ov-intro');
  if (!hero) return;
  const value = hero.querySelector('[data-count-to]');
  const target = Number(value?.dataset.countTo);
  if (value && Number.isFinite(target) && target > 0) {
    const started = performance.now();
    const duration = 1400;
    const tick = now => {
      if (!value.isConnected) return;
      const progress = Math.min(1, (now - started) / duration);
      value.textContent = n(target * (1 - (1 - progress) ** 3));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const panels = document.querySelectorAll('.dashboard > *');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('ov-revealed');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  panels.forEach(panel => { panel.classList.add('ov-reveal'); observer.observe(panel); });
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-overview-model-toggle]');
  if (!toggle) return;
  overviewModel.enabled = !overviewModel.enabled;
  if (!overviewModel.enabled) dropOverviewModel();
  render();
});
