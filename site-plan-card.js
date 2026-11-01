// SanketRisk HOME — adds a "Site Plan" card (below Photos) to the inspection forms.
// Uses the page's own _supabase client and currentInspectionId. The drawing itself is done in /site-plan.html.
(function () {
  var BUCKET = 'inspection-photos';
  var png = function () { return 'inspections/' + currentInspectionId + '/site-plan.png'; };
  var json = function () { return 'inspections/' + currentInspectionId + '/site-plan.json'; };
  var val = function (id) { var e = document.getElementById(id); return e && e.value ? e.value : ''; };
  var $ = function (id) { return document.getElementById(id); };
  function toast(m) { try { if (typeof showToast === 'function') showToast(m); } catch (e) {} }

  function build() {
    var title = Array.prototype.filter.call(document.querySelectorAll('.card-title'), function (el) { return el.textContent.trim() === 'Photos'; })[0];
    var after = title && title.closest('.card');
    if (!after || $('siteplan-card')) return false;
    var card = document.createElement('div');
    card.className = 'card'; card.id = 'siteplan-card';
    card.innerHTML =
      '<div class="card-title">Site Plan</div>' +
      '<div style="font-size:12px;color:#5a6b80;margin-bottom:10px;">Draw a site plan over a map of the property, or on a blank grid, then attach it so it prints in the report.</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
      '<button type="button" id="sp-open" class="btn-nav" style="background:#1b2a4a;color:#fff;border:none;padding:9px 14px;border-radius:8px;font-weight:600;cursor:pointer;">🗺️ Open Site Plan</button>' +
      '<button type="button" id="sp-remove" style="display:none;padding:9px 14px;background:none;border:1px solid #c53030;color:#c53030;border-radius:8px;font-weight:600;cursor:pointer;">✕ Remove</button></div>' +
      '<div id="sp-status" style="font-size:12px;color:#5a6b80;margin-top:8px;">Save the inspection first, then open the Site Plan.</div>' +
      '<img id="sp-thumb" alt="Site plan" style="display:none;margin-top:10px;max-width:280px;width:100%;border:1px solid #d5dbe6;border-radius:6px;">';
    after.parentNode.insertBefore(card, after.nextSibling);
    $('sp-open').onclick = openPlan;
    $('sp-remove').onclick = removePlan;
    return true;
  }

  async function refresh() {
    var st = $('sp-status'), th = $('sp-thumb'), rm = $('sp-remove');
    if (!st) return;
    th.style.display = 'none'; rm.style.display = 'none';
    if (typeof currentInspectionId === 'undefined' || !currentInspectionId) { st.textContent = 'Save the inspection first, then open the Site Plan.'; return; }
    try {
      var s = await _supabase.storage.from(BUCKET).createSignedUrl(png(), 120);
      if (s.error || !s.data) throw new Error('none');
      th.src = s.data.signedUrl; th.style.display = 'block'; rm.style.display = '';
      st.textContent = '✓ Site plan attached. It will appear in the report. Open the Site Plan again to change it.';
    } catch (e) {
      st.textContent = 'No site plan attached yet. Open the Site Plan, draw, then tap “Attach to report”.';
    }
  }

  function openPlan() {
    if (!currentInspectionId) { toast('⚠ Save the inspection first, then open the Site Plan.'); return; }
    var addr = [val('location'), val('city'), val('province-state')].filter(Boolean).join(', ');
    var q = new URLSearchParams({ inspection: currentInspectionId, insured: val('insured-name'), addr: addr, address: addr,
      date: val('inspection-date'), by: val('inspector-name'), ref: String(currentInspectionId).slice(0, 8) });
    window.open('/site-plan.html?' + q.toString(), '_blank');
  }

  async function removePlan() {
    if (!currentInspectionId || !confirm('Remove the attached site plan from this inspection?')) return;
    try { await _supabase.storage.from(BUCKET).remove([png(), json()]); } catch (e) {}
    await refresh();
    toast('Site plan removed.');
  }

  function start() {
    if (!build()) return;
    var tries = 0, t = setInterval(function () {
      tries++;
      if (typeof currentInspectionId !== 'undefined' && currentInspectionId) { clearInterval(t); refresh(); }
      else if (tries > 80) clearInterval(t);
    }, 500);
    window.addEventListener('focus', function () { if (currentInspectionId) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
