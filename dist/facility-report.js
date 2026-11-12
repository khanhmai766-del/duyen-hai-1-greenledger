'use strict';

const reliabilityCriteria = [
  ['objective', 'Căn cứ xác nhận khách quan', 'Có xác nhận độc lập, thiết bị theo dõi hoặc quy trình nội bộ ghi nhận và lưu trữ.'],
  ['detail', 'Độ chi tiết và tính đại diện', 'Có số liệu theo thời gian hoặc theo giao dịch và đại diện cho kỳ kiểm kê.'],
  ['crosscheck', 'Đối chứng tính phù hợp', 'Có dữ liệu đối chứng và kết quả kiểm tra cho thấy số liệu hoạt động phù hợp.'],
];
const activityRatingOptions = [
  ['', 'Chưa đánh giá'], [1, '1 · Đo bằng thiết bị hoặc bộ đếm'],
  [2, '2 · Thống kê từ hóa đơn, chứng từ hoặc hệ thống nội bộ'],
  [3, '3 · Tính, phân bổ hoặc ước tính có căn cứ'], [4, '4 · Ước lượng chủ quan, thiếu căn cứ'],
];
const factorRatingOptions = [
  ['', 'Chưa đánh giá'], [1, '1 · Hệ số riêng của cơ sở có căn cứ khoa học'],
  [2, '2 · Hệ số phù hợp đặc thù quốc gia'], [3, '3 · Hệ số quốc tế được công nhận'],
  [4, '4 · Hệ số ước lượng thiếu căn cứ'],
];
const reliabilityChecks = [['', 'Chưa đánh giá'], ['pass', 'Đạt'], ['fail', 'Không đạt']];
const facilityProfileSections = [
  ['Bìa và thông tin cơ sở', [
    ['place', 'Địa danh lập báo cáo'], ['date', 'Ngày lập báo cáo', 'date'], ['tax', 'Mã số thuế'],
    ['project', 'Giấy chứng nhận đăng ký đầu tư'], ['environmentPermit', 'Giấy phép môi trường'],
    ['delegation', 'Thông tin ủy quyền và chức vụ'], ['production', 'Sản lượng, công suất và nhân sự', 'textarea'],
  ]],
  ['Tổ chức kiểm kê và hoạt động', [
    ['organization', 'Tổ chức thực hiện kiểm kê', 'textarea'], ['infrastructure', 'Cơ sở hạ tầng và công nghệ', 'textarea'],
    ['sinks', 'Thông tin về bể hấp thụ', 'textarea'], ['dataSystem', 'Hệ thống dữ liệu và bộ phận quản lý', 'textarea'],
    ['limitations', 'Hạn chế trong thu thập và lưu trữ dữ liệu', 'textarea'],
  ]],
  ['Kiểm soát chất lượng và hoàn thiện báo cáo', [
    ['quality', 'Kiểm soát và bảo đảm chất lượng (QA/QC)', 'textarea'],
    ['completeness', 'Đánh giá tính đầy đủ, tính đại diện và các ngoại lệ', 'textarea'],
    ['conclusion', 'Kết luận và kế hoạch cải thiện', 'textarea'],
    ['references', 'Văn bản pháp lý và tài liệu áp dụng', 'textarea'], ['consultant', 'Đơn vị tư vấn (nếu có)'],
  ]],
];

function reliabilityFields(source) {
  const value = source.reliability || {};
  return `<details class="span2 source-review"><summary>Đánh giá độ tin cậy dữ liệu</summary>
    <div class="form-grid">
      ${selectField('Điểm dữ liệu hoạt động', 'qualityActivity', activityRatingOptions, value.activity ?? '')}
      ${selectField('Điểm hệ số phát thải', 'qualityFactor', factorRatingOptions, value.factor ?? '')}
      ${reliabilityCriteria.map(([key, label, guidance]) => `<div>${selectField(label, 'quality-' + key, reliabilityChecks, value[key] ?? '')}<small class="source-text">${guidance}</small></div>`).join('')}
      <label class="field span2">Căn cứ và nhận xét đánh giá<textarea name="qualityNote" maxlength="3000">${esc(value.note)}</textarea></label>
    </div>
    <p class="source-text" data-quality-preview aria-live="polite"></p>
  </details>`;
}

