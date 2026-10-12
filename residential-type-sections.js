// Inspection-type profiles for the general Residential form (app-residential-generic.html).
// Each profile says which blocks that inspection type shows. Edit here and the form,
// the saved data and the report all follow. No valuation is included in these types.
//   roof / exterior / hazards : show the Roof, Exterior and Site Hazards cards
//   full   : 'all' or a list of ids from residential-full-sections.js
//            (structure, interior, heating, electrical, plumbing, protection, features)
//   extra  : ids from TYPE_SECTIONS below
window.TYPE_PROFILES = {
  residential_mh:        { title: 'Manufactured Home Inspection',         roof: true,  exterior: true,  hazards: true, full: [],                                  extra: ['manufactured'] },
  residential_mh_full:   { title: 'Full Manufactured Home Inspection',    roof: true,  exterior: true,  hazards: true, full: 'all',                               extra: ['manufactured'] },
  exterior:              { title: 'Exterior Inspection',                  roof: true,  exterior: true,  hazards: true, full: ['features', 'protection'],          extra: [] },
  exterior_interior:     { title: 'Exterior / Interior Inspection',       roof: true,  exterior: true,  hazards: true, full: ['structure', 'heating', 'electrical', 'plumbing', 'protection', 'features'], extra: ['interior'] },
  a_and_a:               { title: 'Additions & Alterations Inspection',   roof: true,  exterior: true,  hazards: true, full: ['structure'],                       extra: ['additions'] },
  additional_structures: { title: 'Additional Structures Inspection',     roof: false, exterior: false, hazards: true, full: [],                                  extra: ['structures'] }
};

