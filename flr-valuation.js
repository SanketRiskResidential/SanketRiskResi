// Full Residential valuation inputs (e2Value FLR estimator).
// Needs flr-spec.js (generated from FLR.xsd) loaded first. The host page supplies the
// basics it already collects (address, postal code, year built, sq ft, storeys) through
// FlrVal.render(hostId, getBasics). Sends JSON in the same shape the Lambda serialises.
(function () {
  var SPEC = window.FLR_SPEC, ENUMS = window.FLR_ENUMS, EXTRA = window.FLR_EXTRA;
  var byName = {}; SPEC.forEach(function (d) { byName[d.n] = d; });
  var getBasics = function () { return {}; };

  var LABELS = {
    locale: 'Locale (up to 5)', coverage_a: 'Coverage A — insured amount (enter 0 if unknown)', architectural_style: 'Architectural Style',
    primary_exterior: 'Primary Exterior', secondary_exterior: 'Secondary Exterior', primary_roof_covering: 'Primary Roof Covering',
    secondary_roof_covering: 'Secondary Roof Covering', roof_age: 'Roof Age (years)', foundation_type: 'Foundation Type',
    number_of_baths_full: 'Full Bathrooms', number_of_baths_half: 'Half Bathrooms', bath_countertops: 'Bathroom Countertops',
    tub_and_showers: 'Tubs & Showers', average_wall_height: 'Average Wall Height (ft)', number_of_fireplaces: 'Number of Fireplaces',
    fireplace_mantels: 'Fireplace Mantels', hvac: 'Heating / Cooling (HVAC)', recent_renovations: 'Recent Renovations',
    historic_registry: 'Historic Registry', replacement_cost_type: 'Replacement Cost Type'
  };
  var GROUPS = [
    { t: 'Property', open: true, f: ['locale', 'coverage_a', 'architectural_style', 'construction_quality', 'physical_shape', 'construction_type', 'recent_renovations', 'historic_registry'] },
    { t: 'Roof, Exterior & Foundation', open: true, f: ['primary_exterior', 'secondary_exterior', 'primary_roof_covering', 'secondary_roof_covering', 'roof_configuration', 'roof_pitch', 'roof_age', 'foundation_type', 'slope_of_site'] },
    { t: 'Other Areas (garage, deck, basement, etc.)', rows: 'areas' },
    { t: 'Windows & Chimneys', f: ['window_styles', 'window_brands'], custom: 'chimneys' },
    { t: 'Kitchens & Appliances', rows: 'kitchens', rows2: 'appliances' },
    { t: 'Bathrooms', f: ['number_of_baths_full', 'number_of_baths_half', 'bathroom_floors', 'vanities', 'bath_countertops', 'plumbing_fixtures', 'tub_and_showers'] },
    { t: 'Floors, Walls & Ceilings', f: ['primary_floor_coverings', 'secondary_floor_coverings', 'primary_interior_wall_construction', 'secondary_interior_wall_construction', 'average_wall_height', 'ceiling_construction', 'primary_interior_wall_coverings', 'secondary_interior_wall_coverings'] },
    { t: 'Trim, Doors & Lighting', f: ['wall_trim', 'door_types', 'door_hardware_types', 'rooms_with_cabinetry', 'lighting_fixtures'] },
    { t: 'Fireplaces, Stairs & Systems', f: ['number_of_fireplaces', 'fireplace_mantels', 'staircases', 'miscellaneous', 'alarms', 'hvac'] },
    { t: 'Unique Items', rows: 'unique' },
    { t: 'Cost Basis & Actual Cash Value', f: ['replacement_cost_type'], custom: 'acv' }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function label(n) { return LABELS[n] || n.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function opts(en, blank) { return (blank === false ? '' : '<option value="">— Select —</option>') + ENUMS[en].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join(''); }
  function el(id) { return document.getElementById(id); }
  var INP = 'padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);font-family:inherit;font-size:13px;width:100%;';

  function fieldHtml(d) {
    var id = 'flr-' + d.n, req = d.req ? ' *' : '', lab = '<label>' + esc(label(d.n)) + req + '</label>';
    if (d.t === 'enum') return '<div class="field"><label>' + esc(label(d.n)) + req + '</label><select id="' + id + '">' + opts(d.e) + '</select></div>';
    if (d.t === 'int' || d.t === 'dec') return '<div class="field">' + lab + '<input id="' + id + '" type="number" min="0"' + (d.maxInclusive ? ' max="' + d.maxInclusive + '"' : '') + '></div>';
    if (d.t === 'rep' || d.t === 'list') {
      var max = d.max === 'unbounded' ? 0 : parseInt(d.max, 10);
      return '<div class="field full">' + lab + '<div class="flr-pk" id="' + id + '" data-max="' + max + '"><div class="flr-chips"></div>' +
        '<select onchange="FlrVal.pickAdd(this)">' + '<option value="">＋ Add…</option>' + ENUMS[d.e].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div></div>';
    }
    return '';
  }
  function chipHtml(v) { return '<span class="flr-chip" data-v="' + esc(v) + '">' + esc(v) + ' <b onclick="FlrVal.pickDel(this)">✕</b></span>'; }

  // ---- row editors ----
  var ROWS = {
    areas: { host: 'flr-rows-areas', add: 'Add area', cols: [
      { k: 'name', ph: 'Area', en: 'tAREANAME' }, { k: 'year', ph: 'Year built', num: 1 }, { k: 'sqft', ph: 'Sq ft', num: 1 }] },
    appliances: { host: 'flr-rows-appliances', add: 'Add appliance', cols: [
      { k: 'name', ph: 'Appliance', en: 'tAPPLICANCENAME' }, { k: 'brand', ph: 'Brand', en: 'tAPPLICANCEBRAND' }, { k: 'qty', ph: 'Qty', num: 1 }] },
    unique: { host: 'flr-rows-unique', add: 'Add unique item', cols: [
      { k: 'name', ph: 'Item description' }, { k: 'cost', ph: 'Cost ($)', num: 1 }] },
    kitchens: { host: 'flr-rows-kitchens', add: 'Add kitchen', cols: [
      { k: 'area', ph: 'Area of home', en: 'tAREANAME' }, { k: 'cab', ph: 'Cabinetry', en: 'tCABINETRY' }, { k: 'top', ph: 'Countertops', en: 'tCOUNTERTOPS' },
      { k: 'back', ph: 'Backsplash', en: 'tBLACKSPLASHES' }, { k: 'island', ph: 'Centre island?', en: '__yes' },
      { k: 'icab', ph: 'Island cabinetry', en: 'tCABINETRY' }, { k: 'itop', ph: 'Island countertops', en: 'tCOUNTERTOPS' }] }
  };
  function cell(c) {
    if (c.en === '__yes') return '<select class="r-' + c.k + '" style="' + INP + '"><option value="">Centre island: no</option><option value="yes">Centre island: yes</option></select>';
    if (c.en) return '<select class="r-' + c.k + '" style="' + INP + '"><option value="">' + esc(c.ph) + '</option>' + ENUMS[c.en].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    return '<input class="r-' + c.k + '" ' + (c.num ? 'type="number" min="0"' : 'type="text"') + ' placeholder="' + esc(c.ph) + '" style="' + INP + '">';
  }
  function addRow(key, vals) {
    var R = ROWS[key], row = document.createElement('div');
    row.className = 'flr-row';
    row.innerHTML = R.cols.map(cell).join('') + '<button type="button" class="btn-del-rec" onclick="this.parentNode.remove()">✕</button>';
    el(R.host).appendChild(row);
    if (vals) R.cols.forEach(function (c) { var x = row.querySelector('.r-' + c.k); if (x && vals[c.k] != null) x.value = vals[c.k]; });
  }
  function readRows(key) {
    var R = ROWS[key], out = [];
    document.querySelectorAll('#' + R.host + ' .flr-row').forEach(function (row) {
      var o = {}, any = false;
      R.cols.forEach(function (c) { o[c.k] = row.querySelector('.r-' + c.k).value.trim(); if (o[c.k]) any = true; });
      if (any) out.push(o);
    });
    return out;
  }

  function render(hostId, basicsFn) {
    if (basicsFn) getBasics = basicsFn;
    var host = el(hostId); if (!host) return;
    var html = '<style>.flr-pk{border:1px solid var(--border);border-radius:7px;background:var(--bg);padding:6px;}.flr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}' +
      '.flr-chip{background:var(--navy);color:#fff;border-radius:16px;padding:4px 10px;font-size:12px;}.flr-chip b{cursor:pointer;margin-left:4px;opacity:.8;}' +
      '.flr-pk select{width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:#fff;font-family:inherit;font-size:13px;}' +
      '.flr-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr)) auto;gap:8px;margin-bottom:10px;align-items:center;padding-bottom:10px;border-bottom:1px dashed var(--border);}' +
      '.flr-sec{border:1px solid var(--border);border-radius:8px;margin-bottom:10px;background:#fff;}.flr-sec>summary{cursor:pointer;padding:11px 14px;font-weight:600;font-size:13.5px;}.flr-sec>div{padding:4px 14px 14px;}</style>';
    html += '<p style="font-size:12.5px;color:var(--slate);margin-bottom:12px;">Uses the address, postal code, year built, square footage and storeys entered under Property Basics. e2Value advises that the more of these details are completed, the more accurate the replacement cost. Fields marked * are required. Valuation figures are not shared with the AI review.</p>';
    GROUPS.forEach(function (g) {
      var inner = '';
      if (g.f) inner += '<div class="form-grid">' + g.f.map(function (n) { return fieldHtml(byName[n]); }).join('') + '</div>';
      if (g.custom === 'chimneys') inner += '<div class="form-grid" style="margin-top:10px;"><div class="field"><label>Number of Chimneys</label><input id="flr-chim-n" type="number" min="1" max="20"></div>' +
        '<div class="field full"><label>Chimney Types (one per chimney)</label><div class="flr-pk" id="flr-chim-types" data-max="20" data-dup="1"><div class="flr-chips"></div><select onchange="FlrVal.pickAdd(this)"><option value="">＋ Add…</option><option>frame</option><option>masonry</option></select></div></div></div>';
      if (g.custom === 'acv') inner += '<div class="form-grid" style="margin-top:10px;"><div class="field"><label>Return Actual Cash Value (ACV)</label><select id="flr-acv" onchange="document.getElementById(\'flr-acv-box\').style.display=this.value===\'yes\'?\'contents\':\'none\'"><option value="">No</option><option value="yes">Yes</option></select></div>' +
        '<div id="flr-acv-box" style="display:none;"><div class="field"><label>Structure In Use</label><select id="flr-inuse"><option>yes</option><option>no</option></select></div>' +
        ['general', 'roof', 'wall', 'foundation'].map(function (c) { return '<div class="field"><label>Condition — ' + c + '</label><select id="flr-c-' + c + '">' + opts('tCONDITION', false).replace('<option>good</option>', '<option selected>good</option>') + '</select></div>'; }).join('') + '</div></div>';
      if (g.rows) inner += '<div id="' + ROWS[g.rows].host + '"></div><button type="button" class="btn-add-rec" onclick="FlrVal.addRow(\'' + g.rows + '\')">+ ' + ROWS[g.rows].add + '</button>';
      if (g.rows2) inner += '<div style="margin:14px 0 6px;font-weight:600;font-size:13px;">Appliances</div><div id="' + ROWS[g.rows2].host + '"></div><button type="button" class="btn-add-rec" onclick="FlrVal.addRow(\'' + g.rows2 + '\')">+ ' + ROWS[g.rows2].add + '</button>';
      html += '<details class="flr-sec"' + (g.open ? ' open' : '') + '><summary>' + esc(g.t) + '</summary><div>' + inner + '</div></details>';
    });
    html += '<div class="action-bar" style="margin:14px 0 6px;justify-content:flex-start;gap:12px;align-items:center;"><button type="button" class="btn-submit" id="btn-get-valuation" onclick="getValuation()">Get Valuation</button><span id="val-status" style="font-size:12.5px;color:var(--slate);"></span></div><div id="val-result" style="margin-top:12px;"></div>';
    host.innerHTML = html;
  }

  function pickAdd(sel) {
    var v = sel.value; sel.value = ''; if (!v) return;
    var box = sel.parentNode, max = parseInt(box.getAttribute('data-max'), 10) || 0, chips = box.querySelector('.flr-chips');
    var cur = Array.prototype.map.call(chips.children, function (c) { return c.getAttribute('data-v'); });
    if (max && cur.length >= max) return;
    if (!box.getAttribute('data-dup') && cur.indexOf(v) !== -1) return;
    chips.insertAdjacentHTML('beforeend', chipHtml(v));
  }
  function pickDel(b) { b.parentNode.remove(); }
  function pickGet(id) { var b = el(id); return b ? Array.prototype.map.call(b.querySelectorAll('.flr-chip'), function (c) { return c.getAttribute('data-v'); }) : []; }
  function pickSet(id, arr) { var b = el(id); if (!b) return; b.querySelector('.flr-chips').innerHTML = (arr || []).map(chipHtml).join(''); }

  function collect() {
    var f = {}, lists = {};
    SPEC.forEach(function (d) {
      var id = 'flr-' + d.n;
      if (d.t === 'rep' || d.t === 'list') { var a = pickGet(id); if (a.length) lists[d.n] = a; }
      else if (d.t === 'enum' || d.t === 'int' || d.t === 'dec') { var x = el(id); if (x && String(x.value).trim() !== '') f[d.n] = x.value; }
    });
    return { kind: 'flr', fields: f, lists: lists, areas: readRows('areas'), kitchens: readRows('kitchens'), appliances: readRows('appliances'), unique: readRows('unique'),
      chimneys: { n: (el('flr-chim-n') || {}).value || '', types: pickGet('flr-chim-types') },
      acv: { on: (el('flr-acv') || {}).value || '', inuse: (el('flr-inuse') || {}).value, general: (el('flr-c-general') || {}).value, roof: (el('flr-c-roof') || {}).value, wall: (el('flr-c-wall') || {}).value, foundation: (el('flr-c-foundation') || {}).value } };
  }
  function load(v) {
    if (!v || v.kind !== 'flr') return;
    var f = v.fields || {};
    Object.keys(f).forEach(function (k) { var x = el('flr-' + k); if (x) x.value = f[k]; });
    Object.keys(v.lists || {}).forEach(function (k) { pickSet('flr-' + k, v.lists[k]); });
    ['areas', 'kitchens', 'appliances', 'unique'].forEach(function (k) { (v[k] || []).forEach(function (r) { addRow(k, r); }); });
    if (v.chimneys) { if (el('flr-chim-n')) el('flr-chim-n').value = v.chimneys.n || ''; pickSet('flr-chim-types', v.chimneys.types); }
    if (v.acv && v.acv.on) {
      el('flr-acv').value = 'yes'; el('flr-acv-box').style.display = 'contents';
      ['inuse', 'general', 'roof', 'wall', 'foundation'].forEach(function (k) { var x = el(k === 'inuse' ? 'flr-inuse' : 'flr-c-' + k); if (x && v.acv[k]) x.value = v.acv[k]; });
    }
  }

  var PROVS = ENUMS.tPROVINCE;
  var ABBR = { ab: 'Alberta', bc: 'British Columbia', mb: 'Manitoba', nb: 'New Brunswick', nl: 'Newfoundland and Labrador', nt: 'Northwest Territories', ns: 'Nova Scotia', nu: 'Nunavut', on: 'Ontario', pe: 'Prince Edward Island', pei: 'Prince Edward Island', qc: 'Quebec', pq: 'Quebec', sk: 'Saskatchewan', yt: 'Yukon' };
  function prov(p) {
    p = String(p || '').trim();
    var hit = PROVS.filter(function (x) { return x.toLowerCase() === p.toLowerCase(); })[0];
    return hit || ABBR[p.toLowerCase().replace(/\./g, '')] || '';
  }
  function postal(p) { var c = String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return /^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/.test(c) ? c.slice(0, 3) + ' ' + c.slice(3) : ''; }

  // Returns { estimate, blanks } or { error }. blanks = optional sections left empty.
  function build() {
    var b = getBasics(), v = collect(), f = v.fields, missing = [], blanks = [];
    if (!b.address) missing.push('street address');
    if (!prov(b.province)) missing.push('a Canadian province');
    if (!postal(b.postal)) missing.push('a valid Canadian postal code (e.g. K2P 1L7)');
    if (!(parseInt(b.year, 10) > 0)) missing.push('year built');
    if (!(parseInt(b.sqft, 10) > 0)) missing.push('square footage');
    SPEC.forEach(function (d) {
      if (!d.req || ['address1', 'province', 'postalcode', 'living_area', 'coverage_a'].indexOf(d.n) !== -1) return;
      var has = (d.t === 'rep' || d.t === 'list') ? (v.lists[d.n] || []).length : f[d.n];
      if (!has) missing.push(label(d.n).toLowerCase().replace(/ \(.*\)/, ''));
    });
    v.areas.forEach(function (a, i) { if (!a.name || !a.year || !a.sqft) missing.push('other area #' + (i + 1) + ' (name, year and size)'); });
    v.appliances.forEach(function (a, i) { if (!a.name || !a.brand || !a.qty) missing.push('appliance #' + (i + 1) + ' (name, brand and quantity)'); });
    v.unique.forEach(function (a, i) { if (!a.name || a.cost === '') missing.push('unique item #' + (i + 1) + ' (description and cost)'); });
    if ((v.chimneys.n || v.chimneys.types.length) && (!(parseInt(v.chimneys.n, 10) >= 1) || !v.chimneys.types.length)) missing.push('chimneys (number and at least one type)');
    if (missing.length) return { error: 'Please complete: ' + missing.join(', ') + '.' };

    var p = { address1: b.address, city: b.city || undefined, province: prov(b.province), postalcode: postal(b.postal), locale: v.lists.locale,
      coverage_a: Number(f.coverage_a) || 0 };
    ['architectural_style', 'construction_quality', 'physical_shape', 'construction_type', 'recent_renovations', 'historic_registry'].forEach(function (k) { if (f[k]) p[k] = f[k]; });
    var st = parseInt(b.storeys, 10); if (st >= 1) p.number_of_stories = st;
    SPEC.forEach(function (d) {
      if (['address1', 'address2', 'city', 'province', 'postalcode', 'locale', 'coverage_a', 'living_area', 'other_areas', 'chimneys', 'kitchens', 'appliances', 'unique_items', 'return_acv', 'number_of_stories', 'architectural_style', 'construction_quality', 'physical_shape', 'construction_type', 'recent_renovations', 'historic_registry'].indexOf(d.n) !== -1) return;
      if (d.t === 'list') { if (v.lists[d.n]) { var w = {}; w[d.c] = v.lists[d.n]; p[d.n] = w; } }
      else if (d.t === 'int') { if (f[d.n] !== undefined) p[d.n] = parseInt(f[d.n], 10); }
      else if (f[d.n] !== undefined) p[d.n] = f[d.n];
    });
    p.living_area = { year_built: parseInt(b.year, 10), square_footage: parseInt(b.sqft, 10) };
    if (v.areas.length) p.other_areas = { area: v.areas.map(function (a) { return { area_name: a.name, year_built: parseInt(a.year, 10), square_footage: parseInt(a.sqft, 10) }; }) };
    if (v.chimneys.types.length) p.chimneys = { number_of_chimneys: parseInt(v.chimneys.n, 10), chimney_types: { type: v.chimneys.types } };
    if (v.kitchens.length) p.kitchens = { kitchen: v.kitchens.map(function (k) {
      var o = {}; if (k.area) o.area_of_home = k.area; if (k.cab) o.cabinetry = k.cab; if (k.top) o.countertops = k.top; if (k.back) o.backsplashes = k.back;
      if (k.island === 'yes') { o.center_island = { _attr: { value: 'yes' } }; if (k.icab) o.center_island.center_island_cabinetry = k.icab; if (k.itop) o.center_island.center_island_countertops = k.itop; }
      return o; }) };
    if (v.appliances.length) p.appliances = { appliance: v.appliances.map(function (a) { return { appliance_name: a.name, appliance_brand: a.brand, quantity: parseInt(a.qty, 10) }; }) };
    if (v.unique.length) p.unique_items = { item: v.unique.map(function (a) { return { item_name: a.name, cost: Number(a.cost) }; }) };
    if (v.acv.on === 'yes') p.return_acv = { _attr: { value: 'yes' }, structure_in_use: v.acv.inuse || 'yes', condition: { general: v.acv.general || 'good', roof: v.acv.roof || 'good', wall: v.acv.wall || 'good', foundation: v.acv.foundation || 'good' } };

    GROUPS.forEach(function (g) {
      var any = false;
      (g.f || []).forEach(function (n) { if (p[n] !== undefined) any = true; });
      if (g.rows && (v[g.rows].length)) any = true;
      if (g.rows2 && v[g.rows2].length) any = true;
      if (g.custom === 'chimneys' && p.chimneys) any = true;
      if (!any && g.t !== 'Other Areas (garage, deck, basement, etc.)' && g.t !== 'Unique Items') blanks.push(g.t);
    });
    return { estimate: { property: p }, blanks: blanks };
  }

  window.FlrVal = { render: render, collect: collect, load: load, build: build, addRow: addRow, pickAdd: pickAdd, pickDel: pickDel };
})();
