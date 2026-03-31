const base = 'http://localhost:3000';

const listEl = document.getElementById('list');
const statusEl = document.getElementById('status');

const btnBets = document.getElementById('btnBets');
const btnEvents = document.getElementById('btnEvents');
const btnUsers = document.getElementById('btnUsers');
const btnTop = document.getElementById('btnTop');
const topMode = document.getElementById('topMode');

btnBets.addEventListener('click', fetchBets);
btnEvents.addEventListener('click', fetchEvents);
btnUsers.addEventListener('click', fetchUsers);
btnTop.addEventListener('click', fetchTopEvents);

// Detect whether performance.now() provides sub-millisecond precision in this browser
let _timerRoundedToMs = false;
function detectTimerPrecision() {
  try {
    const samples = 20;
    let last = performance.now();
    let minDelta = Infinity;
    for (let i = 0; i < samples; i++) {
      const cur = performance.now();
      const delta = Math.abs(cur - last);
      if (delta > 0 && delta < minDelta) minDelta = delta;
      last = cur;
    }
    // If the smallest observed delta is >= 1 ms, timers are effectively rounded to ms
    _timerRoundedToMs = !(minDelta < 1);
    console.debug(
      'Detected timer minDelta=',
      minDelta,
      'roundedToMs=',
      _timerRoundedToMs,
    );
  } catch (e) {
    _timerRoundedToMs = false;
  }
}
detectTimerPrecision();

// Helper: näytä aika pyöristettynä kokonaisina millisekunteina
function formatMs(ms) {
  if (ms == null || Number.isNaN(ms)) return 'unknown';
  const n = Math.round(Number(ms));
  return `${n} ms`;
}

// (formatUs ei ole enää käytössä)
function formatUs(ms) {
  if (ms == null || Number.isNaN(ms)) return 'unknown';
  return `${Math.round(Number(ms) * 1000)} µs`;
}

// Try to read PerformanceResourceTiming for the fetch URL for more accurate network timings
function getResourceTiming(url) {
  try {
    const all = performance.getEntriesByType('resource');
    if (!all || all.length === 0) return null;
    // match by pathname+search to be robust against origin/normalization differences
    let path = url;
    try {
      const u = new URL(url);
      path = u.pathname + u.search;
    } catch (e) {
      // fallback: use full URL
      path = url;
    }
    // find entries whose name ends with the path or includes the path
    const candidates = all.filter((e) => {
      if (!e.name) return false;
      return e.name.endsWith(path) || e.name.includes(path);
    });
    if (!candidates || candidates.length === 0) return null;
    const entry = candidates[candidates.length - 1];
    // clear to avoid memory growth
    try {
      performance.clearResourceTimings();
    } catch (e) {
      // ignore
    }
    return entry;
  } catch (e) {
    return null;
  }
}