var T_COND = ['Good', 'Fair', 'Poor'];
var T_PERMIT = ['Permit seen', 'Owner states permitted', 'Unpermitted / DIY', 'Unknown'];
// Field types: select | multi | number | text | textarea | rows (cols: [{id,label,type,options}])
window.TYPE_SECTIONS = {
  manufactured: { title: 'Manufactured Home Details', fields: [
    { id: 'make', label: 'Manufacturer / Make', type: 'text' },
    { id: 'model', label: 'Model', type: 'text' },
    { id: 'serial', label: 'Serial Number', type: 'text' },
    { id: 'year_mfd', label: 'Year Manufactured', type: 'number', min: 1900, max: 2100 },
    { id: 'csa_label', label: 'CSA / Compliance Label', type: 'select', options: ['CSA label found', 'Label not found', 'Pre-label unit', 'Unknown'] },
    { id: 'set_on', label: 'Set On', type: 'select', options: ['Permanent foundation', 'Basement', 'Piers / blocks', 'Pad / runners', 'Other'] },
    { id: 'anchoring', label: 'Anchoring / Tie-downs', type: 'select', options: ['Tie-down straps', 'Ground anchors', 'Permanent foundation', 'None seen', 'Not visible'] },
    { id: 'undercarriage', label: 'Undercarriage / Belly Wrap', type: 'select', options: ['Intact', 'Damaged', 'Not visible'] },
    { id: 'roof_over', label: 'Roof', type: 'select', options: ['Original roof', 'Pitched roof added over original', 'Unknown'] },
    { id: 'attached', label: 'Attached Additions', type: 'multi', options: ['None', 'Porch', 'Deck', 'Carport', 'Room addition', 'Storage shed attached'] },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  additions: { title: 'Additions & Alterations', fields: [
    { id: 'items', label: 'Additions / Alterations', type: 'rows', add: 'Add item', cols: [
      { id: 'kind', label: 'Type', type: 'select', options: ['Room addition', 'Garage', 'Deck / porch', 'Sunroom', 'Basement finishing', 'Kitchen / bathroom renovation', 'Roof replacement', 'Electrical / plumbing / heating upgrade', 'Other'] },
      { id: 'desc', label: 'Description', type: 'text' },
      { id: 'year', label: 'Year', type: 'number' },
      { id: 'sqft', label: 'Sq ft', type: 'number' },
      { id: 'cost', label: 'Approx. cost ($)', type: 'number' },
      { id: 'permit', label: 'Permit', type: 'select', options: T_PERMIT },
      { id: 'by', label: 'Done by', type: 'select', options: ['Licensed contractor', 'Owner / DIY', 'Unknown'] }
    ]},
    { id: 'quality', label: 'Quality of Workmanship', type: 'select', options: ['Good', 'Average', 'Poor'] },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  structures: { title: 'Additional Structures', fields: [
    { id: 'items', label: 'Structures on the Property', type: 'rows', add: 'Add structure', cols: [
      { id: 'kind', label: 'Structure', type: 'select', options: ['Detached garage', 'Carport', 'Shed', 'Workshop', 'Barn / stable', 'Guest house / coach house', 'Gazebo / pergola', 'Greenhouse', 'Boathouse / dock', 'Pool house', 'Other'] },
      { id: 'year', label: 'Year built', type: 'number' },
      { id: 'sqft', label: 'Sq ft', type: 'number' },
      { id: 'construction', label: 'Construction', type: 'select', options: ['Wood frame', 'Masonry', 'Metal', 'Log', 'Other'] },
      { id: 'roof', label: 'Roof', type: 'select', options: ['Asphalt shingle', 'Metal', 'Flat / membrane', 'Other'] },
      { id: 'condition', label: 'Condition', type: 'select', options: T_COND },
      { id: 'use', label: 'Use', type: 'select', options: ['Storage', 'Parking', 'Workshop', 'Living space', 'Business use', 'Unused'] },
      { id: 'services', label: 'Services', type: 'select', options: ['None', 'Electrical only', 'Electrical, heat and plumbing'] }
    ]},
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]}
};

// ── Shared helpers (the host page defines esc(), toggleCheck(), getCheckGroupValues()) ──
function typedFieldHtml(secId, fl) {
  var id = 'typed-' + secId + '-' + fl.id;
  if (fl.type === 'heading') return '<div class="field full" style="margin-top:8px;"><div style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);border-bottom:1px solid var(--border);padding-bottom:4px;">' + esc(fl.label) + '</div></div>';
  if (fl.type === 'select') return '<div class="field"><label>' + esc(fl.label) + '</label><select id="' + id + '"><option value="">— Select —</option>' + fl.options.map(function(o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div>';
  if (fl.type === 'multi') return '<div class="field full"><label>' + esc(fl.label) + '</label><div class="check-group" id="' + id + '">' + fl.options.map(function(o) { return '<div class="check-btn" onclick="toggleCheck(this)">' + esc(o) + '</div>'; }).join('') + '</div></div>';
  if (fl.type === 'textarea') return '<div class="field full"><label>' + esc(fl.label) + '</label><textarea id="' + id + '" rows="3"></textarea></div>';
  if (fl.type === 'number') return '<div class="field"><label>' + esc(fl.label) + '</label><input id="' + id + '" type="number"' + (fl.min != null ? ' min="' + fl.min + '"' : '') + (fl.max != null ? ' max="' + fl.max + '"' : '') + '></div>';
  if (fl.type === 'rows') return '<div class="field full"><label>' + esc(fl.label) + '</label><div id="' + id + '"></div><button type="button" class="btn-add-rec" onclick="addTypedRow(\'' + secId + '\',\'' + fl.id + '\')">+ ' + esc(fl.add || 'Add') + '</button></div>';
  return '<div class="field"><label>' + esc(fl.label) + '</label><input id="' + id + '" type="text"></div>';
}
function renderTypeExtra(profile) {
  var host = document.getElementById('type-sections');
  if (!host) return;
  host.innerHTML = (profile.extra || []).map(function(sid) {
    var sec = window.TYPE_SECTIONS[sid];
    return '<div class="card"><div class="card-title">' + esc(sec.title) + '</div><div class="form-grid">' + sec.fields.map(function(fl) { return typedFieldHtml(sid, fl); }).join('') + '</div>' + (sec.note ? '<div class="note-box"><label>NOTES</label><textarea id="typed-' + sid + '-note" rows="3" placeholder="Anything else worth recording for this section…"></textarea></div>' : '') + '</div>';
  }).join('');
}
function addTypedRow(secId, fieldId, vals) {
  var fl = window.TYPE_SECTIONS[secId].fields.filter(function(x) { return x.id === fieldId; })[0];
  var row = document.createElement('div');
  row.className = 'typed-row';
  row.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr)) auto;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed var(--border);align-items:center;';
  var st = 'padding:9px;border:1px solid var(--border);border-radius:7px;background:var(--bg);font-family:inherit;font-size:13px;width:100%;';
  row.innerHTML = fl.cols.map(function(c) {
    if (c.type === 'select') return '<select class="tr-' + c.id + '" style="' + st + '"><option value="">' + esc(c.label) + '</option>' + c.options.map(function(o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
    return '<input class="tr-' + c.id + '" type="' + (c.type === 'number' ? 'number' : 'text') + '" placeholder="' + esc(c.label) + '" style="' + st + '">';
  }).join('') + '<button type="button" class="btn-del-rec" onclick="this.parentNode.remove()">✕</button>';
  document.getElementById('typed-' + secId + '-' + fieldId).appendChild(row);
  if (vals) fl.cols.forEach(function(c) { if (vals[c.id] != null) row.querySelector('.tr-' + c.id).value = vals[c.id]; });
}
function collectTyped(profile) {
  var out = {};
  (profile.extra || []).forEach(function(sid) {
    var sec = window.TYPE_SECTIONS[sid], o = {};
    sec.fields.forEach(function(fl) {
      if (fl.type === 'heading') return;
      var id = 'typed-' + sid + '-' + fl.id;
      if (fl.type === 'multi') { var v = getCheckGroupValues(id); if (v.length) o[fl.id] = v; }
      else if (fl.type === 'rows') {
        var rows = [];
        document.querySelectorAll('#' + id + ' .typed-row').forEach(function(r) {
          var x = {}, any = false;
          fl.cols.forEach(function(c) { var val = r.querySelector('.tr-' + c.id).value.trim(); x[c.id] = val; if (val) any = true; });
          if (any) rows.push(x);
        });
        if (rows.length) o[fl.id] = rows;
      } else { var el = document.getElementById(id); if (el && String(el.value).trim() !== '') o[fl.id] = el.value; }
    });
    if (sec.note) { var nb = document.getElementById('typed-' + sid + '-note'); if (nb && nb.value.trim()) o.note = nb.value; }
    out[sid] = o;
  });
  return out;
}
function loadTyped(profile, d) {
  if (!d) return;
  (profile.extra || []).forEach(function(sid) {
    var sec = window.TYPE_SECTIONS[sid], o = d[sid] || {};
    if (sec.note && o.note != null) { var nb = document.getElementById('typed-' + sid + '-note'); if (nb) nb.value = o.note; }
    sec.fields.forEach(function(fl) {
      if (fl.type === 'heading') return;
      var id = 'typed-' + sid + '-' + fl.id, v = o[fl.id];
      if (v == null) return;
      if (fl.type === 'multi') document.querySelectorAll('#' + id + ' .check-btn').forEach(function(b) { if (v.indexOf(b.textContent.trim()) !== -1) b.classList.add('selected'); });
      else if (fl.type === 'rows') v.forEach(function(r) { addTypedRow(sid, fl.id, r); });
      else { var el = document.getElementById(id); if (el) el.value = v; }
    });
  });
}
