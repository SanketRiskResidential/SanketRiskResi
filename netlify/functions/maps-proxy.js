// SanketRisk HOME (Residential) — Netlify Function: maps-proxy
// Used only by the Site Plan tool: address lookup (geocode) and a satellite/roadmap map image.
// Only a signed-in admin, inspector or reviewer may use it. The caller's own token is checked with Supabase,
// so no database service key is needed here.
// Env (Netlify, Residential site): GOOGLE_MAPS_API_KEY  (a server key restricted to Geocoding API + Maps Static API)

const SUPABASE_URL = 'https://lkihphmtyusqmnhbfswq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X7JifOrQKvkCwGD7DQpPZg_-6jB5j3Z'; // publishable key (safe to be public)
const ALLOWED_ORIGINS = ['https://home.sanketrisk.com', 'https://sanket-residential.netlify.app'];

exports.handler = async function (event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const base = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  const json = (code, obj) => ({ statusCode: code, headers: { ...base, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) });
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: base, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const token = String((event.headers && (event.headers.authorization || event.headers.Authorization)) || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return json(401, { error: 'Sign in required' });
    const rr = await fetch(SUPABASE_URL + '/rest/v1/rpc/app_role', {
      method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}',
    });
    if (!rr.ok) return json(401, { error: 'Sign in required' });
    const role = await rr.json().catch(() => null);
    if (['admin', 'inspector', 'reviewer'].indexOf(role) === -1) return json(403, { error: 'Not permitted' });

    const KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!KEY) return json(500, { error: 'GOOGLE_MAPS_API_KEY is not set' });
    const q = event.queryStringParameters || {};

    if (q.geocode) {
      const addr = String(q.geocode).slice(0, 200);
      const g = await (await fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(addr) + '&key=' + KEY)).json();
      const r = g && g.results && g.results[0];
      if (!r) return json(404, { error: 'Address not found' });
      return json(200, { lat: r.geometry.location.lat, lng: r.geometry.location.lng, address: r.formatted_address });
    }

    const center = String(q.center || '');
    if (!/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(center)) return json(400, { error: 'Missing or invalid center' });
    const zoom = Math.max(15, Math.min(21, parseInt(q.zoom, 10) || 19));
    const maptype = ['roadmap', 'satellite', 'hybrid', 'terrain'].indexOf(q.maptype) >= 0 ? q.maptype : 'hybrid';
    const url = 'https://maps.googleapis.com/maps/api/staticmap?center=' + encodeURIComponent(center) + '&zoom=' + zoom +
      '&size=640x640&scale=2&maptype=' + maptype +
      (q.labels === 'off' ? '&style=' + encodeURIComponent('feature:all|element:labels|visibility:off') : '') + '&key=' + KEY;
    const res = await fetch(url);
    if (!res.ok) return json(res.status, { error: 'Google Maps returned ' + res.status });
    const buf = Buffer.from(await res.arrayBuffer());
    return { statusCode: 200, headers: { ...base, 'Content-Type': res.headers.get('content-type') || 'image/png', 'Cache-Control': 'private, max-age=600' }, body: buf.toString('base64'), isBase64Encoded: true };
  } catch (e) {
    return json(500, { error: 'Map service error' });
  }
};
