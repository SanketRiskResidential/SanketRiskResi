// SanketRisk HOME (Residential) — Netlify Function: notify-job
// Sends job emails through Resend. Only a signed-in ADMIN may trigger it.
// The page sends only an event name and a job id. This function reads the job with the ADMIN'S OWN sign-in token
// (so database security rules still apply and no server key is needed) and takes the recipient and wording from the database.
// Events: inspector_assigned {id}, reviewer_assigned {id}, client_assigned {id}, client_released {id}
// Env (Netlify, Residential site): RESEND_API_KEY (or SanketriskAPIKEY), RESEND_FROM e.g.  SanketRisk Home <reports@sanketrisk.com>

const SUPABASE_URL = 'https://lkihphmtyusqmnhbfswq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X7JifOrQKvkCwGD7DQpPZg_-6jB5j3Z'; // publishable key (safe to be public)
const SITE = 'https://home.sanketrisk.com';
const ALLOWED_ORIGINS = ['https://home.sanketrisk.com', 'https://sanket-residential.netlify.app'];
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const q = (v) => encodeURIComponent(String(v));

const dbHeaders = (token) => ({ apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' });
async function dbGet(token, path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: dbHeaders(token) });
  if (!r.ok) throw new Error('Database read failed');
  return r.json();
}
async function dbRpc(token, name, args) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: dbHeaders(token), body: JSON.stringify(args || {}) });
  if (!r.ok) throw new Error('Database call failed');
  return r.json().catch(() => null);
}
async function sendMail(to, subject, text, html) {
  const key = process.env.RESEND_API_KEY || process.env.SanketriskAPIKEY;
  if (!key) throw new Error('Email is not configured (missing API key).');
  const from = process.env.RESEND_FROM || 'SanketRisk Home <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Email service error');
}
function wrap(title, lines, button) {
  const body = lines.map((l) => '<p style="margin:0 0 12px">' + esc(l) + '</p>').join('');
  const btn = button ? '<p style="margin:18px 0"><a href="' + esc(button.url) + '" style="background:#c9a84c;color:#1a2433;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">' + esc(button.label) + '</a></p>' : '';
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a2433;max-width:560px"><h2 style="font-size:18px;margin:0 0 14px">' + esc(title) + '</h2>' + body + btn +
    '<p style="color:#667;font-size:12px;margin-top:22px">Sanket Risk Consultants</p></div>';
}
const plain = (lines, button) => lines.join('\n\n') + (button ? '\n\n' + button.label + ': ' + button.url : '') + '\n\nSanket Risk Consultants';
const addr = (r) => [r.location, r.city, r.province_state].filter(Boolean).join(', ');

exports.handler = async function (event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
  };
  const reply = (code, obj) => ({ statusCode: code, headers, body: JSON.stringify(obj) });
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  try {
    const token = String((event.headers && (event.headers.authorization || event.headers.Authorization)) || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return reply(401, { error: 'Sign in required.' });
    const ur = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token } });
    if (!ur.ok) return reply(401, { error: 'Session expired. Please sign in again.' });
    const role = await dbRpc(token, 'app_role', {});
    if (role !== 'admin') return reply(403, { error: 'Only an administrator can send job emails.' });

    let b = {}; try { b = JSON.parse((event.body || '{}').slice(0, 2000)); } catch (e) { return reply(400, { error: 'Bad request.' }); }
    const ev = String(b.event || '');
    if (!UUID_RE.test(b.id || '')) return reply(400, { error: 'Bad job id.' });
    const job = (await dbGet(token, 'inspections?id=eq.' + q(b.id) +
      '&select=id,insured_name,location,city,province_state,request_ref,request_details,inspector_id,reviewer_id,requestor_id,released_at&limit=1'))[0];
    if (!job) return reply(404, { error: 'Job not found.' });

    const personById = async (id) => {
      if (!id) return null;
      const p = (await dbGet(token, 'profiles?id=eq.' + q(id) + '&select=email,full_name&limit=1'))[0];
      return p && EMAIL_RE.test(p.email || '') ? p : null;
    };
    const sent = [], skipped = [];
    const note = (text) => dbRpc(token, 'add_job_note', { p_id: job.id, p_note: text, p_visible: false }).catch(() => null);
    const siteBtn = { label: 'Open SanketRisk Home', url: SITE + '/dashboard' };

    if (ev === 'inspector_assigned' || ev === 'reviewer_assigned') {
      const isInsp = ev === 'inspector_assigned';
      const p = await personById(isInsp ? job.inspector_id : job.reviewer_id);
      if (!p) skipped.push('No email address found for the ' + (isInsp ? 'inspector' : 'reviewer') + '.');
      else {
        const d = job.request_details || {};
        const lines = [isInsp ? 'You have been assigned an inspection. Please open your dashboard to accept it.' : 'A report has been assigned to you for review.',
          'Owner / insured: ' + (job.insured_name || '—'), 'Location: ' + (addr(job) || '—')];
        if (job.request_ref) lines.push('Reference: ' + job.request_ref);
        if (isInsp && (d.preferred_date || d.preferred_time)) lines.push('Preferred visit: ' + [d.preferred_date, d.preferred_time].filter(Boolean).join(' · '));
        await sendMail(p.email, (isInsp ? 'New inspection assigned: ' : 'Review assigned: ') + (job.insured_name || 'job'), plain(lines, siteBtn), wrap(isInsp ? 'New inspection assigned' : 'Review assigned', lines, siteBtn));
        sent.push(isInsp ? 'inspector' : 'reviewer'); await note((isInsp ? 'Assignment' : 'Review') + ' email sent to ' + p.email);
      }
    } else if (ev === 'client_assigned' || ev === 'client_released') {
      const d = job.request_details || {};
      let name = d.requestor_name || '', to = '', hasAccount = false;
      const acct = await personById(job.requestor_id);
      if (acct) { to = acct.email; name = name || acct.full_name || ''; hasAccount = true; }
      else if (EMAIL_RE.test(String(d.email || '').trim())) to = String(d.email).trim();
      if (!to) skipped.push('The job has no client email address.');
      else if (ev === 'client_assigned') {
        const lines = ['Hello' + (name ? ' ' + name : '') + ',',
          'Your inspection request' + (job.request_ref ? ' ' + job.request_ref : '') + ' for ' + (addr(job) || job.insured_name || 'the property') + ' has been assigned to an inspector.',
          'We will be in touch to confirm the visit.'];
        const btn = hasAccount ? { label: 'Follow your request', url: SITE + '/dashboard' } : null;
        await sendMail(to, 'Your inspection request has been assigned', plain(lines, btn), wrap('Your inspection has been assigned', lines, btn));
        sent.push('client'); await note('Client assignment email sent to ' + to);
      } else {
        if (!job.released_at) return reply(400, { error: 'The report has not been released.' });
        if (!hasAccount) skipped.push('The client has no portal account, so no download link was emailed. Please send the report to them directly.');
        else {
          const lines = ['Hello' + (name ? ' ' + name : '') + ',', 'Your inspection report for ' + (addr(job) || job.insured_name || 'the property') + ' is ready.',
            'Sign in to your dashboard to view and download it.'];
          const btn = { label: 'View your report', url: SITE + '/dashboard' };
          await sendMail(to, 'Your inspection report is ready', plain(lines, btn), wrap('Your inspection report is ready', lines, btn));
          sent.push('client'); await note('Report-ready email sent to ' + to);
        }
      }
    } else return reply(400, { error: 'Unknown event.' });
    return reply(200, { sent, skipped });
  } catch (e) {
    return reply(500, { error: e.message || 'Could not send the email.' });
  }
};