async function fetchBets() {
  statusEl.textContent = 'Loading bets...';
  try {
    const t0 = performance.now();
    const url = base + '/bets';
    const res = await fetch(url);
    const tFetch = performance.now();
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const bets = await res.json();
    const tJson = performance.now();
    renderBets(bets);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    const q = queryTime ? formatMs(parseFloat(queryTime)) : 'unknown';
    // Prefer PerformanceResourceTiming.duration when available; otherwise use client-side measurement.
    // If client timer is rounded to milliseconds but server X-Query-Time-ms has sub-ms precision,
    // combine server DB query time with client parse time for a higher-resolution total.
    const r = getResourceTiming(url);
    const parseMs = tJson - tFetch;
    const clientTotal = tJson - t0;
    const rDuration = r && typeof r.duration === 'number' ? r.duration : null;
    // Prefer the most precise (non-integer) value: if resource timing exists but is integer-rounded,
    // prefer clientTotal which may have fractional ms. If resource timing has fractions, prefer it.
    let totalMs;
    if (rDuration != null) {
      totalMs = rDuration % 1 === 0 ? clientTotal : rDuration;
    } else if (_timerRoundedToMs && queryTime) {
      totalMs = parseFloat(queryTime) + parseMs;
    } else {
      totalMs = clientTotal;
    }
    console.debug('timings', {
      t0,
      tFetch,
      tJson,
      clientTotal,
      rDuration,
      parseMs,
      chosenTotal: totalMs,
      timerRounded: _timerRoundedToMs,
    });
    statusEl.textContent = `Loaded ${bets.length} bets — source: ${source} — DB query ${q}, total fetch ${formatMs(totalMs)}`;
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchEvents() {
  statusEl.textContent = 'Loading events...';
  try {
    const t0 = performance.now();
    const url = base + '/events';
    const res = await fetch(url);
    const tFetch = performance.now();
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const events = await res.json();
    const tJson = performance.now();
    renderEvents(events);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    const q = queryTime ? formatMs(parseFloat(queryTime)) : 'unknown';
    const r = getResourceTiming(url);
    const parseMs = tJson - tFetch;
    const clientTotal = tJson - t0;
    const rDuration = r && typeof r.duration === 'number' ? r.duration : null;
    let totalMs;
    if (rDuration != null) {
      totalMs = rDuration % 1 === 0 ? clientTotal : rDuration;
    } else if (_timerRoundedToMs && queryTime) {
      totalMs = parseFloat(queryTime) + parseMs;
    } else {
      totalMs = clientTotal;
    }
    console.debug('timings', { t0, tFetch, tJson, clientTotal, rDuration, parseMs, chosenTotal: totalMs, timerRounded: _timerRoundedToMs });
    statusEl.textContent = `Loaded ${events.length} events — source: ${source} — DB query ${q}, total fetch ${formatMs(totalMs)}`;
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchUsers() {
  statusEl.textContent = 'Loading users...';
  try {
    const t0 = performance.now();
    const url = base + '/users';
    const res = await fetch(url);
    const tFetch = performance.now();
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const users = await res.json();
    const tJson = performance.now();
    renderUsers(users);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    const q = queryTime ? formatMs(parseFloat(queryTime)) : 'unknown';
    const r = getResourceTiming(url);
    const parseMs = tJson - tFetch;
    const clientTotal = tJson - t0;
    const rDuration = r && typeof r.duration === 'number' ? r.duration : null;
    let totalMs;
    if (rDuration != null) {
      totalMs = rDuration % 1 === 0 ? clientTotal : rDuration;
    } else if (_timerRoundedToMs && queryTime) {
      totalMs = parseFloat(queryTime) + parseMs;
    } else {
      totalMs = clientTotal;
    }
    console.debug('timings', { t0, tFetch, tJson, clientTotal, rDuration, parseMs, chosenTotal: totalMs, timerRounded: _timerRoundedToMs });
    statusEl.textContent = `Loaded ${users.length} users — source: ${source} — DB query ${q}, total fetch ${formatMs(totalMs)}`;
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchTopEvents() {
  statusEl.textContent = 'Loading top events...';
  try {
    const mode = topMode.value || 'count';
    const url = base + '/top-events?mode=' + encodeURIComponent(mode);
    const t0 = performance.now();
    const res = await fetch(url);
    const tFetch = performance.now();
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const body = await res.json();
    const tJson = performance.now();
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    renderTopEvents(body.results, body.mode, queryTime);
    const r = getResourceTiming(url);
    const parseMs = tJson - tFetch;
    const clientTotal = tJson - t0;
    const rDuration = r && typeof r.duration === 'number' ? r.duration : null;
    let totalMs;
    if (rDuration != null) {
      totalMs = rDuration % 1 === 0 ? clientTotal : rDuration;
    } else if (_timerRoundedToMs && queryTime) {
      totalMs = parseFloat(queryTime) + parseMs;
    } else {
      totalMs = clientTotal;
    }
    console.debug('timings', { t0, tFetch, tJson, clientTotal, rDuration, parseMs, chosenTotal: totalMs, timerRounded: _timerRoundedToMs });
    statusEl.textContent = `Loaded top events (mode=${body.mode}) — source: ${source} — DB query ${queryTime ? formatMs(parseFloat(queryTime)) : 'unknown'}, total fetch ${formatMs(totalMs)}`;
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
}

function renderBets(bets) {
  listEl.innerHTML = '';
  if (!bets || !bets.length) {
    listEl.innerHTML = '<li class="muted">No bets found</li>';
    return;
  }
  bets.forEach((b) => {
    const li = document.createElement('li');
    const date = b.vedon_pvm ? new Date(b.vedon_pvm).toLocaleString() : '';
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(b.kayttajan_nimi || '—')}</strong></div>
        <div class="muted">${escapeHtml(b.tapahtuman_nimi || '—')}</div>
        <div class="muted">Vedon pvm: ${escapeHtml(date)}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">Valinta: ${escapeHtml(b.valinta || '—')}</div>
        <div class="muted">Panos: ${b.panos ?? 0}</div>
        <div class="muted">Kerroin: ${b.kerroin ?? '-'}</div>
        <div class="muted">Tila: ${escapeHtml(b.tila || '-')}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function renderEvents(events) {
  listEl.innerHTML = '';
  if (!events || !events.length) {
    listEl.innerHTML = '<li class="muted">No events found</li>';
    return;
  }
  events.forEach((ev) => {
    const li = document.createElement('li');
    const date = ev.tapahtuma_pvm
      ? new Date(ev.tapahtuma_pvm).toLocaleString()
      : '';
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(ev.nimi || '—')}</strong></div>
        <div class="muted">${escapeHtml(ev.kuvaus || '')}</div>
        <div class="muted">Pvm: ${escapeHtml(date)}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">Kategoria: ${escapeHtml(ev.kategoria || '—')}</div>
        <div class="muted">Status: ${escapeHtml(ev.status || '-')}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function renderUsers(users) {
  listEl.innerHTML = '';
  if (!users || !users.length) {
    listEl.innerHTML = '<li class="muted">No users found</li>';
    return;
  }
  users.forEach((u) => {
    const li = document.createElement('li');
    const name =
      u.nimi && typeof u.nimi === 'object'
        ? `${escapeHtml(u.nimi.etunimi || '')} ${escapeHtml(u.nimi.sukunimi || '')}`
        : escapeHtml(u.nimi || '—');
    li.innerHTML = `
      <div>
        <div><strong>${name}</strong></div>
        <div class="muted">${escapeHtml(u.kayttajatunnus || '')} • ${escapeHtml(u.sahkoposti || '')}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">Saldo: ${u.saldo ?? '-'}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function renderTopEvents(items, mode, queryTime) {
  listEl.innerHTML = '';
  const headerLi = document.createElement('li');
  headerLi.className = 'muted';
  headerLi.style.fontSize = '0.9rem';
  // Show mode in the list header; DB query time is already shown in statusEl to avoid duplication
  headerLi.textContent = `Top events (mode=${mode})`;
  listEl.appendChild(headerLi);
  if (!items || !items.length) {
    listEl.innerHTML += '<li class="muted">No top events</li>';
    return;
  }
  items.forEach((it) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(it.tapahtuman_nimi || it.event?.nimi || '—')}</strong></div>
        <div class="muted">${escapeHtml(it.event?.kuvaus || '')}</div>
      </div>
      <div style="text-align:right">
        <div class="muted">Bets: ${it.count ?? 0}</div>
        <div class="muted">Total stake: ${it.totalPanos ?? 0}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
}

// Load bets on page open
fetchBets();