function readReliability(data) {
  const validPoint = name => {
    const value = Number(data.get(name));
    return [1, 2, 3, 4].includes(value) ? value : null;
  };
  return { activity: validPoint('qualityActivity'), factor: validPoint('qualityFactor'),
    ...Object.fromEntries(reliabilityCriteria.map(([key]) => [key, data.get('quality-' + key) || ''])),
    note: String(data.get('qualityNote') || '').trim() };
}

function bindReliability(form) {
  const output = form.querySelector('[data-quality-preview]');
  const update = () => {
    const result = E.assessReliability(readReliability(new FormData(form)));
    output.textContent = 'Xếp cấp A–D: ' + (result.grade ? result.grade + ' (' + n(result.score, 2) + ' điểm)' : 'Chưa đánh giá đủ')
      + ' · Ba tiêu chí theo mẫu Word: ' + (result.level === null ? 'Chưa đánh giá đủ' : result.passed + '/3 đạt · ' + result.level);
  };
  output.closest('details').addEventListener('change', update);
  update();
}

function openFacilityProfile() {
  const period = p();
  const profile = period.reportProfile || {};
  modal('Thông tin bổ sung cho báo cáo', facilityProfileSections.map(([title, fields]) => `
    <fieldset class="report-profile"><legend>${title}</legend><div class="form-grid">${fields.map(([id, label, type]) =>
      type === 'textarea' ? `<label class="field span2">${label}<textarea name="${id}" maxlength="6000">${esc(profile[id])}</textarea></label>`
        : field(label, id, profile[id], type || 'text', type ? '' : 'maxlength="250"')).join('')}</div></fieldset>`).join(''), data => {
    const values = Object.fromEntries(facilityProfileSections.flatMap(([, fields]) =>
      fields.map(([id]) => [id, String(data.get(id) || '').trim()])));
    return change(next => {
      next.periods.find(item => item.id === period.id).reportProfile = values;
    }, 'Đã lưu thông tin báo cáo');
  }, true);
}

