'use strict';
const E=Engine,KEY='greenledger.v1';let db,current,revision=null,stale=false,tab=0,library='fuels',report=3,storageError='';
function initialInventory() {
  const initial = mergeIpccFuels(mergeWorkbookFactors(E.seed()));
  for (const key of ['fuels', 'gases', 'other', 'grid']) {
    const id = entry => key === 'grid' ? entry.year : entry.id;
    const entries = new Map(initial[key].map(entry => [id(entry), entry]));
    for (const entry of structuredClone(publishedInventory2025[key])) entries.set(id(entry), entry);
    initial[key] = [...entries.values()];
  }
  initial.periods = [structuredClone(publishedInventory2025.period)];
  return initial;
}

try{const raw=localStorage.getItem(KEY);revision=raw;db=raw?mergeWorkbookFactors(E.updateDefaultGwp(JSON.parse(raw))):initialInventory();E.validate(db);}catch(e){db=initialInventory();storageError='Không đọc được dữ liệu cũ: '+e.message+'. Dữ liệu cũ chưa bị ghi đè. Hãy sao lưu hoặc nhập bản hợp lệ.';}
current=db.periods[0].id;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(v,d=2)=>Number(v||0).toLocaleString('vi-VN',{maximumFractionDigits:d,minimumFractionDigits:d});
const p=()=>db.periods.find(p=>p.id===current)||db.periods[0];
const names=['Tổng quan','Dữ liệu hoạt động','Tính toán & ĐKĐBĐ','Báo cáo tổng hợp','Thư viện hệ số','Sao lưu & xuất dữ liệu','Tra cứu IPCC','Hướng dẫn kiểm kê'];
const paths = [
  'M3 3h8v8H3z M14 3h7v5h-7z M3 14h8v7H3z M14 11h7v10h-7z',
  'M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12l1 1 2-2 M13 12h3 M8 17l1 1 2-2 M13 17h3',
  'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8 7h8 M8 11h2 M14 11h2 M8 15h2 M14 15h2 M8 18h2 M14 18h2',
  'M6 3h8l4 4v14H6z M14 3v5h4 M9 17v-3 M12 17v-5 M15 17v-4',
  'M3 5h4v15H3z M7 5h4v15H7z M14 5l4-1 4 15-4 1z M3 8h8 M3 17h8',
  'M7 17H6a4 4 0 1 1 1-7.9 5.5 5.5 0 0 1 10.7 1.4A3.3 3.3 0 1 1 18 17h-1 M12 12v9 M9 18l3 3 3-3',
  'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z M15 15l6 6 M7 10h6 M10 7v6',
  'M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1z M12 6v14 M6 9h3 M6 12h3 M15 9h3 M15 12h3',
];
const icon=i=>`<svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[i]}"></path></svg>`;
const btn=(text,action,cls='',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const badge=(s,c='')=>`<span class="badge ${c}" title="${esc(s)}">${esc(s)}</span>`;
function toast(s){let t=document.querySelector('#toast');t.textContent=s;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',3300)}
function commit(next,msg='Đã lưu dữ liệu'){try{if(stale||localStorage.getItem(KEY)!==revision)throw Error('Dữ liệu đã đổi ở thẻ khác. Tải lại trang trước khi lưu.');E.validate(next);let raw=JSON.stringify(next);localStorage.setItem(KEY,raw);revision=raw;db=next;storageError='';render();toast(msg);return true}catch(e){toast('Chưa lưu: '+e.message);return false}}
function change(fn,msg){let next=structuredClone(db);fn(next);return commit(next,msg)}
const source=s=>`<p class="source-text">Nguồn: ${esc(s)}</p>`;
const reportTitles = ['Bảng tổng hợp IPCC 2006', 'Hồ sơ tham chiếu TT 38/2023/TT-BCT', 'Mẫu 06 · Phụ lục II (dự thảo)', 'Báo cáo theo mẫu Word'];
const factorCategories = [['fuels', 'Nhiên liệu'], ['gases', 'GWP & môi chất'], ['other', 'Nước thải & phân bón'], ['grid', 'Lưới điện Việt Nam']];

function headerOptions(options, action, selected, label) {
  const buttons = options.map(([id, title]) => btn(esc(title), action, selected === id ? 'selected' : '',
    `data-${action === 'ipcc-mode' ? 'mode' : action}="${esc(id)}" aria-pressed="${selected === id}"`));
  return `<div class="tabs page-options no-print" role="group" aria-label="${esc(label)}">${buttons.join('')}</div>`;
}

function pageOptions() {
  if (tab === 3) return headerOptions(reportTitles.map((label, id) => [id, label]), 'report', report, 'Loại báo cáo');
  if (tab === 4) return headerOptions(factorCategories, 'library', library, 'Nhóm hệ số');
  if (tab === 6 && typeof ipccOptions === 'function') return ipccOptions();
  return '';
}

const pageDescriptions = [
  '',
  'Nhập số liệu hoạt động, thiết bị đo và chứng từ của từng nguồn.',
  'Kiểm tra công thức, hệ số và độ không đảm bảo đo của từng nguồn.',
  'Xem và xuất hồ sơ kiểm kê theo kỳ đã chọn.',
  'Tra cứu hệ số phát thải, GWP và tài liệu tham chiếu.',
  'Sao lưu hồ sơ và xuất số liệu kiểm kê.',
  'Tìm bảng và tài liệu tham chiếu IPCC.',
  'Công thức, ví dụ và các bước lập báo cáo.',
];

function workspaceNavigation() {
  const sections = [
    ['Kiểm kê', [0, 1, 2, 3]],
    ['Tài liệu và dữ liệu', [4, 6, 7, 5]],
  ];
  return sections.map(([label, items]) => `<div class="nav-section">
    <p class="nav-heading">${label}</p>
    ${items.map(i => btn(icon(i) + names[i], 'tab', i === tab ? 'active' : '',
      `data-tab="${i}"${i === tab ? ' aria-current="page"' : ''}`)).join('')}
  </div>`).join('');
}

function workspaceHeader() {
  const period = p();
  const actions = [
    tab === 2 ? btn('Phương pháp &amp; giả định', 'calc-method', 'method-button', 'aria-haspopup="dialog"') : '',
    [2, 4].includes(tab) ? btn('Tính nhiệt trị', 'calorific', 'method-button', 'aria-haspopup="dialog"') : '',
    splitWorkspaceToggle(),
    tab === 7 ? guideDownloadButton() : tab === 6 ? '' : btn(tab === 3 ? 'In / Lưu PDF' : 'Xuất báo cáo', tab === 3 ? 'print' : 'go-report', 'primary report-action'),
  ].join('');
  return `${tab === 0 ? overviewHero(period) : `<div class="page-head">
    <div><h1>${names[tab]}</h1>
    <p class="sub">${pageDescriptions[tab]}</p></div>
    <div class="actions">${actions}</div>
  </div>`}
  ${storageError ? `<div class="error-banner" role="alert">${esc(storageError)} ${btn('Tải dữ liệu gốc', 'raw-backup', 'small')}</div>` : ''}
  <section class="period-strip${tab === 2 ? ' calculation-period-strip' : ''}" ${(tab === 7 || tab === 6 && !splitWorkspaceVisible()) ? 'hidden' : ''} aria-label="Quản lý kỳ kiểm kê">
    <div class="period-field">
      <label for="period">Kỳ kiểm kê</label>
      <select id="period">${db.periods.map(x => `<option value="${esc(x.id)}" ${x.id === period.id ? 'selected' : ''}>${x.year} · ${esc(x.facility)}</option>`).join('')}</select>
    </div>
    <div class="actions period-actions">
      ${badge(period.gwp.toUpperCase() + ' · GWP-100', 'blue')}
      ${btn('+ Kỳ mới', 'new-period', 'small period-add')}
      <details class="period-menu">
        <summary>Quản lý kỳ</summary>
        <div class="period-menu-items">
          ${btn('Nhân bản', 'clone-period', 'small')}
          ${btn('Thông tin cơ sở', 'facility', 'small')}
          ${btn('Xóa kỳ', 'delete-period', 'small danger')}
        </div>
      </details>
    </div>
  </section>
  ${pageOptions()}`;
}

function render() {
  const splitScroll = captureSplitScroll();
  const summary = E.summary(p(), db);
  const navigationScroll = document.querySelector('.nav')?.scrollLeft ?? 0;
  const activeTab = document.activeElement?.closest('.nav button[data-tab]')?.dataset.tab;
  const views = [dashboard, activities, calculations, reports, factors, backup, ipccPage, inventoryGuide];
  document.title = 'GreenLedger · ' + names[tab];
  parkOverviewModel();
  document.querySelector('#app').innerHTML = `<a class="skip-link" href="#main-content">Đến nội dung chính</a>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand"><img class="brand-mark" src="greenledger-brand.png" alt=""><span class="brand-name"><strong>GreenLedger</strong><span class="brand-facility">Kiểm kê khí nhà kính</span></span></div>
        <nav class="nav" aria-label="Điều hướng chính">${workspaceNavigation()}</nav>
        <div class="sidebar-bottom"><span class="dot"></span>Lưu dữ liệu trên thiết bị</div>
      </aside>
      <div class="main">
        <header class="topbar no-print">
          <div class="breadcrumb"><span>Kiểm kê khí nhà kính</span><span aria-hidden="true">/</span><strong>${names[tab]}</strong></div>
          ${webToolbar()}
        </header>
        <main id="main-content" tabindex="-1">
          ${workspaceHeader()}
          ${renderSplitWorkspace(summary, views[tab](summary))}
          <footer class="footer"><span>GreenLedger</span><span>tCO₂e · Tấn CO₂ tương đương</span></footer>
        </main>
      </div>
    </div>`;
  restoreSplitScroll(splitScroll);
  mountOverviewModel();
  document.querySelector('.nav').scrollLeft = navigationScroll;
  if (activeTab !== undefined) document.querySelector(`.nav button[data-tab="${activeTab}"]`)?.focus({ preventScroll: true });
}

function kpi(label, value, unit) {
  return `<div class="kpi"><dt class="label">${label}</dt><dd class="number">${value}</dd><dd class="unit">${unit}</dd></div>`;
}

function emissionsByGroup(values) {
  const positive = values.filter(value => value > 0);
  const max = Math.max(...positive, 0);
  const min = positive.length ? Math.min(...positive) : 1;
  const logarithmic = max / min >= 100;
  const scale = value => logarithmic ? Math.log10(1 + value / min) : value;
  const limit = scale(max);

  return `<ul class="emissions-chart" aria-label="Phát thải theo nhóm nguồn, tCO₂e">
    ${values.map((value, index) => {
      const width = limit ? scale(value) / limit * 100 : 0;
      const label = value > 0 && value < 0.0001 ? '< 0,0001' : n(value, 4);
      return `<li class="emissions-row">
        <span>${esc(E.groups[index])}</span>
        <span class="emissions-track" aria-hidden="true">
          ${value > 0 ? `<span class="emissions-bar${index === 7 ? ' scope-two' : ''}" style="width:${width}%"></span>` : ''}
        </span>
        <strong>${esc(label)}</strong>
      </li>`;
    }).join('')}
  </ul>
  ${logarithmic ? '<p class="emissions-scale sub">Thang logarit để thấy rõ nhóm nhỏ. Giá trị tCO₂e hiển thị bên phải.</p>' : ''}`;
}
function dashboard(summary) {
  const colors = ['#1f604c', '#81a969', '#bc8b3f', '#47779b'];
  const gasNames = ['CO₂', 'CH₄', 'N₂O', 'HFCs / môi chất'];
  const total = summary.total || 1;
  const shares = summary.gases.map(value => value / total * 100);
  const dominant = shares.indexOf(Math.max(...shares));
  const segments = [];
  let stop = 0;
  shares.forEach((share, index) => {
    if (share > 0) segments.push(`${colors[index]} ${stop}% ${stop + share}%`);
    stop += share;
  });
  const ring = segments.length ? `conic-gradient(${segments.join(',')})` : '#e8eeea';
  return `<div class="dashboard">
    <div class="charts">
      <section class="panel emissions-panel">
        <div class="panel-head"><div><h2>Phát thải theo nhóm nguồn</h2><p class="sub">8 nhóm nguồn · tCO₂e</p></div>
          <div class="legend"><span><i class="swatch scope-one"></i>Phạm vi 1</span><span><i class="swatch scope-two"></i>Phạm vi 2</span></div>
        </div>
        ${emissionsByGroup(summary.groups)}
      </section>
      <section class="panel gas-panel">
        <div class="panel-head"><div><h2>Cơ cấu khí nhà kính</h2><p class="sub">Quy đổi theo ${p().gwp.toUpperCase()} · GWP-100</p></div></div>
        <div class="gas-chart">
          <div class="donut" aria-hidden="true" style="background:${ring}">
            <div class="donut-center"><strong>${n(shares[dominant], 1)}%</strong>${summary.total ? gasNames[dominant] : 'Tổng phát thải'}</div>
          </div>
          <div class="gas-legend">${shares.map((share, i) => `<div class="gas-line" title="${n(summary.gases[i], 4)} tCO₂e"><span><i class="swatch" style="background:${colors[i]}"></i>${gasNames[i]}</span><strong>${n(share, 1)}%</strong></div>`).join('')}</div>
        </div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-head"><div><h2>Nguồn phát thải trong kỳ</h2><p class="sub">${p().rows.length} nguồn đã khai báo ${(p().notes || '').includes('minh họa') ? badge('Dữ liệu mẫu') : ''}</p></div>
        ${btn('Quản lý dữ liệu', 'go-data', 'small')}
      </div>
      ${overviewSources(summary)}
      <div class="note">CO₂ sinh học báo cáo riêng: <strong>${n(summary.bio, 4)} tấn CO₂</strong>. Không cộng vào tổng phát thải Phạm vi 1 + 2.</div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>So sánh các kỳ kiểm kê</h2><p class="sub">Đối chiếu các kỳ có cùng ranh giới và phương pháp.</p></div></div>
      <div class="comparison">${db.periods.slice().sort((a, b) => a.year - b.year).map(period => {
        const result = E.summary(period, db);
        return `<div class="compare-item"><span>${period.year} · ${esc(period.facility)}</span><strong>${n(result.total)}</strong><span class="sub">tCO₂e · ${period.rows.length} nguồn · ${period.gwp.toUpperCase()}</span></div>`;
      }).join('')}</div>
    </section>
  </div>`;
}
function unit(r){if(r.group<2)return db.fuels.find(x=>x.id===r.factor)?.unit||'';return ['','','giờ công','m³','kg nạp bù','kg nạp bù','tấn','kWh'][r.group]}
function reports(s){if(report===3)return facilityReport(s);return `<section class="panel" id="report-sheet"><div class="report-heading">${report===2?'<p class="sub">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập · Tự do · Hạnh phúc</p>':''}<p class="sub">${esc(p().facility)}</p><h2 style="margin:12px 0;font-size:23px">Báo cáo kiểm kê khí nhà kính năm ${p().year}</h2><span class="sub">${reportTitles[report]} · ${p().gwp.toUpperCase()} · tCO₂e</span></div>${report===2?'<h3>I. Thông tin cơ sở</h3>':''}<div class="text-block"><strong>Cơ sở:</strong> ${esc(p().facility)}\n<strong>Địa chỉ:</strong> ${esc(p().address||'Chưa khai báo')}\n<strong>Người phụ trách:</strong> ${esc(p().contact||'Chưa khai báo')}\n<strong>Ranh giới:</strong> ${esc(p().boundary)}</div>${report===1?`<h3 style="margin-top:24px">1. Mô tả phương pháp và thu thập số liệu</h3><p class="text-block">Phương pháp hệ số phát thải IPCC 2006 Tier 1; chuyển đổi GWP-100 theo ${p().gwp.toUpperCase()}. Số liệu hoạt động từ chứng từ và thiết bị khai báo trong phụ lục. Độ không đảm bảo đo dùng hệ số phủ k = ${n(s.k,2)}. Cách xử lý đầu vào chung được ghi trong phần Phương pháp &amp; giả định.</p><h3>2. Kết quả kiểm kê</h3>`:''}${report===2?`<p class="text-block"><strong>Giấy phép kinh doanh:</strong> ${esc(p().license||'Chưa khai báo')}<br><strong>Đại diện pháp luật:</strong> ${esc(p().representative||'Chưa khai báo')}<br><strong>Ngành nghề:</strong> ${esc(p().sector||'Chưa khai báo')}</p><h3>II. Hoạt động sản xuất và dữ liệu của cơ sở</h3><p class="text-block">${esc(p().operations||'Chưa mô tả công nghệ, hoạt động, nguồn phát thải, bể hấp thụ và giới hạn dữ liệu.')}</p><h3>III. Phương pháp, số liệu và kết quả kiểm kê</h3><p class="text-block">Tính phát thải bằng số liệu hoạt động và hệ số tra cứu; quy đổi ${p().gwp.toUpperCase()} GWP-100. Bảng dưới đây ghi nguồn số liệu và hệ số theo từng dòng.</p><div class="table-wrap"><table><thead><tr><th>Nguồn / chứng từ</th><th>Thiết bị</th><th>Số liệu</th><th>Hệ số / nguồn tham chiếu</th></tr></thead><tbody>${s.rows.map(r=>`<tr><td>${esc(r.row.name)}<br>${esc(r.row.evidence)}</td><td>${esc(r.row.device)}<br>u AD: ${n(r.row.ad,4)}%</td><td>${n(r.amount)} ${esc(unit(r.row))}</td><td>${esc(r.row.factor)}<br><span class="source-text">${esc(r.source)}</span></td></tr>`).join('')}</tbody></table></div><p class="text-block"><strong>Phạm vi 1:</strong> ${n(s.scope1,4)} tCO₂e<br><strong>Phạm vi 2:</strong> ${n(s.scope2,4)} tCO₂e<br><strong>Tổng:</strong> ${n(s.total,4)} tCO₂e<br><strong>CO₂ sinh học báo cáo riêng:</strong> ${n(s.bio,4)} tấn CO₂</p><p class="text-block">${esc(p().notes||'Chưa đánh giá độ đầy đủ, độ tin cậy và các biện pháp cải thiện.')}</p><p class="text-block">Đại diện cơ sở: ____________________ &nbsp; Ngày: ____ / ____ / ______</p>`:`<div class="table-wrap" style="margin-top:22px"><table><thead><tr><th>Nhóm nguồn</th><th>Phạm vi</th><th class="num">CO₂</th><th class="num">CH₄ quy đổi</th><th class="num">N₂O quy đổi</th><th class="num">Môi chất quy đổi</th><th class="num">Tổng tCO₂e</th></tr></thead><tbody>${E.groups.map((x,i)=>{let rows=s.rows.filter(r=>r.row.group===i);return `<tr><td>${x}</td><td>${i===7?'2':'1'}</td>${[0,1,2,3].map(k=>`<td class="num">${n(rows.reduce((t,r)=>t+r.gases[k],0),4)}</td>`).join('')}<td class="num">${n(s.groups[i],4)}</td></tr>`}).join('')}<tr><td colspan="6"><strong>Tổng phát thải Phạm vi 1 + 2</strong></td><td class="num"><strong>${n(s.total,4)}</strong></td></tr><tr><td colspan="6">CO₂ sinh học báo cáo riêng (tấn CO₂)</td><td class="num">${n(s.bio,4)}</td></tr></tbody></table></div>`}<p class="text-block">Độ không đảm bảo đo mở rộng (95%): ± ${n(s.U,4)} tCO₂e (± ${n(s.percent)}%).</p>${report===1?`<h3>3. Ghi chú, đánh giá và kế hoạch cải thiện</h3><p class="text-block">${esc(p().notes||'Chưa bổ sung nhận xét.')}</p><p class="text-block">Đại diện cơ sở: ____________________ &nbsp; Ngày: ____ / ____ / ______</p>`:''}${[...new Set(s.rows.flatMap(r=>r.warnings))].map(w=>`<div class="note warning">${esc(w)}</div>`).join('')}<div class="note warning">Bản tổng hợp hỗ trợ lập hồ sơ, chưa phải biểu mẫu pháp lý được chứng nhận. Cần đối chiếu mẫu báo cáo hiện hành, phạm vi khí (đặc biệt HCFC-22), nguồn hệ số và yêu cầu thẩm định trước khi nộp. Các hệ số khởi tạo theo tài liệu người dùng, có thể chỉnh sửa tại Thư viện hệ số.</div><p class="source-text">Tài liệu: <a href="https://www.ipcc-nggip.iges.or.jp/public/2006gl/" target="_blank" rel="noopener">IPCC 2006</a> · <a href="https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/" target="_blank" rel="noopener">IPCC AR6 Ch.7</a> · <a href="https://moit.gov.vn/phat-trien-ben-vung/ban-hanh-thong-tu-quy-dinh-ky-thuat-do-dac-tham-dinh-giam-nhe-phat-thai-khi-nha-kinh.html" target="_blank" rel="noopener">Thông tin TT 38/2023/TT-BCT</a> · <a href="https://congbao.chinhphu.vn/tai-ve-van-ban-so-06-2022-nd-cp-36560-39440" target="_blank" rel="noopener">Mẫu 06 Phụ lục II (văn bản gốc)</a></p></section><div class="actions no-print" style="margin-bottom:24px">${btn('In / Lưu PDF','print','primary')}${btn('Xuất Excel .xlsx','xlsx')+btn('Xuất CSV','csv')}</div>`;}
function backup(s){return `<div class="backup-grid"><section class="panel"><h2>Sao lưu toàn bộ dữ liệu</h2><p class="sub">Bao gồm mọi kỳ kiểm kê, số liệu hoạt động và thư viện hệ số tùy chỉnh.</p><p class="number-lg">${db.periods.length} <span class="sub">kỳ kiểm kê</span></p>${btn('Tải bản sao lưu .json','json','primary')}<p class="source-text">Tệp JSON có thể nhập lại trên thiết bị khác. Số liệu được lưu trong trình duyệt.</p></section><section class="panel"><h2>Khôi phục từ bản sao lưu</h2><p class="sub">Kiểm tra cấu trúc và tham chiếu trước khi thay thế dữ liệu hiện tại.</p><p><input class="file-input" id="import" type="file" accept=".json,application/json" aria-label="Chọn tệp JSON để khôi phục"></p><div class="note warning">Nhập dữ liệu sẽ thay thế toàn bộ hồ sơ hiện có. Bạn sẽ được xem số kỳ và xác nhận trước khi áp dụng.</div></section><section class="panel"><h2>Xuất kết quả kỳ ${p().year}</h2><p class="sub">Bảng CSV dùng UTF-8, mở được trong Excel và các công cụ phân tích dữ liệu.</p><div class="actions" style="margin-top:20px">${btn('Tải Excel .xlsx','xlsx','primary')+btn('Tải bảng CSV','csv')}${btn('In / Lưu PDF','print','primary')}</div></section><section class="panel"><h2>Khôi phục dữ liệu mẫu</h2><p class="sub">50.000 lít DO cố định, bộ hệ số khởi tạo và kỳ kiểm kê năm 2024.</p><p class="source-text">Thao tác thay thế toàn bộ dữ liệu; nên tải bản sao lưu trước.</p>${btn('Khôi phục dữ liệu mẫu','reset','danger')}</section></div><div class="note">Ứng dụng lưu số liệu trên trình duyệt này. Dùng bản sao lưu JSON để chuyển dữ liệu sang máy khác.</div>`;}
function modal(title,body,onSubmit,wide=false){let d=document.querySelector('#modal');d.innerHTML=`<form id="modal-form"><div class="modal-head"><h2 id="dialog-title">${title}</h2><button type="button" class="quiet" data-action="close" aria-label="Đóng">✕</button></div>${body}<div id="form-error" class="source-text" style="color:#a43d35" role="alert"></div><div class="modal-foot">${btn('Hủy','close')}<button class="primary" type="submit">Lưu thay đổi</button></div></form>`;d.setAttribute('aria-labelledby','dialog-title');d.style.width=wide?'min(840px,94vw)':'';d.showModal();d.querySelector('#modal-form').onsubmit=e=>{e.preventDefault();try{if(onSubmit(new FormData(e.target))!==false)d.close()}catch(err){d.querySelector('#form-error').textContent=err.message}};}
function confirmAction(title,message,fn){modal(title,`<p>${esc(message)}</p>`,()=>fn());document.querySelector('#modal button[type=submit]').textContent='Xác nhận';}
function field(label,name,value,type='text',extra=''){return `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`}
function selectField(label,name,options,value){return `<label class="field">${label}<select name="${name}" aria-label="${esc(label)}">${options.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`}
function periodDialog(mode){let old=p(),fresh=mode==='new',value=fresh?{year:Number(old.year)+1,facility:old.facility,address:'',contact:'',boundary:old.boundary,notes:'',gwp:'ar6',weighted:true}:old;modal(mode==='edit'?'Thông tin cơ sở':fresh?'Tạo kỳ kiểm kê mới':'Nhân bản kỳ kiểm kê',`<div class="form-grid">${field('Năm kiểm kê','year',mode==='clone'?Number(old.year)+1:value.year,'number','required min="1900" max="2200" step="1"')}${field('Tên cơ sở','facility',value.facility,'text','required maxlength="160"')}${field('Địa chỉ','address',value.address)}${field('Người phụ trách','contact',value.contact)}${field('Giấy phép kinh doanh','license',value.license)}${field('Đại diện pháp luật','representative',value.representative)}${field('Lĩnh vực hoạt động','sector',value.sector)}<label class="field span2">Công nghệ, nguồn thải, bể hấp thụ và giới hạn dữ liệu<textarea name="operations">${esc(value.operations)}</textarea></label>${selectField('Bộ GWP-100','gwp',[['ar6','IPCC AR6'],['ar5','IPCC AR5'],['ar4','IPCC AR4']],value.gwp)}${field('Ranh giới kiểm kê','boundary',value.boundary)}<label class="field span2">Nhận xét / kế hoạch cải thiện<textarea name="notes">${esc(value.notes)}</textarea></label></div>`,fd=>{let x={year:Number(fd.get('year')),facility:fd.get('facility').trim(),address:fd.get('address'),contact:fd.get('contact'),license:fd.get('license'),representative:fd.get('representative'),sector:fd.get('sector'),operations:fd.get('operations'),boundary:fd.get('boundary'),notes:fd.get('notes'),gwp:fd.get('gwp')};if(!x.facility)throw Error('Vui lòng nhập tên cơ sở');let id=mode==='edit'?old.id:E.uid();let ok=change(d=>{if(mode==='edit')Object.assign(d.periods.find(z=>z.id===id),x);else d.periods.push({...structuredClone(value),...x,id,rows:fresh?[]:structuredClone(old.rows).map(r=>({...r,id:E.uid()}))})},'Đã lưu kỳ kiểm kê');if(ok){current=id;render()}return ok});}
function optionsFor(group){return group<2?db.fuels.filter(f=>f.type===(group===0?'stationary':'mobile')).map(f=>[f.id,f.name+' ('+f.unit+')']):group===4||group===5?db.gases.filter(g=>g.id==='CO2'?group===5:!['CH4_FOSSIL','CH4_BIO','N2O'].includes(g.id)).map(g=>[g.id,g.id==='CO2'?'CO₂ · Bình chữa cháy':g.name]):group===6?db.other.filter(f=>['UREA','LIME'].includes(f.id)).map(f=>[f.id,f.name]):group===7?db.grid.slice().sort((a,b)=>b.year-a.year).map(g=>[g.id,g.year+' · '+n(g.value,4)+' tCO₂/MWh']):[];}
function rowDialog(id,draft){let old=p().rows.find(x=>x.id===id);let r=draft||structuredClone(old)||{id:E.uid(),name:'Nguồn phát thải mới',group:0,factor:db.fuels[0]?.id,amount:0,mode:'annual',months:Array(12).fill(0),ad:.5/Math.sqrt(3),device:'',evidence:'',nitrogen:.02,cod:.1,nU:0,codU:0,mcf:'MCF_SEPTIC',includeCH4:false};const options=optionsFor(r.group);let amountLabel=r.group<2?'Lượng nhiên liệu ('+(db.fuels.find(x=>x.id===r.factor)?.unit||'ĐVT')+')':r.group===2?'Tổng giờ công (người × giờ)':r.group===3?'Lưu lượng nước thải (m³)':r.group===5&&r.factor==='CO2'?'CO₂ thực tế đã xả (kg)':r.group===4||r.group===5?'Lượng nạp bù / rò rỉ (kg)':r.group===6?'Khối lượng sử dụng (tấn)':'Điện năng tiêu thụ (kWh)';modal(old?'Chỉnh sửa nguồn phát thải':'Thêm nguồn phát thải',`<div class="form-grid">${field('Tên nguồn / thiết bị','name',r.name,'text','required maxlength="160"')}${selectField('Nhóm nguồn','group',E.groups.map((x,i)=>[i,x]),r.group)}${options.length?selectField('Hệ số áp dụng','factor',options,r.factor):''}${selectField('Chế độ nhập','mode',[['annual','Tổng năm'],['monthly','Chi tiết 12 tháng']],r.mode)}<div class="span2">${r.mode==='monthly'?`<p class="sub" style="margin-bottom:12px">${amountLabel} · Tổng: <strong id="month-total">${n(r.months.reduce((s,x)=>s+x,0))}</strong></p><div class="monthly">${r.months.map((v,i)=>field('Tháng '+(i+1),'m'+i,v,'number','min="0" step="any" required')).join('')}</div>`:isCylinderSource(r)?cylinderFields(r,amountLabel):field(amountLabel,'amount',r.amount,'number','min="0" step="any" required')}</div>${r.group===2?'<label class="check-row"><input type="checkbox" name="personUncertain" '+(r.personUncertain!==false?'checked':'')+'>Tính thêm bất định số người khi số liệu chưa chính xác</label>':''}${r.group===2||r.group===3?selectField('Công nghệ xử lý / MCF','mcf',db.other.filter(x=>x.id.startsWith('MCF_')).map(x=>[x.id,x.name+' = '+x.value]),r.mcf):''}${r.group===3?`${field('Nồng độ tổng N tại điểm xả (kg N/m³)','nitrogen',r.nitrogen,'number','min="0" step="any" required')}${field('u nồng độ N (%)','nU',r.nU||0,'number','min="0" step="any" required')}<label class="check-row"><input type="checkbox" name="includeCH4" ${r.includeCH4?'checked':''}>Tính thêm CH₄ công nghiệp</label><p class="sub">N₂O nước xả dùng thể tích xả × nồng độ tổng N tại điểm xả. Nếu nồng độ thay đổi theo tháng, dùng trung bình gia quyền theo thể tích hoặc nhập từng tháng thành một nguồn riêng.</p>${field('COD (kg COD/m³)','cod',r.cod,'number','min="0" step="any" required')}${field('u COD (%)','codU',r.codU||0,'number','min="0" step="any" required')}`:''}${activityUncertaintyFields(r)}${reliabilityFields(r)}${field('Thiết bị / phương pháp đo','device',r.device)}${field('Nguồn dữ liệu / mã chứng từ','evidence',r.evidence)}</div><div class="note">${r.group===2?'Giờ công = số người × số giờ làm việc; BOD tính từ giờ công / 24. Chỉ bật bất định số người khi thành phần này chưa được tính trong u AD.':r.group===4||r.group===5?'Nhập khối lượng thực tế phát thải hoặc nạp bù, không nhập tổng lượng môi chất trong thiết bị.':'Nếu dùng sai số giới hạn ±a với phân bố chữ nhật: u = a / √3. Nhập u tương đối (%), không nhập sai số mở rộng.'}</div>`,fd=>{let x=readRow(fd,r);if(!x.name)throw Error('Vui lòng nhập tên nguồn phát thải');if(!Number.isFinite(x.ad))throw Error('Kiểm tra các đầu vào để tính u số liệu hoạt động.');let ok=change(d=>{let z=d.periods.find(x=>x.id===current);if(old)z.rows[z.rows.findIndex(x=>x.id===id)]=x;else z.rows.push(x)},'Đã lưu nguồn phát thải');return ok},true);
let d=document.querySelector('#modal');for(let key of ['group','mode'])d.querySelector(`[name=${key}]`).onchange=()=>{let fd=new FormData(d.querySelector('form')),x=readRow(fd,r);if(key==='group'){x.group=Number(fd.get('group'));x.factor=(x.group===7?db.grid.find(g=>g.year===p().year)?.id:null)||optionsFor(x.group)[0]?.[0]||'';if(x.group===7||x.group===2){x.ad=x.group===7?.1:0;delete x.adHalfWidth;delete x.adMethod;delete x.adInputs;}}d.close();rowDialog(id,x)};let fac=d.querySelector('[name=factor]');if(fac)fac.onchange=()=>{let x=readRow(new FormData(d.querySelector('form')),r);d.close();rowDialog(id,x)};const form=d.querySelector('form');bindActivityUncertainty(form);bindReliability(form);if(form.elements.pcccInput)form.elements.pcccInput.onchange=event=>{const data=new FormData(form);data.set('pcccInput',r.pcccInput||'direct');const x=readRow(data,r);x.pcccInput=event.target.value;d.close();rowDialog(id,x)};for(let el of d.querySelectorAll('[name^=m]'))if(/^m\d+$/.test(el.name))el.oninput=()=>{d.querySelector('#month-total').textContent=n([...d.querySelectorAll('input[name^=m]')].reduce((s,x)=>s+Number(x.value),0))};}
function readRow(fd,r){let x={...r,name:String(fd.get('name')||r.name).trim(),group:Number(fd.get('group')),mode:fd.get('mode'),factor:fd.get('factor')||r.factor,ad:Number(fd.get('ad')),device:fd.get('device'),evidence:fd.get('evidence')};readActivityUncertainty(fd,x);x.reliability=readReliability(fd);if(fd.has('amount'))x.amount=Number(fd.get('amount'));readCylinderInput(fd,x);if(x.group===2)x.personUncertain=fd.has('personUncertain');if(fd.has('m0'))x.months=Array.from({length:12},(_,i)=>Number(fd.get('m'+i)));for(let k of ['nitrogen','cod','nU','codU'])if(fd.has(k))x[k]=Number(fd.get(k));if(fd.has('mcf'))x.mcf=fd.get('mcf');if(x.group===3)x.includeCH4=fd.has('includeCH4');return x;}
function factorDialog(id,preset,options){let old=db[library].find(x=>x.id===id);let x=old||preset|| (library==='fuels'?{id:'FUEL_'+Date.now(),name:'Nhiên liệu mới',type:'stationary',unit:'Kg',density:1,ncv:[1,1,1],co2:[0,0,0],ch4:[0,0,0],n2o:[0,0,0],bio:false,source:''}:library==='gases'?{id:'GAS_'+Date.now(),name:'Môi chất mới',ar4:0,ar5:0,ar6:0,u:0,mix:[],source:''}:library==='grid'?{id:'GRID_'+(Number(p().year)+1),year:Number(p().year)+1,value:0,source:''}:{id:'FACTOR_'+Date.now(),name:'Hệ số mới',value:0,u:0,unit:'',source:''});let content=`<div class="form-grid">${field('Mã hệ số','id',x.id,'text','required '+(old?'readonly':''))}${library==='grid'?field('Năm','year',x.year,'number','required min="1900" max="2200"'):field('Tên hệ số','name',x.name,'text','required')}`;
if(library==='fuels'){content+=selectField('Nhóm nhiên liệu','type',[['stationary','Đốt cố định'],['mobile','Đốt di động']],x.type)+field('Đơn vị hoạt động','unit',x.unit,'text','required')+field('Khối lượng riêng (kg/ĐVT)','density',x.density,'number','min="0.000001" step="any" required')+`<label class="check-row"><input name="bio" type="checkbox" ${x.bio?'checked':''}>Sinh khối (tách CO₂ riêng)</label><div class="span2"><div class="table-wrap"><table><thead><tr><th>Hệ số</th><th>Giá trị</th><th>Lower</th><th>Upper</th></tr></thead><tbody>${[['ncv','NCV (TJ/Gg)'],['co2','EF CO₂ (kg/TJ)'],['ch4','EF CH₄ (kg/TJ)'],['n2o','EF N₂O (kg/TJ)']].map(([k,l])=>`<tr><td>${l}</td>${x[k].map((v,i)=>`<td><input style="width:100%;min-width:85px" aria-label="${l} ${['giá trị','lower','upper'][i]}" name="${k}${i}" type="number" min="${k==='ncv'&&i===0&&x.id==='IPCC22_INDUSTRIAL_WASTE'?'0.000001':0}" step="any" value="${v??''}" required></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}else if(library==='gases'){content+=['ar4','ar5','ar6','u'].map(k=>field(k==='u'?'u GWP (chuẩn AR6)':k.toUpperCase(),k,x[k],'number','min="0" step="any" required')).join('')+`<label class="field span2">Thành phần hỗn hợp (JSON: [["HFC_32", 0.5], ["HFC_125", 0.5]])<textarea name="mix">${esc(JSON.stringify(x.mix))}</textarea></label>`;}else content+=field(library==='grid'?'EF điện (tCO₂/MWh)':'Giá trị','value',x.value,'number','min="0" step="any" required')+(library==='other'?field('u chuẩn (%)','u',x.u,'number','min="0" step="any" required')+field('Đơn vị','unit',x.unit):'');content+=`<label class="field span2">Nguồn tài liệu (file, bảng, trang / đường dẫn)<textarea name="source" required>${esc(x.source)}</textarea></label></div>`;modal(old?'Chỉnh sửa hệ số':'Thêm hệ số tra cứu',(options?.ipcc?ipccFuelDraftNote(options.missingNcv):'')+content,fd=>{let z={...x,id:fd.get('id').trim(),source:fd.get('source')};if(!old&&db[library].some(f=>f.id===z.id))throw Error('Mã đã tồn tại');if(library!=='grid')z.name=fd.get('name').trim();if(library==='fuels'){z.type=fd.get('type');z.unit=fd.get('unit');z.density=Number(fd.get('density'));z.bio=fd.has('bio');for(let k of ['ncv','co2','ch4','n2o'])z[k]=[0,1,2].map(i=>Number(fd.get(k+i)));if(options?.ipcc)validateIpccFuelDraft(z,fd,options.missingNcv);}else if(library==='gases'){for(let k of ['ar4','ar5','ar6','u'])z[k]=Number(fd.get(k));z.mix=JSON.parse(fd.get('mix'));}else{z.value=Number(fd.get('value'));if(library==='grid'){z.year=Number(fd.get('year'));if(db.grid.some(g=>g.year===z.year&&g.id!==z.id))throw Error('Năm hệ số đã có');}else{z.u=Number(fd.get('u'));z.unit=fd.get('unit');}}return change(d=>{if(old)d[library][d[library].findIndex(f=>f.id===id)]=z;else d[library].push(z)},'Đã lưu hệ số; đã tính lại các kỳ')},true);}
function download(name,text,type){let url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function csv(){let s=E.summary(p(),db);const safe=v=>{let text=String(v??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'};let lines=[['Năm','Cơ sở','Nguồn','Nhóm','Số lượng','Đơn vị','CO2 tấn','CH4 tCO2e','N2O tCO2e','Môi chất tCO2e','Tổng tCO2e','u chuẩn tCO2e','U95 tCO2e','CO2 sinh học tấn','Nguồn hệ số'],...s.rows.map(r=>[p().year,p().facility,r.row.name,E.groups[r.row.group],r.amount,unit(r.row),...r.gases,r.total,r.u,r.U,r.bio,r.source]),['','','Tổng','','','',...s.gases,s.total,s.u,s.U,s.bio,'']];download('kiem-ke-'+p().year+'.csv','\uFEFF'+lines.map(r=>r.map(safe).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('Đã xuất bảng CSV')}
document.addEventListener('click',e=>{let b=e.target.closest('[data-action]');if(!b)return;let a=b.dataset.action,id=b.dataset.id;try{switch(a){case'tab':tab=Number(b.dataset.tab);render();break;case'go-report':tab=3;report=3;render();break;case'facility-profile':openFacilityProfile();break;case'go-data':tab=1;render();break;case'close':document.querySelector('#modal').close();break;case'new-period':periodDialog('new');break;case'clone-period':periodDialog('clone');break;case'facility':periodDialog('edit');break;case'delete-period':if(db.periods.length===1){toast('Cần giữ ít nhất một kỳ kiểm kê');break;}confirmAction('Xóa kỳ kiểm kê?',`Xóa toàn bộ số liệu kỳ ${p().year} của ${p().facility}?`,()=>{let ok=change(d=>{d.periods=d.periods.filter(x=>x.id!==current)},'Đã xóa kỳ');if(ok){current=db.periods[0].id;render()}return ok});break;case'new-row':rowDialog();break;case'edit-row':rowDialog(id);break;case'delete-row':confirmAction('Xóa nguồn phát thải?','Dữ liệu năm và 12 tháng của nguồn này sẽ bị xóa.',()=>change(d=>{let z=d.periods.find(x=>x.id===current);z.rows=z.rows.filter(x=>x.id!==id)},'Đã xóa nguồn'));break;case'library':library=b.dataset.library;Object.assign(workbookView,{query:'',page:1});render();document.querySelector('[data-action="library"][aria-pressed="true"]')?.focus({preventScroll:true});break;case'new-factor':openFactorTemplate();break;case'edit-factor':factorDialog(id);break;case'delete-factor':{let used=db.periods.some(p=>p.rows.some(r=>r.factor===id||r.mcf===id))||db.gases.some(g=>g.mix.some(([k])=>k===id));let core=['CO2','CH4_FOSSIL','CH4_BIO','N2O','BOD','BO_DOM','PERSON','EF_N','BO_IND','UREA','LIME'].includes(id);if(used||core){toast('Hệ số đang được sử dụng hoặc là hệ số nền; có thể chỉnh sửa.');break;}confirmAction('Xóa hệ số?','Hệ số này sẽ bị xóa khỏi thư viện.',()=>change(d=>{d[library]=d[library].filter(x=>x.id!==id)},'Đã xóa hệ số'));break;}case'report':report=Number(b.dataset.report);render();document.querySelector('[data-action="report"][aria-pressed="true"]')?.focus({preventScroll:true});break;case'json':download('greenledger-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(db,null,2),'application/json');toast('Đã xuất bản sao lưu');break;case'raw-backup':download('greenledger-du-lieu-goc.json',localStorage.getItem(KEY)||'{}','application/json');break;case'csv':csv();break;case'print':tab=3;render();window.print();break;case'reset':confirmAction('Khôi phục dữ liệu mẫu?','Toàn bộ kỳ và hệ số hiện tại sẽ bị thay thế. Hãy sao lưu trước khi xác nhận.',()=>{let next=mergeIpccFuels(mergeWorkbookFactors(E.seed())),ok=commit(next,'Đã khôi phục dữ liệu mẫu');if(ok){current=db.periods[0].id;render()}return ok});break;}}catch(err){toast(err.message)}});
document.addEventListener('change',async e=>{if(e.target.id==='period'){current=e.target.value;render()}if(e.target.id==='import'){let file=e.target.files[0];if(!file)return;try{let next=mergeIpccFuels(mergeWorkbookFactors(E.updateDefaultGwp(JSON.parse(await file.text()))));E.validate(next);confirmAction('Nhập dữ liệu sao lưu?',`Tệp hợp lệ: ${next.periods.length} kỳ, ${next.periods.reduce((s,p)=>s+p.rows.length,0)} nguồn phát thải. Thay thế toàn bộ dữ liệu hiện tại?`,()=>{let ok=commit(next,'Đã nhập dữ liệu sao lưu');if(ok){current=db.periods[0].id;render()}return ok});}catch(err){toast('Không thể nhập: '+err.message);e.target.value=''}}});
window.addEventListener('storage',e=>{if(e.key===KEY){stale=true;storageError='Dữ liệu đã thay đổi ở thẻ khác. Tải lại trang để dùng bản mới nhất; không chỉnh sửa trước khi tải lại.';render()}});
render();
if (revision !== null && !storageError && db.ipccFuelLibraryVersion !== 1) change(mergeIpccFuels, 'Đã cập nhật thư viện nhiên liệu IPCC');
