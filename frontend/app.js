const base = 'http://localhost:3000';

const listEl = document.getElementById('list');
const statusEl = document.getElementById('status');

const btnBets = document.getElementById('btnBets');
const btnEvents = document.getElementById('btnEvents');
const btnUsers = document.getElementById('btnUsers');
const btnInit = document.getElementById('btnInit');
const btnTop = document.getElementById('btnTop');
const topMode = document.getElementById('topMode');

btnBets.addEventListener('click', fetchBets);
btnEvents.addEventListener('click', fetchEvents);
btnUsers.addEventListener('click', fetchUsers);
btnInit.addEventListener('click', initSample);
btnTop.addEventListener('click', fetchTopEvents);

async function fetchBets(){
  statusEl.textContent = 'Loading bets...';
  try{
    const t0 = performance.now();
    const res = await fetch(base + '/bets');
    const tFetch = performance.now();
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const bets = await res.json();
    const tJson = performance.now();
    renderBets(bets);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    statusEl.textContent = `Loaded ${bets.length} bets — source: ${source} — DB query ${queryTime ? queryTime + ' ms' : 'unknown'}, total fetch ${(tJson - t0).toFixed(1)} ms`;
  }catch(e){
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchEvents(){
  statusEl.textContent = 'Loading events...';
  try{
    const t0 = performance.now();
    const res = await fetch(base + '/events');
    const tFetch = performance.now();
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const events = await res.json();
    const tJson = performance.now();
    renderEvents(events);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    statusEl.textContent = `Loaded ${events.length} events — source: ${source} — DB query ${queryTime ? queryTime + ' ms' : 'unknown'}, total fetch ${(tJson - t0).toFixed(1)} ms`;
  }catch(e){
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchUsers(){
  statusEl.textContent = 'Loading users...';
  try{
    const t0 = performance.now();
    const res = await fetch(base + '/users');
    const tFetch = performance.now();
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const users = await res.json();
    const tJson = performance.now();
    renderUsers(users);
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    statusEl.textContent = `Loaded ${users.length} users — source: ${source} — DB query ${queryTime ? queryTime + ' ms' : 'unknown'}, total fetch ${(tJson - t0).toFixed(1)} ms`;
  }catch(e){
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function initSample(){
  statusEl.textContent = 'Initializing sample data...';
  try{
    const res = await fetch(base + '/init-sample', { method: 'POST' });
    const body = await res.json();
    if(!res.ok) throw new Error(body.error || res.statusText);
    statusEl.textContent = 'Sample data initialized';
    fetchBets();
  }catch(e){
    statusEl.textContent = 'Error: ' + e.message;
  }
}

async function fetchTopEvents(){
  statusEl.textContent = 'Loading top events...';
  try{
    const mode = topMode.value || 'count';
    const res = await fetch(base + '/top-events?mode=' + encodeURIComponent(mode));
    if(!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const body = await res.json();
    const queryTime = res.headers.get('X-Query-Time-ms');
    const source = res.headers.get('X-Data-Source') || 'unknown';
    renderTopEvents(body.results, body.mode, queryTime);
    statusEl.textContent = `Loaded top events (mode=${body.mode}) — source: ${source} — DB query ${queryTime ? queryTime + ' ms' : 'unknown'}`;
  }catch(e){
    statusEl.textContent = 'Error: ' + e.message;
  }
}

function renderBets(bets){
  listEl.innerHTML = '';
  if(!bets || !bets.length) { listEl.innerHTML = '<li class="muted">No bets found</li>'; return }
  bets.forEach(b=>{
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
  })
}

function renderEvents(events){
  listEl.innerHTML = '';
  if(!events || !events.length) { listEl.innerHTML = '<li class="muted">No events found</li>'; return }
  events.forEach(ev=>{
    const li = document.createElement('li');
    const date = ev.tapahtuma_pvm ? new Date(ev.tapahtuma_pvm).toLocaleString() : '';
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
  })
}

function renderUsers(users){
  listEl.innerHTML = '';
  if(!users || !users.length) { listEl.innerHTML = '<li class="muted">No users found</li>'; return }
  users.forEach(u=>{
    const li = document.createElement('li');
    const name = (u.nimi && typeof u.nimi === 'object') ? `${escapeHtml(u.nimi.etunimi || '')} ${escapeHtml(u.nimi.sukunimi || '')}` : escapeHtml(u.nimi || '—');
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
  })
}

function renderTopEvents(items, mode, queryTime){
  listEl.innerHTML = '';
  const headerLi = document.createElement('li');
  headerLi.className = 'muted';
  headerLi.style.fontSize = '0.9rem';
  headerLi.textContent = `Top events (mode=${mode}) — DB query: ${queryTime ? queryTime + ' ms' : 'unknown'}`;
  listEl.appendChild(headerLi);
  if(!items || !items.length) { listEl.innerHTML += '<li class="muted">No top events</li>'; return }
  items.forEach(it=>{
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
  })
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]) }

// Load bets on page open
fetchBets();