function facilityTable(caption, headings, rows) {
  return `<table class="facility-table"><caption>${esc(caption)}</caption>
    <thead><tr>${headings.map(item => `<th scope="col">${esc(item)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${headings.length}">Chưa có nguồn được khai báo</td></tr>`}</tbody></table>`;
}

function facilityReport(summary) {
  const period = p();
  const profile = period.reportProfile || {};
  const missing = 'Chưa khai báo';
  const content = value => esc(value || missing);
  const review = E.reliabilitySummary(summary.rows);
  const number = value => n(value, 4);
  const percent = (value, total) => total > 0 ? n(value / total * 100, 2) + '%' : '—';
  const scope = row => row.group === 7 ? 2 : 1;
  const units = row => row.group < 2 ? db.fuels.find(fuel => fuel.id === row.factor)?.unit || '—'
    : ['giờ công', 'm³', 'kg', 'kg', 'tấn', 'kWh'][row.group - 2];
  const sourceRows = summary.rows.map(result => {
    const {row} = result;
    return [row.name, scope(row), E.groups[row.group], result.error ? 'Lỗi dữ liệu' : number(result.amount),
      units(row), row.evidence || missing, result.source || missing];
  });
  const reviewedRows = summary.rows.map(({row}) => {
    const state = E.assessReliability(row.reliability);
    const data = row.reliability || {};
    const status = key => reliabilityChecks.find(([value]) => value === data[key])?.[1] || 'Chưa đánh giá';
    return [row.name, data.activity ?? '—', data.factor ?? '—', state.score === null ? '—' : n(state.score, 2), state.grade ?? 'Chưa đủ',
      ...reliabilityCriteria.map(([key]) => status(key)), state.level ?? 'Chưa đủ', data.note || '—'];
  });
  const resultRow = (label, results) => {
    const total = results.reduce((sum, item) => sum + item.total, 0);
    const U = E.combineUncertainty(results) * summary.k;
    return [label, ...[0,1,2,3].map(index => number(results.reduce((sum, item) => sum + item.gases[index], 0))),
      number(total), percent(total, summary.total), number(U), percent(U, total)];
  };
  const aggregateRows = [1,2].flatMap(value => {
    const results = summary.rows.filter(({row,error}) => scope(row) === value && !error);
    const groups = [...new Set(results.map(({row}) => row.group))];
    return [resultRow('Phạm vi ' + value, results), ...groups.map(group =>
      resultRow(E.groups[group], results.filter(({row}) => row.group === group)))];
  });
  const usedFuel = new Set(summary.rows.filter(({row}) => row.group < 2).map(({row}) => row.factor));
  const usedGrid = new Set(summary.rows.filter(({row}) => row.group === 7).map(({row}) => row.factor));
  const terms = summary.rows.flatMap(result => result.terms || []);
  const usedOther = new Set(terms.filter(term => term.kind === 'other').map(term => term.id));
  const usedGas = new Set([
    ...terms.filter(term => term.kind === 'gwp' || term.kind === 'blend').map(term => term.id),
    ...summary.rows.filter(({row}) => [4, 5].includes(row.group)).map(({row}) => row.factor),
  ]);
  const factorRows = [
    ...db.fuels.filter(item => usedFuel.has(item.id)).map(item => [item.name, item.id,
      'NCV ' + number(item.ncv[0]) + ' TJ/Gg · EF CO₂ / CH₄ / N₂O: ' + [item.co2, item.ch4, item.n2o].map(values => number(values[0])).join(' / ') + ' kg/TJ', item.source]),
    ...db.grid.filter(item => usedGrid.has(item.id)).map(item => ['Điện lưới ' + item.year, item.id, number(item.value) + ' tCO₂e/MWh', item.source]),
    ...db.other.filter(item => usedOther.has(item.id)).map(item => [item.name, item.id, number(item.value) + ' ' + item.unit, item.source]),
    ...db.gases.filter(item => usedGas.has(item.id)).map(item => {
      const gwp = item.mix.length ? item.mix.reduce((total, [id, weight]) => total + weight * (db.gases.find(gas => gas.id === id)?.[period.gwp] || 0), 0) : item[period.gwp];
      return [item.name, item.id, 'GWP-100 ' + number(gwp), item.source];
    }),
  ];
  const warnings = [...new Set(summary.rows.flatMap(result => result.warnings || []))];
  const displayDate = profile.date ? String(profile.date).split('-').reverse().join('/') : '';
  return `<article class="panel facility-report" id="report-sheet">
    <div class="no-print actions">${btn('Thông tin báo cáo', 'facility-profile')}${btn('In / Lưu PDF', 'print', 'primary')}</div>
    <header class="facility-cover">
      <div class="facility-letterhead"><strong>${content(period.facility)}</strong>
        <div><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>Độc lập - Tự do - Hạnh phúc</div></div>
      <h1>Báo cáo kết quả kiểm kê khí nhà kính</h1>
      <p>Năm ${esc(period.year)}</p>
      <p class="facility-date">${content([profile.place, displayDate].filter(Boolean).join(', '))}</p>
    </header>
    <section class="facility-section"><h2>Mở đầu</h2><h3>1. Căn cứ pháp lý và kỹ thuật</h3><p>${content(profile.references)}</p>
      <h3>2. Tổ chức thực hiện kiểm kê</h3><p>${content(profile.organization)}</p></section>
    <section class="facility-section"><h2>Phần I. Thông tin của cơ sở</h2>
      ${facilityTable('Thông tin nhận diện cơ sở', ['Nội dung','Thông tin'], [
        ['Tên cơ sở', period.facility], ['Địa chỉ', period.address], ['Mã số thuế', profile.tax],
        ['Đăng ký doanh nghiệp', period.license], ['Đăng ký đầu tư', profile.project], ['Giấy phép môi trường', profile.environmentPermit],
        ['Người đại diện pháp luật', period.representative], ['Đầu mối phụ trách', period.contact],
        ['Ủy quyền và chức vụ', profile.delegation], ['Lĩnh vực sản xuất, kinh doanh', period.sector],
      ].map(([label, value]) => [label, value || missing]))}
      <h3>Sản lượng, công suất và nhân sự</h3><p>${content(profile.production)}</p>
    </section>
    <section class="facility-section"><h2>Phần II. Hoạt động sản xuất, kinh doanh và số liệu</h2>
      <h3>1. Ranh giới và phạm vi</h3><p>${content(period.boundary)}</p>
      <h3>2. Cơ sở hạ tầng, công nghệ và hoạt động</h3><p>${content(profile.infrastructure || period.operations)}</p>
      <h3>3. Nguồn phát thải và bể hấp thụ</h3><p>${content(profile.sinks)}</p>
      <h3>4. Hệ thống thông tin, dữ liệu và hạn chế</h3><p>${content(profile.dataSystem)}</p><p>${content(profile.limitations)}</p>
    </section>
    <section class="facility-section"><h2>Phần III. Kết quả thực hiện kiểm kê</h2>
      <h3>1. Phương pháp, thu thập số liệu và hệ số phát thải</h3>
      <p>Tính theo số liệu hoạt động và hệ số theo từng nguồn. Quy đổi theo GWP-100 ${esc(period.gwp.toUpperCase())}. Nguồn hệ số và chứng từ được liệt kê theo dòng nguồn.</p>
      <h3>2. Số liệu hoạt động</h3>
      ${facilityTable('Số liệu hoạt động và chứng từ', ['Dòng nguồn','Phạm vi','Nhóm','Số liệu','ĐVT','Chứng từ','Nguồn hệ số'], sourceRows)}
      <h3>3. Kết quả kiểm kê</h3>
      ${facilityTable('Phát thải và ĐKĐBĐ theo phạm vi, nhóm nguồn (tCO₂e)', ['Phạm vi / nhóm','CO₂','CH₄','N₂O','Môi chất','Tổng','Tỷ lệ','U (±)','U (%)'],
        [...aggregateRows, resultRow('Tổng kiểm kê', summary.rows.filter(result => !result.error))])}
      ${facilityTable('Kết quả và ĐKĐBĐ theo dòng nguồn', ['Dòng nguồn','Phạm vi','Phát thải (tCO₂e)','U (± tCO₂e)','U (%)'],
        summary.rows.map(({row,total,U,error}) => [row.name,scope(row),error ? 'Lỗi dữ liệu' : number(total),error ? '—' : number(U),percent(U,total)]))}
      <p>CO₂ sinh học báo cáo riêng: ${number(summary.bio)} tấn CO₂. Hệ số phủ k = ${n(summary.k, 2)}. ${period.correlateShared ? 'Áp dụng tương quan +1 cho các đầu vào được ghép theo mã.' : 'Tổng hợp độc lập giữa các nguồn.'}</p>
      ${warnings.length ? `<ul>${warnings.map(warning => `<li>${esc(warning)}</li>`).join('')}</ul>` : ''}
      <h3>4. Độ tin cậy, tính đầy đủ và độ không chắc chắn</h3>
      <p>QA/QC: ${content(profile.quality)}</p>
      <p>Đã đánh giá đủ cả hai phương pháp cho ${review.complete}/${review.count} nguồn${review.coverage === null ? '' : ', chiếm ' + n(review.coverage * 100, 2) + '% phát thải đã tính'}.</p>
      <p>Ứng dụng gộp điểm theo x = √(điểm dữ liệu² + điểm hệ số²), suy ra từ các ngưỡng của slide. Làm tròn 2 chữ số trước khi xếp cấp A ≤ 2,24, B ≤ 4,24, C ≤ 5,00 và D &gt; 5,00. Theo mẫu Word, 3/3 đạt là Cao, 2/3 là Trung bình, 1/3 là Thấp, 0/3 là Không có độ tin cậy.</p>
      ${facilityTable('Đánh giá độ tin cậy theo dòng nguồn', ['Dòng nguồn','Điểm dữ liệu','Điểm EF','Điểm x','Cấp','Căn cứ','Chi tiết','Đối chứng','Mức theo Word','Nhận xét'], reviewedRows)}
      <p>Tính đầy đủ và ngoại lệ: ${content(profile.completeness)}</p>
      <h3>Kết luận</h3><p>${content(profile.conclusion || period.notes)}</p>
      <div class="facility-signatures">${profile.consultant ? `<div><strong>Đơn vị tư vấn</strong><p>${content(profile.consultant)}</p></div>` : ''}<div><strong>Đại diện cơ sở</strong><p>${content(period.representative)}</p><em>Ký và ghi rõ họ tên, chức vụ</em></div></div>
    </section>
    <section class="facility-section"><h2>Phụ lục I. Các hệ số và giá trị</h2>
      ${facilityTable('Hệ số sử dụng trong kỳ', ['Hệ số / thông số','Mã','Giá trị','Nguồn tham chiếu'],factorRows)}
      <p>Giá trị hệ số, dữ liệu đầu vào và các bước tính chi tiết được đính kèm trong tệp Excel.</p>
    </section>
    <section class="facility-section"><h2>Phụ lục II. Văn bản pháp lý và tài liệu</h2><p>${content(profile.references)}</p></section>
  </article>`;
}
