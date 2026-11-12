'use strict';

const fuelTemplateIds = [
  ['DO_STAT', 'LPG_STAT', 'GAS_STAT', 'COAL_SUB', 'ACETYLEN', 'NAT_GAS', 'BIOMASS', 'SLUDGE_DRY', 'LPG_COMM', 'DO_COMM'],
  ['DO_ROAD', 'GAS_UNCTRL', 'GAS_CAT', 'GAS_LDV95', 'DO_OFFROAD', 'GAS_4S_OFF', 'GAS_2S_OFF'],
];
const gasTemplateIds = ['CO2', 'CH4_FOSSIL', 'CH4_BIO', 'N2O', 'HFC_32', 'HFC_125', 'HCFC_22', 'HFC_134A', 'HFC_143A', 'HFC_227EA'];
const parameterTemplateIds = ['BOD', 'BO_DOM', 'MCF_SEPTIC', 'MCF_AERO', 'MCF_OVER', 'MCF_ANA', 'BO_IND', 'EF_N', 'PERSON', 'UREA', '', '', '', 'LIME'];
const fixedGasIds = new Set(['CO2', 'CH4_FOSSIL', 'CH4_BIO', 'N2O', 'HCFC_22', 'HFC_125', 'HFC_143A', 'HFC_134A', 'HFC_32']);

const ipccFuelAliases = {
  Anthracite: ['IPCC22_ANTHRACITE', 'Than antraxit'],
  'Other Bituminous Coal': ['IPCC22_BITUMINOUS', 'Than bitum khác'],
  'Sub-Bituminous Coal': ['IPCC22_SUBBITUMINOUS', 'Than á bitum'],
  Lignite: ['IPCC22_LIGNITE', 'Than nâu'],
  'Coking Coal': ['IPCC22_COKING', 'Than luyện cốc'],
  'Residual Fuel Oil': ['IPCC22_RESIDUAL', 'Dầu FO'],
  'Petroleum Coke': ['IPCC22_PETCOKE', 'Cốc dầu mỏ'],
  'Gas/Diesel Oil': ['IPCC22_DIESEL', 'Dầu DO'],
  'Liquefied Petroleum Gases': ['IPCC22_LPG', 'Khí hóa lỏng LPG'],
  'Motor Gasoline': ['IPCC22_GASOLINE', 'Xăng động cơ'],
  'Natural Gas': ['IPCC22_NATURAL_GAS', 'Khí tự nhiên'],
  'Wood/Wood Waste': ['IPCC22_WOOD', 'Gỗ và phế phẩm gỗ'],
  'Industrial Wastes': ['IPCC22_INDUSTRIAL_WASTE', 'Chất thải công nghiệp'],
};

const energyFuelTemplates = ipccFuelRows.map(([name, ncv, ncvPage, co2, ch4, n2o, efPage]) => {
  const [id, alias] = ipccFuelAliases[name] || ['IPCC22_' + name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_$/, '')];
  const bio = /^(Wood\/Wood Waste|Sulphite lyes|Other Primary Solid Biomass|Charcoal|Biogasoline|Biodiesels|Other Liquid Biofuels|Landfill Gas|Sludge Gas|Other Biogas|Municipal Wastes \(biomass fraction\))/.test(name);
  const ncvSource = ncv[0] === null ? ' Bảng 1.2 ghi NA. Bổ sung NCV và nguồn đo trước khi lưu.' : '';
  return {
    id, name: alias ? alias + ' · ' + name : name, ncv, co2, ch4, n2o, density: 1, unit: 'Kg', type: 'stationary', bio,
    source: 'IPCC 2006, Quyển 2: Bảng 1.2 (tr.' + ncvPage + ' PDF), Bảng 2.2 đốt cố định ngành năng lượng (tr.' + efPage + ' PDF). Số liệu hoạt động nhập theo kg.' + ncvSource,
  };
});

function missingIpccFuels(database) {
  const existing = new Set(database.fuels.map(fuel => fuel.id));
  return energyFuelTemplates.filter(entry => entry.ncv.every(Number.isFinite) && !existing.has(entry.id));
}

function mergeIpccFuels(database) {
  if (!Array.isArray(database?.fuels) || database.ipccFuelLibraryVersion === 1) return database;
  database.fuels.push(...structuredClone(missingIpccFuels(database)));
  database.ipccFuelLibraryVersion = 1;
  return database;
}

function useFactorTemplate(template) {
  const entry = structuredClone(template);
  const existing = reusableTemplate(library, entry);
  if (existing) { factorDialog(existing.id); return; }
  const root = entry.id;
  let suffix = 2;
  while (db[library].some(factor => factor.id === entry.id)) entry.id = `${root}_${suffix++}`;
  factorDialog(undefined, entry);
}

function workbookFactorSource(section, index, source) {
  return `${source} · Excel ${section.sheet}, dòng ${section.start + index}`;
}

