'use strict';

const calculationView = {
  periodId: null,
  query: '',
  scope: 'all',
  groups: new Set(),
  warningsOnly: false,
  sort: 'group',
  layout: 'list',
  page: 1,
  pageSize: 10,
  expandedId: null,
};

function calculationRows(summary) {
  const query = normalizeSearch(calculationView.query.trim());
  const rows = summary.rows.filter(result => {
    const row = result.row;
    const scope = row.group === 7 ? '2' : '1';
    const text = [row.name, row.factor, row.device, row.evidence, E.groups[row.group]].join(' ');
    return (!query || normalizeSearch(text).includes(query))
      && (calculationView.scope === 'all' || calculationView.scope === scope)
      && (!calculationView.groups.size || calculationView.groups.has(row.group))
      && (!calculationView.warningsOnly || result.error || result.warnings.length > 0);
  });
  const sorters = {
    group: (a, b) => a.row.group - b.row.group,
    emissions: (a, b) => b.total - a.total,
    uncertainty: (a, b) => b.U - a.U,
    name: (a, b) => a.row.name.localeCompare(b.row.name, 'vi'),
  };
  return rows.sort(sorters[calculationView.sort] || sorters.group);
}

function calculations(summary, compact = false) {
  if (calculationView.periodId !== p().id) {
    Object.assign(calculationView, { periodId: p().id, query: '', scope: 'all', groups: new Set(), warningsOnly: false, page: 1, expandedId: null });
  }
  const rows = calculationRows(summary);
  const totalPages = Math.max(1, Math.ceil(rows.length / calculationView.pageSize));
  calculationView.page = Math.min(calculationView.page, totalPages);
  const start = (calculationView.page - 1) * calculationView.pageSize;
  const visible = rows.slice(start, start + calculationView.pageSize);
  const groupCount = group => summary.rows.filter(result => result.row.group === group).length;
  const warningCount = summary.rows.filter(result => result.error || result.warnings.length > 0).length;
  const scopeOptions = [['all', 'Tất cả phạm vi'], ['1', 'Phạm vi 1 · Trực tiếp'], ['2', 'Phạm vi 2 · Điện mua']];
  const sortOptions = [['group', 'Nhóm nguồn'], ['emissions', 'Phát thải cao nhất'], ['uncertainty', 'U 95% cao nhất'], ['name', 'Tên nguồn A–Z']];
  const filtered = calculationView.query || calculationView.groups.size || calculationView.scope !== 'all' || calculationView.warningsOnly;

  return `<section class="calculation-workspace" aria-label="Tra cứu chi tiết tính toán">
    ${compact ? '<details class="split-calculation-filters"><summary>Bộ lọc nguồn</summary>' : ''}
    <aside class="calculation-filters" aria-label="Bộ lọc nguồn phát thải">
      <div class="calculation-period"><span>Kỳ kiểm kê</span><strong>${p().year}</strong><span>${esc(p().facility)}</span></div>
      <div class="calculation-filter-body">
        <div class="calculation-filter-heading"><h2>Chọn lọc nguồn</h2>${filtered ? btn('Đặt lại', 'calc-clear', 'quiet small') : ''}</div>
        <label class="field">Tìm nguồn phát thải<input id="calc-query" type="search" value="${esc(calculationView.query)}" placeholder="Tên nguồn, mã, thiết bị…" autocomplete="off"></label>
        <label class="field calculation-scope">Phạm vi<select id="calc-scope">${scopeOptions.map(([value, label]) => `<option value="${value}" ${calculationView.scope === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <fieldset class="calculation-group-filter"><legend>Nhóm nguồn phát thải</legend>
          ${E.groups.map((name, group) => `<label class="calculation-filter-option"><input type="checkbox" data-calc-group="${group}" ${calculationView.groups.has(group) ? 'checked' : ''}><span>${name}</span><span class="calculation-count">${groupCount(group)}</span></label>`).join('')}
        </fieldset>
        <label class="calculation-filter-option calculation-warning-filter"><input id="calc-warnings" type="checkbox" ${calculationView.warningsOnly ? 'checked' : ''}><span>Có lưu ý / thiếu hệ số</span><span class="calculation-count">${warningCount}</span></label>
      </div>
    </aside>
    ${compact ? '</details>' : ''}
    <div class="calculation-results">
      <div class="calculation-results-heading">
        <h2 id="calculation-result-count" aria-live="polite">Kỳ ${p().year} · tìm thấy ${rows.length} nguồn</h2>
        ${btn('So sánh IPCC 2019', 'calc-effluent-preview', 'small', 'aria-haspopup="dialog"')}
        <div class="calculation-layout-switch" role="group" aria-label="Bố cục danh sách">${btn('Xem ngang', 'calc-layout', calculationView.layout === 'list' ? 'selected small' : 'small', 'data-layout="list" aria-pressed="' + (calculationView.layout === 'list') + '"')}${btn('Xem dọc', 'calc-layout', calculationView.layout === 'grid' ? 'selected small' : 'small', 'data-layout="grid" aria-pressed="' + (calculationView.layout === 'grid') + '"')}</div>
      </div>
      <div class="calculation-results-toolbar"><label for="calc-sort">Sắp xếp theo <select id="calc-sort">${sortOptions.map(([value, label]) => `<option value="${value}" ${calculationView.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><span class="sub">${rows.length ? start + 1 : 0}–${Math.min(start + calculationView.pageSize, rows.length)} / ${rows.length} nguồn</span></div>
      <div class="calculation-source-list ${calculationView.layout === 'grid' ? 'calculation-source-grid' : ''}">
        ${visible.map(result => calculationCard(result, summary.rows.indexOf(result))).join('')}
      </div>
      ${!visible.length ? `<div class="panel empty"><h3>${summary.rows.length ? 'Không có nguồn phù hợp bộ lọc' : 'Chưa có nguồn phát thải'}</h3><p>${summary.rows.length ? 'Đổi từ khóa hoặc đặt lại bộ lọc để xem các nguồn trong kỳ.' : 'Thêm số liệu hoạt động để xem các bước tính.'}</p>${summary.rows.length ? btn('Đặt lại bộ lọc', 'calc-clear') : btn('Nhập số liệu', 'go-data', 'primary')}</div>` : ''}
      ${totalPages > 1 ? `<nav class="calculation-pagination" aria-label="Phân trang nguồn phát thải">${btn('Trang trước', 'calc-page', '', 'data-page="' + (calculationView.page - 1) + '" ' + (calculationView.page === 1 ? 'disabled' : ''))}<span>Trang ${calculationView.page} / ${totalPages}</span>${btn('Trang sau', 'calc-page', '', 'data-page="' + (calculationView.page + 1) + '" ' + (calculationView.page === totalPages ? 'disabled' : ''))}</nav>` : ''}
    </div>
  </section>`;
}

function effluentPreviewDialog() {
  const period = p();
  const sources = period.rows.filter(row => row.group === 3);
  const options = [['', 'Nhập số liệu để tính thử'], ...sources.map(row => [row.id, row.name])];
  const canSave = accountCan('data');
  modal('So sánh N₂O đầu xả · IPCC 2019', `
    <p class="sub">Thí điểm cho nước thải công nghiệp xả vào nguồn nước theo Tier 1. Kết quả xem trước dùng GWP của kỳ ${esc(period.year)}.</p>
    <div class="form-grid">
      ${sources.length ? `<div class="span2">${selectField('Nguồn nước thải công nghiệp', 'source', options, '')}</div>` : ''}
      ${field('Thể tích xả trong kỳ (m³)', 'volume', '', 'number', 'required min="0" step="any"')}
      ${field('Tổng N tại điểm xả (kg N/m³)', 'nitrogen', '', 'number', 'required min="0" step="any"')}
    </div>
    <p class="sub">Nhập tổng N và thể tích tại cùng điểm xả, cùng kỳ. Chia số đo mg N/L cho 1.000 để đổi sang kg N/m³.</p>
    <label class="check-row"><input type="checkbox" name="eligible" required> Đã xác định điểm xả vào nguồn nước và điều kiện áp dụng Tier 1.</label>
    <div id="effluent-preview-result" aria-live="polite"></div>
    ${canSave ? '<button type="button" data-effluent-reset hidden>Dùng lại hệ số thư viện</button>' : ''}
    <p class="source-text">Phạm vi tính thử chỉ gồm N₂O sau xả. <a href="https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/5_Volume5/19R_V5_6_Ch06_Wastewater.pdf#page=39" target="_blank" rel="noopener noreferrer">IPCC 2019 · Tập 5, Chương 6, Bảng 6.8A</a></p>`, data => {
    const source = selectedSource();
    if (!data.get('volume')?.trim() || !data.get('nitrogen')?.trim()) throw Error('Cần đủ thể tích xả và tổng N tại điểm xả.');
    const result = E.previewIndustrialEffluentN2O({
      volume: Number(data.get('volume')), nitrogen: Number(data.get('nitrogen')),
    }, period, db, source);
    output.innerHTML = `<div class="calc-grid">
      <div class="calc-item">Theo hệ số của kỳ<strong>${n(result.current, 4)}</strong>tCO₂e</div>
      <div class="calc-item">IPCC 2019 · Tier 1<strong>${n(result.candidate, 4)}</strong>tCO₂e</div>
      <div class="calc-item">Chênh lệch<strong>${result.delta > 0 ? '+' : ''}${n(result.delta, 4)}</strong>tCO₂e</div>
    </div>
    <p class="sub">Tải N ${n(result.load, 4)} kg · GWP N₂O ${n(result.gwp, 0)} · EF ${n(result.currentFactor, 6)} → ${n(result.candidateFactor, 6)} kg N₂O-N/kg N</p>
    ${source && canSave ? `<fieldset class="source-review">
      <legend>Lưu phương pháp cho nguồn đang chọn</legend>
      <div class="form-grid">
        ${field('u chuẩn của hệ số EF (%)', 'effluentU', source.effluentMethod?.u, 'number', 'min="0" step="any" placeholder="Nhập giá trị có căn cứ"')}
        ${field('Căn cứ chọn u EF', 'effluentBasis', source.effluentMethod?.basis, 'text', 'maxlength="500"')}
      </div>
      <p class="sub">Nhập độ không đảm bảo chuẩn tương đối và căn cứ. Nguồn sẽ dùng hệ số IPCC 2019 trong báo cáo của kỳ.</p>
      <button type="button" class="primary" data-effluent-apply>Áp dụng cho nguồn này</button>
    </fieldset>` : ''}`;
    return false;
  }, true);
  const form = document.querySelector('#modal-form');
  const output = form.querySelector('#effluent-preview-result');
  const submit = form.querySelector('[type="submit"]');
  const error = form.querySelector('#form-error');
  const reset = form.querySelector('[data-effluent-reset]');
  const selectedSource = () => sources.find(row => row.id === form.elements.source?.value);
  submit.textContent = 'Tính đối chiếu';
  form.querySelector('.modal-foot [data-action="close"]').textContent = 'Đóng';
  form.elements.source?.addEventListener('change', () => {
    const source = selectedSource();
    form.elements.volume.value = source?.mode === 'monthly'
      ? source.months.reduce((sum, amount) => sum + Number(amount), 0) : source?.amount ?? '';
    form.elements.nitrogen.value = source?.nitrogen ?? '';
    form.elements.volume.readOnly = Boolean(source);
    form.elements.nitrogen.readOnly = Boolean(source);
    form.elements.eligible.checked = false;
    if (reset) reset.hidden = !source?.effluentMethod;
    output.replaceChildren();
    error.textContent = '';
  });
  form.addEventListener('input', event => {
    error.textContent = '';
    if (output.contains(event.target)) return;
    output.replaceChildren();
  });
  form.addEventListener('click', async event => {
    const button = event.target.closest('[data-effluent-apply], [data-effluent-reset]');
    if (!button || submit.disabled || !accountCan('data')) return;
    const source = selectedSource();
    if (!source) return;
    const applying = button.hasAttribute('data-effluent-apply');
    const method = applying ? {
      id: E.effluentTier1.id,
      u: form.elements.effluentU.valueAsNumber,
      basis: form.elements.effluentBasis.value.trim(),
    } : undefined;
    submit.disabled = button.disabled = true;
    try {
      if (applying) E.industrialEffluentFactor({ ...source, effluentMethod: method }, db);
      const saved = await change(next => {
        const row = next.periods.find(item => item.id === period.id)?.rows.find(item => item.id === source.id);
        if (!row || row.group !== 3 || JSON.stringify(row) !== JSON.stringify(source)) {
          throw Error('Nguồn đã thay đổi. Mở lại hộp thoại để tính đối chiếu.');
        }
        if (applying) row.effluentMethod = method;
        else delete row.effluentMethod;
      }, applying ? 'Đã lưu phương pháp IPCC 2019 cho nguồn' : 'Đã dùng lại hệ số thư viện cho nguồn');
      if (saved && form.isConnected) form.closest('dialog').close();
      else if (!saved) error.textContent = 'Chưa lưu được phương pháp. Kiểm tra thông báo lưu dữ liệu.';
    } catch (err) {
      error.textContent = err.message;
    } finally {
      submit.disabled = button.disabled = false;
    }
  });
}

function calculationMethodDialog() {
  const period = p();
  const summary = E.summary(period, db);
  const shared = E.sharedInputs(summary.rows, db);
  const gridYears = E.gridSeries(period, db).map(item => item.year);
  modal('Phương pháp &amp; giả định', `
    <p class="sub">Kỳ ${period.year} · ${esc(period.facility)}</p>
    <div class="method-dialog-content">
      <div class="method-standard"><strong>IPCC 2006 Tier 1</strong><span class="badge blue">${period.gwp.toUpperCase()} · GWP-100</span></div>
      <dl class="method-metrics">
        <div><dt>u toàn cơ sở (tCO₂e)</dt><dd>${n(summary.u, 6)}</dd></div>
        <div><dt>U mở rộng 95% (tCO₂e)</dt><dd>± ${n(summary.U, 6)}</dd></div>
        <div><dt>U tương đối 95%</dt><dd>± ${n(summary.percent)}%</dd></div>
      </dl>
      <p>Ảnh hưởng của cùng một đầu vào lên nhiều khí trong một nguồn được cộng trước. Các thành phần độc lập được tổng hợp theo <strong>u = √Σuₖ²</strong>.</p>
      <div class="form-grid">
        ${selectField('Hệ số phủ k (mức 95% xấp xỉ)', 'coverageFactor', [[1.96, '1,96'], [2, '2 · theo slide']], summary.k)}
        ${field('Chuỗi EF điện từ năm', 'gridFrom', period.gridFrom ?? '', 'number', 'min="1900" max="2200" step="1" placeholder="2014"')}
        ${field('Chuỗi EF điện đến năm', 'gridTo', period.gridTo ?? '', 'number', 'min="1900" max="2200" step="1" placeholder="2024"')}
      </div>
      <p>Năm đang dùng để tính độ lệch chuẩn EF điện: ${gridYears.join(', ') || 'chưa có'}. Điền cả hai mốc để chọn khoảng, hoặc để trống cả hai để dùng thư viện. Độ lệch chuẩn này ước tính biến động giữa các năm.</p>
      <label class="check-row method-setting"><input name="correlateShared" type="checkbox" ${period.correlateShared ? 'checked' : ''}>Tính tương quan hoàn toàn (+1) giữa các nguồn dùng cùng mã hệ số, GWP hoặc mã nhóm sai số AD</label>
      <p>Bật khi hồ sơ xác nhận các nguồn có sai số chung. Với số liệu hoạt động, chỉ các nguồn có cùng mã nhóm sai số AD được ghép.</p>
      <p>${shared.length ? `Phát hiện ${shared.length} nhóm đầu vào dùng chung. Xem danh sách theo từng nguồn trong sheet <strong>Ra soat DKBDB</strong> khi xuất Excel.` : 'Chưa phát hiện đầu vào dùng chung theo dữ liệu khai báo trong kỳ.'}</p>
      <label class="check-row method-setting"><input name="weightedMix" type="checkbox" ${period.weighted ? 'checked' : ''}>Dùng trọng số khối lượng khi tính u GWP hỗn hợp (giả định các thành phần độc lập)</label><p>Bỏ chọn để đối chiếu với cách tính không trọng số trong Excel cũ. GWP dùng để tính phát thải luôn theo tỷ lệ khối lượng.</p>
    </div>`, form => {
    const from = form.get('gridFrom'), to = form.get('gridTo');
    if (Boolean(from) !== Boolean(to)) throw Error('Nhập cả năm bắt đầu và năm kết thúc.');
    const options = { weighted: form.has('weightedMix'), coverageFactor: Number(form.get('coverageFactor')),
      correlateShared: form.has('correlateShared'), gridFrom: from ? Number(from) : null, gridTo: to ? Number(to) : null };
    if (from && E.gridSeries(options, db).length < 2) throw Error('Chọn khoảng có ít nhất hai năm hệ số điện.');
    return change(next => {
      Object.assign(next.periods.find(item => item.id === period.id), options);
    }, 'Đã lưu thiết lập phương pháp');
  });
  document.querySelector('#modal button[type="submit"]').textContent = 'Lưu thiết lập';
}

function calculationCard(result, index) {
  const row = result.row;
  const expanded = calculationView.expandedId === row.id;
  const scope = row.group === 7 ? 2 : 1;
  const relativeU = result.total ? result.U / result.total * 100 : 0;
  const detailId = 'calculation-detail-' + index;
  const amount = result.amount ?? (row.mode === 'monthly' ? row.months.reduce((sum, value) => sum + value, 0) : row.amount);
  return `<article class="calculation-source-card ${expanded ? 'is-expanded' : ''}">
    <div class="calculation-card-summary">
      <div class="calculation-scope-tile ${scope === 2 ? 'scope-two' : ''}"><span>Phạm vi</span><strong>${scope}</strong></div>
      <div class="calculation-card-info"><h3>${esc(row.name)}</h3><p>${E.groups[row.group]}${row.factor ? ' · ' + esc(row.factor) : ''}</p><span class="sub">${n(amount,2)} ${esc(unit(row))} · u AD ${n(row.ad,4)}%</span>${result.warnings.length || result.error ? '<span class="calculation-card-warning">Có lưu ý cần kiểm tra</span>' : ''}</div>
      <div class="calculation-card-total"><span>Phát thải</span><strong>${result.error ? 'Thiếu hệ số' : n(result.total,4)}${result.error ? '' : ' <span>tCO₂e</span>'}</strong></div>
      <div class="calculation-card-action"><span class="sub">U 95% ± ${n(relativeU)}%</span>${btn(expanded ? 'Thu gọn' : 'Xem chi tiết', 'calc-expand', 'primary small', `data-id="${esc(row.id)}" aria-expanded="${expanded}" aria-controls="${detailId}"`)}</div>
    </div>
    <div class="calculation-card-detail" id="${detailId}" ${expanded ? '' : 'hidden'}>${expanded ? calculationDetail(result) : ''}</div>
  </article>`;
}

function calculationFormulas(result) {
  const { row, amount } = result;
  const period = p();
  const number = value => {
    const digits = value && Math.abs(value) < 0.000001 ? 12 : 6;
    return n(value, digits).replace(/0+$/, '').replace(/,$/, '');
  };
  const step = label => result.steps.find(([name]) => name === label)?.[1];
  const gas = id => db.gases.find(item => item.id === id);
  const gwp = id => gas(id)[period.gwp];
  const parameter = id => db.other.find(item => item.id === id).value;
  const formulas = [];
  const add = (label, rule, values) => formulas.push([label, rule, values]);
  const converted = (label, kg, multiplier, emission) => {
    add(label, 'Khối lượng khí (kg) × GWP‑100 ÷ 1.000', `${number(kg)} × ${number(multiplier)} ÷ 1.000 ≈ ${number(emission)} tCO₂e`);
  };
  if (row.mode === 'monthly') {
    add('Số liệu hoạt động', 'Tổng số liệu 12 tháng', `${number(amount)} ${unit(row)}`);
  }

  if (row.group < 2) {
    const fuel = db.fuels.find(item => item.id === row.factor);
    const kg = step('Khối lượng (kg)');
      const tj = step('Nhiệt lượng (TJ)');
    add('Khối lượng nhiên liệu', 'Số liệu hoạt động × hệ số quy đổi sang kg', `${number(amount)} × ${number(fuel.density)} ≈ ${number(kg)} kg`);
    add('Nhiệt lượng', 'Khối lượng (kg) ÷ 1.000.000 × NCV (TJ/Gg)', `${number(kg)} ÷ 1.000.000 × ${number(fuel.ncv[0])} ≈ ${number(tj)} TJ`);
    const multipliers = [1, gwp(fuel.bio ? 'CH4_BIO' : 'CH4_FOSSIL'), gwp('N2O')];
    ['CO₂', 'CH₄', 'N₂O'].forEach((label, i) => {
      const ef = [fuel.co2, fuel.ch4, fuel.n2o][i][0];
      const bio = i === 0 && fuel.bio;
      const emission = bio ? result.bio : result.gases[i];
      add(bio ? 'CO₂ sinh học báo cáo riêng' : label,
        'Nhiệt lượng (TJ) × EF (kg/TJ) × GWP‑100 ÷ 1.000',
        `${number(tj)} × ${number(ef)} × ${number(multipliers[i])} ÷ 1.000 ≈ ${number(emission)} ${bio ? 'tấn CO₂' : 'tCO₂e'}`);
    });
    add('u tương đối của NCV và EF', 'max(giá trị − cận dưới, cận trên − giá trị) ÷ (2 × giá trị) × 100%',
      `NCV: ${number(step('u NCV (%)'))}% · EF CO₂: ${number(step('u EF CO₂ (%)'))}% · EF CH₄: ${number(step('u EF CH₄ (%)'))}% · EF N₂O: ${number(step('u EF N₂O (%)'))}%`);
  } else if (row.group === 2) {
    const tow = step('TOW (kg BOD)');
    const ef = step('EF (kg CH₄/kg BOD)');
    add('Tải lượng hữu cơ', 'Giờ công ÷ 24 × BOD (g/người/ngày) ÷ 1.000', `${number(amount)} ÷ 24 × ${number(parameter('BOD'))} ÷ 1.000 ≈ ${number(tow)} kg BOD`);
    add('Hệ số phát thải CH₄', 'B₀ × MCF', `${number(parameter('BO_DOM'))} × ${number(parameter(row.mcf))} ≈ ${number(ef)} kg CH₄/kg BOD`);
    add('CH₄', 'Tải lượng hữu cơ × EF × GWP‑100 ÷ 1.000', `${number(tow)} × ${number(ef)} × ${number(gwp('CH4_BIO'))} ÷ 1.000 ≈ ${number(result.gases[1])} tCO₂e`);
  } else if (row.group === 3) {
    add('N₂O', 'Thể tích (m³) × tổng N (kg/m³) × EF × 44/28 × GWP‑100 ÷ 1.000',
      `${number(amount)} × ${number(row.nitrogen)} × ${number(E.industrialEffluentFactor(row, db).value)} × 44/28 × ${number(gwp('N2O'))} ÷ 1.000 ≈ ${number(result.gases[2])} tCO₂e`);
    if (row.includeCH4) {
      add('CH₄', 'Thể tích (m³) × COD (kg/m³) × B₀ × MCF × GWP‑100 ÷ 1.000',
        `${number(amount)} × ${number(row.cod)} × ${number(parameter('BO_IND'))} × ${number(parameter(row.mcf))} × ${number(gwp('CH4_BIO'))} ÷ 1.000 ≈ ${number(result.gases[1])} tCO₂e`);
    }
  } else if (row.group === 4 || row.group === 5) {
    const factor = gas(row.factor);
    const multiplier = step('GWP-100');
    if (factor.mix.length) {
      add('GWP‑100 hỗn hợp', 'Σ(tỷ phần khối lượng × GWP‑100 thành phần)',
        `${factor.mix.map(([id, weight]) => `(${number(weight)} × ${number(gwp(id))})`).join(' + ')} ≈ ${number(multiplier)}`);
    }
    if (row.group === 5 && row.mode === 'annual' && row.factor === 'CO2' && row.pcccInput === 'cylinders') {
      add('Khối lượng CO₂', 'Số bình × kg CO₂ mỗi bình', `${number(row.pcccCount)} × ${number(row.pcccKg)} = ${number(amount)} kg`);
    }
    converted(factor.name, amount, multiplier, result.total);
  } else if (row.group === 6) {
    add('CO₂', 'Lượng dùng (tấn) × EF (tấn C/tấn) × 44/12', `${number(amount)} × ${number(step('EF (tấn C/tấn)'))} × 44/12 ≈ ${number(result.total)} tCO₂e`);
  } else {
    add('Điện mua', 'Điện năng (kWh) ÷ 1.000 × EF điện (tCO₂/MWh)', `${number(amount)} ÷ 1.000 × ${number(step('EF điện (tCO₂/MWh)'))} ≈ ${number(result.total)} tCO₂e`);
  }

  add('Tổng phát thải của nguồn', 'Σ phát thải quy đổi của các khí trong phạm vi kiểm kê', `${result.gases.map(number).join(' + ')} ≈ ${number(result.total)} tCO₂e`);
  add('Độ không đảm bảo chuẩn u', '√Σc², với c là tổng các đóng góp của cùng một đầu vào. Mỗi đóng góp bằng u tương đối (dạng tỷ lệ) × tổng phát thải các khí chịu ảnh hưởng.', `${number(result.u)} tCO₂e`);
  add('Độ không đảm bảo mở rộng U', 'k × u', `${number(E.coverage(period))} × ${number(result.u)} ≈ ${number(result.U)} tCO₂e`);

  return `<section class="calculation-formulas">
    <h4>Công thức áp dụng</h4>
    <dl>${formulas.map(([label, rule, values]) => `<div><dt>${esc(label)}</dt><dd>${esc(rule)}<span>${esc(values)}</span></dd></div>`).join('')}</dl>
  </section>`;
}


function calculationDetail(result) {
  return `${result.error ? '<div class="error-banner">Không tính được: kiểm tra thư viện hệ số.</div>' : ''}
    <div class="calc-grid">${result.steps.map(([label, value]) => `<div class="calc-item">${label}<strong>${n(value,6)}</strong></div>`).join('')}
      <div class="calc-item">u chuẩn (tCO₂e)<strong>${n(result.u,6)}</strong></div>
      <div class="calc-item">U 95% (± tCO₂e)<strong>${n(result.U,6)}</strong></div>
      <div class="calc-item">CO₂ sinh học riêng (tấn)<strong>${n(result.bio,6)}</strong></div>
    </div>
    ${result.error ? '' : calculationFormulas(result)}
    <div class="table-wrap"><table><thead><tr><th>Khí</th><th class="num">Phát thải quy đổi (tCO₂e)</th><th class="num">u tương đối (%)</th><th class="num">u tuyệt đối (tCO₂e)</th></tr></thead><tbody>
      ${['CO₂','CH₄','N₂O','Môi chất / PCCC'].map((label, i) => `<tr><td>${label}</td><td class="num">${n(result.gases[i],6)}</td><td class="num">${n((result.unc[i] || 0) * 100,4)}</td><td class="num">${n(result.gases[i] * (result.unc[i] || 0),6)}</td></tr>`).join('')}
    </tbody></table></div>
    ${source(result.source)}${result.warnings.map(warning => `<div class="note warning">${esc(warning)}</div>`).join('')}`;
}

function refreshCalculations(focusSearch = false) {
  const workspace = document.querySelector('.calculation-workspace');
  if (!workspace) return;
  const start = document.querySelector('#calc-query')?.selectionStart;
  const focusedId = document.activeElement?.id;
  const focusedGroup = document.activeElement?.getAttribute('data-calc-group');
  const sidebarScroll = document.querySelector('.calculation-filters')?.scrollTop || 0;
  const pageScroll = window.scrollY;
  render();
  const sidebar = document.querySelector('.calculation-filters');
  if (sidebar) sidebar.scrollTop = sidebarScroll;
  if (focusSearch) {
    const search = document.querySelector('#calc-query');
    search.focus({ preventScroll: true });
    if (start !== null && start !== undefined) search.setSelectionRange(start, start);
  } else if (focusedId) {
    document.getElementById(focusedId)?.focus({ preventScroll: true });
  } else if (focusedGroup !== null && focusedGroup !== undefined) {
    document.querySelector('[data-calc-group="' + focusedGroup + '"]')?.focus({ preventScroll: true });
  }
  window.scrollTo(0, pageScroll);
}

document.addEventListener('input', event => {
  if (event.target.id !== 'calc-query' || event.isComposing) return;
  calculationView.query = event.target.value;
  calculationView.page = 1;
  refreshCalculations(true);
});

document.addEventListener('compositionend', event => {
  if (event.target.id !== 'calc-query') return;
  calculationView.query = event.target.value;
  calculationView.page = 1;
  refreshCalculations(true);
});

document.addEventListener('change', event => {
  const target = event.target;
  if (target.hasAttribute('data-calc-group')) {
    const group = Number(target.dataset.calcGroup);
    if (target.checked) calculationView.groups.add(group);
    else calculationView.groups.delete(group);
  } else if (target.id === 'calc-scope') calculationView.scope = target.value;
  else if (target.id === 'calc-warnings') calculationView.warningsOnly = target.checked;
  else if (target.id === 'calc-sort') calculationView.sort = target.value;
  else return;
  calculationView.page = 1;
  refreshCalculations();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action^="calc-"]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'calc-method': calculationMethodDialog(); return;
    case 'calc-effluent-preview': effluentPreviewDialog(); return;
    case 'calc-clear':
      Object.assign(calculationView, { query: '', scope: 'all', groups: new Set(), warningsOnly: false, page: 1 });
      break;
    case 'calc-layout': calculationView.layout = button.dataset.layout; break;
    case 'calc-page': calculationView.page = Math.max(1, Number(button.dataset.page)); break;
    case 'calc-expand': calculationView.expandedId = calculationView.expandedId === button.dataset.id ? null : button.dataset.id; break;
    default: return;
  }
  const action = button.dataset.action;
  const selected = button.dataset.id;
  refreshCalculations();
  if (action === 'calc-page') document.querySelector('.calculation-results-heading')?.scrollIntoView({ block: 'start' });
  if (action === 'calc-expand') {
    const toggles = [...document.querySelectorAll('[data-action="calc-expand"]')];
    const toggle = toggles.find(item => item.dataset.id === selected);
    toggle?.focus({ preventScroll: true });
  }
});