function listedFactorTemplates(group) {
  if (group === 'fuels') {
    return [
      { label: 'IPCC 2006 · Ngành năng lượng · Bảng 1.2 và 2.2', entries: energyFuelTemplates },
      ...factorWorkbook.fuels.map((section, sectionIndex) => ({
        label: 'Excel · ' + section.title,
        entries: section.rows.map((row, index) => {
          const id = fuelTemplateIds[sectionIndex][index];
          return {
            id, name: row[1], unit: row[2], density: row[3],
            type: sectionIndex === 0 ? 'stationary' : 'mobile',
            bio: id === 'BIOMASS' || id === 'SLUDGE_DRY',
            ncv: row.slice(4, 7), co2: row.slice(8, 11), ch4: row.slice(11, 14), n2o: row.slice(14, 17),
            source: workbookFactorSource(section, index, row[17]),
          };
        }),
      })),
    ];
  }
  if (group === 'gases') {
    const [pure, mixtures] = factorWorkbook.gases;
    const singles = pure.rows.map((row, index) => ({
      id: gasTemplateIds[index], name: row[1], ar4: row[3], ar5: row[4], ar6: row[5], u: row[7], mix: [],
      source: workbookFactorSource(pure, index, row[10]),
    }));
    const blends = mixtures.rows.flatMap((row, index) => {
      const parts = [1, 5, 9].filter(col => row[col + 1] > 0).map(col => {
        const component = singles[pure.rows.findIndex(p => p[0] === row[col])];
        return [component, row[col + 1]];
      });
      if (parts.length < 2 || parts.some(([gas]) => !db.gases.some(g => g.id === gas.id))) return [];
      const gwp = edition => parts.reduce((sum, [gas, fraction]) => sum + gas[edition] * fraction, 0);
      return [{
        id: row[0], name: row[0], ar4: gwp('ar4'), ar5: gwp('ar5'), ar6: gwp('ar6'), u: row[14],
        mix: parts.map(([gas, fraction]) => [gas.id, fraction]), source: workbookFactorSource(mixtures, index, row[16]),
      }];
    });
    return [{ label: 'Excel · GWP-100', entries: singles }, { label: 'Excel · Hỗn hợp môi chất', entries: blends }];
  }
  const [section] = factorWorkbook[group];
  const calculationDefaults = group === 'other' ? E.seed().other : [];
  const entries = section.rows.flatMap((row, index) => {
    const id = group === 'grid' ? (/^GRID_\d{4}$/.test(row[0]) ? row[0] : '') : parameterTemplateIds[index];
    if (!id) return [];
    const entry = { id, name: row[1], unit: row[2], value: row[3], source: workbookFactorSource(section, index, row[7]) };
    if (group === 'grid') entry.year = Number(id.slice(5));
    else {
      // Keep the app's established Tier 1 settings for parameters tied to the calculation model.
      const standard = calculationDefaults.find(factor => factor.id === id);
      if (standard) Object.assign(entry, { u: standard.u, source: entry.source + ' · u áp dụng: ' + standard.source });
    }
    return [entry];
  });
  return [{ label: 'Excel · ' + section.title, entries }];
}

function reusableTemplate(group, entry) {
  if (group === 'grid') return db.grid.find(factor => factor.year === entry.year);
  if (group === 'fuels' && entry.id.startsWith('IPCC22_')) return db.fuels.find(factor => factor.id === entry.id);
  if (group === 'other' || (group === 'gases' && fixedGasIds.has(entry.id))) return db[group].find(factor => factor.id === entry.id);
  return null;
}

function openFactorTemplate() {
  const group = library;
  const sections = listedFactorTemplates(group);
  const entries = sections.flatMap(section => section.entries);
  const options = sections.map(section => `<optgroup label="${esc(section.label)}">${section.entries.map(entry =>
    `<option value="${entries.indexOf(entry)}">${esc(entry.name)}${entry.ncv?.[0] === null ? ' · cần NCV' : ''}${reusableTemplate(group, entry) ? ' · đã có trong thư viện' : ''}</option>`
  ).join('')}</optgroup>`).join('');
  modal('Thêm hệ số', `<p class="sub">Chọn mẫu để điền thông số và nguồn trích dẫn. Bạn có thể kiểm tra lại trước khi lưu.</p>
    <label class="field">Mẫu theo tài liệu<select id="new-factor-template"><option value="">Chọn hệ số…</option>${options}</select></label>
    <p class="sub">Mẫu đánh dấu “đã có trong thư viện” sẽ mở hệ số đang áp dụng.</p>`, () => false);
  const dialog = document.querySelector('#modal');
  const selector = dialog.querySelector('#new-factor-template');
  const manual = dialog.querySelector('button[type="submit"]');
  manual.type = 'button';
  manual.textContent = 'Nhập thủ công';
  manual.addEventListener('click', () => {
    dialog.close();
    factorDialog();
  });
  selector.addEventListener('change', () => {
    if (!selector.value) return;
    dialog.close();
    useFactorTemplate(entries[Number(selector.value)]);
  });
  selector.focus();
}
