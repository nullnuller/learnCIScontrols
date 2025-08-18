const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  controls: [],
  search: '',
  filters: { ig1: true, ig2: true, ig3: true },
  filtersCsf: { ID: true, PR: true, DE: true, RS: true, RC: true },
  sort: 'num',
  studyId: null,
  bookmarks: new Set(JSON.parse(localStorage.getItem('cisv8-bookmarks') || '[]')),
  progress: JSON.parse(localStorage.getItem('cisv8-progress') || '{}'),
  challenge: localStorage.getItem('cisv8-challenge') || 'easy',
  modeScenario: JSON.parse(localStorage.getItem('cisv8-modeScenario') || 'true')
};

function saveProgress(){ localStorage.setItem('cisv8-progress', JSON.stringify(state.progress)); }

function setThemeToggle(){
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored) root.classList.toggle('light', stored === 'light');
  $('#themeToggle').addEventListener('click', () => {
    const nowLight = !root.classList.contains('light');
    root.classList.toggle('light', nowLight);
    localStorage.setItem('theme', nowLight ? 'light' : 'dark');
  });
}

function switchView(name){
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${name}`));
}

function wireNav(){
  $$('.tab').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.tab)));
  $$('[data-nav]').forEach(a => a.addEventListener('click', () => switchView(a.dataset.nav)));
}

function controlMatches(ctrl){
  const query = state.search.trim().toLowerCase();
  const text = `${ctrl.num} ${ctrl.title} ${ctrl.summary} ${ctrl.tags.join(' ')}`.toLowerCase();
  if (query && !text.includes(query)) return false;
  const selected = [state.filters.ig1 && 'IG1', state.filters.ig2 && 'IG2', state.filters.ig3 && 'IG3'].filter(Boolean);
  if (selected.length === 0) return false;
  if (!ctrl.ig.some(ig => selected.includes(ig))) return false;
  // CSF filters
  const csfSelected = Object.entries(state.filtersCsf).filter(([,v])=>v).map(([k])=>k);
  if (csfSelected.length){
    const csfList = Array.isArray(ctrl.csf) ? ctrl.csf : [];
    if (!csfList.some(code => csfSelected.includes(code))) return false;
  }
  const starBox = document.getElementById('filterStar');
  if (starBox && starBox.checked && !state.bookmarks.has(ctrl.id)) return false;
  return true;
}

function renderControls(){
  const grid = $('#controlsGrid');
  const list = state.controls.filter(controlMatches).sort((a,b)=>{
    if (state.sort === 'name') return a.title.localeCompare(b.title);
    return a.num - b.num;
  });
  grid.innerHTML = '';
  for (const c of list){
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-head">
        <div class="num">${String(c.num).padStart(2,'0')}</div>
        <div class="title">${c.title}</div>
      </div>
      <p class="desc">${c.summary}</p>
      <div class="tags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <button class="star ${state.bookmarks.has(c.id)?'active':''}" title="Bookmark" aria-label="Bookmark">★</button>
    `;
    card.addEventListener('click', (e) => { if (!e.target.classList.contains('star')) openDialog(c); });
    card.querySelector('.star').addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.bookmarks.has(c.id)) state.bookmarks.delete(c.id); else state.bookmarks.add(c.id);
      localStorage.setItem('cisv8-bookmarks', JSON.stringify([...state.bookmarks]));
      renderControls();
      updateInsights();
    });
    grid.appendChild(card);
  }
}

function openDialog(c){
  $('#dlgNum').textContent = String(c.num).padStart(2,'0');
  $('#dlgTitle').textContent = c.title;
  $('#dlgDesc').textContent = c.summary;
  const fill = (id, items) => {
    const ul = $(id);
    ul.innerHTML = items.map(x=>`<li>${x}</li>`).join('');
  };
  fill('#dlgWhy', c.why);
  fill('#dlgHow', c.how);
  fill('#dlgMetrics', c.metrics);
  $('#detailDialog').hidden = false;

  $('#btnAddToStudy').onclick = () => {
    state.studyId = c.id;
    buildStudy(c.id);
    switchView('study');
    $('#detailDialog').hidden = true;
  };
}

function closeDialog(){ $('#detailDialog').hidden = true; }

function buildStudy(id){
  const c = state.controls.find(x => x.id === id) || state.controls[Math.floor(Math.random()*state.controls.length)];
  state.studyId = c.id;
  $('#flashFront').innerHTML = `<div class="muted">Control</div><h3>${String(c.num).padStart(2,'0')} · ${c.title}</h3><p>${c.why[0]}</p>`;
  $('#flashBack').innerHTML = `<div class="muted">How to implement</div><ul>${c.how.slice(0,4).map(x=>`<li>${x}</li>`).join('')}</ul>`;
  const ul = $('#checklist');
  ul.innerHTML = '';
  const key = `chk-${c.id}`;
  const saved = state.progress[key] || [];
  c.checklist.forEach((item, idx) => {
    const li = document.createElement('li');
    const idc = `${key}-${idx}`;
    const checked = !!saved[idx];
    li.innerHTML = `<input type="checkbox" id="${idc}" ${checked?'checked':''}/><label for="${idc}">${item}</label>`;
    li.querySelector('input').addEventListener('change', (e) => {
      const arr = state.progress[key] || [];
      arr[idx] = e.target.checked;
      state.progress[key] = arr;
      saveProgress();
      updateKPIs();
    });
    ul.appendChild(li);
  });

  renderQuiz(c);
}

function wireStudy(){
  $('#flashcard').addEventListener('click', () => $('#flashcard').classList.toggle('flipped'));
  $('#btnRandom').addEventListener('click', () => buildStudy());
  $('#btnResetProgress').addEventListener('click', () => { state.progress = {}; saveProgress(); buildStudy(state.studyId); });
}

function wireControls(){
  // Debounced search
  let t;
  $('#searchInput').addEventListener('input', (e)=>{ clearTimeout(t); t=setTimeout(()=>{ state.search = e.target.value; renderControls(); }, 200); });
  $('#filterIG1').addEventListener('change', (e)=>{ state.filters.ig1 = e.target.checked; renderControls(); });
  $('#filterIG2').addEventListener('change', (e)=>{ state.filters.ig2 = e.target.checked; renderControls(); });
  $('#filterIG3').addEventListener('change', (e)=>{ state.filters.ig3 = e.target.checked; renderControls(); });
  const hook = (id,key)=>{ const el=document.getElementById(id); if(el){ el.addEventListener('change',(e)=>{ state.filtersCsf[key] = e.target.checked; renderControls(); }); }};
  hook('filterID','ID'); hook('filterPR','PR'); hook('filterDE','DE'); hook('filterRS','RS'); hook('filterRC','RC');
  const fs = document.getElementById('filterStar'); if (fs) fs.addEventListener('change', () => renderControls());
  $('#sortSelect').addEventListener('change', (e)=>{ state.sort = e.target.value; renderControls(); });
}

function wireDialog(){
  $('#dlgClose').addEventListener('click', closeDialog);
  $('#detailDialog').addEventListener('click', (e)=>{ if (e.target === $('#detailDialog')) closeDialog(); });
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeDialog(); });
}

function wireShortcuts(){
  window.addEventListener('keydown', (e)=>{
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#searchInput').focus(); }
    if ((e.ctrlKey || e.metaKey) && e.key === '1') switchView('overview');
    if ((e.ctrlKey || e.metaKey) && e.key === '2') switchView('controls');
    if ((e.ctrlKey || e.metaKey) && e.key === '3') switchView('study');
  });
}

function computeProgress(){
  const keys = Object.keys(state.progress);
  let done = 0, total = 0;
  for (const k of keys){
    const arr = state.progress[k] || [];
    total += arr.length;
    done += arr.filter(Boolean).length;
  }
  const pct = total ? Math.round((done/total)*100) : 0;
  return { done, total, pct };
}

function updateKPIs(){
  const kc = document.getElementById('kpiControls'); if (kc) kc.textContent = state.controls.length;
  const ks = document.getElementById('kpiSafeguards'); if (ks) ks.textContent = 153;
  const kp = document.getElementById('kpiProgress'); if (kp) { const p = computeProgress(); kp.textContent = `${p.pct}%`; }
}

function updateInsights(){
  const ul = document.getElementById('insightsList'); if (!ul) return;
  const ig1 = state.controls.filter(c=>c.ig.includes('IG1'));
  const quickWins = ig1.slice(0,5).map(c=>`<a href="#" data-jump="${c.id}">${String(c.num).padStart(2,'0')} ${c.title}</a>`);
  const bookmarks = [...state.bookmarks].map(id=>state.controls.find(c=>c.id===id)).filter(Boolean);
  ul.innerHTML = `
    <li><strong>IG1 priorities:</strong> ${quickWins.join(', ')}.</li>
    <li><strong>Bookmarked:</strong> ${bookmarks.length ? bookmarks.map(c=>`<a href="#" data-jump="${c.id}">${String(c.num).padStart(2,'0')}</a>`).join(' ') : 'none'}.</li>`;
  $$('[data-jump]').forEach(a=>a.addEventListener('click',(e)=>{ e.preventDefault(); switchView('controls'); const id=a.getAttribute('data-jump'); const idx = state.controls.findIndex(c=>c.id===id); const cards = $$('.card'); const card = cards[idx]; if(card){card.scrollIntoView({behavior:'smooth',block:'center'});} }));
}

async function loadData(){
  const isFile = location.protocol === 'file:';
  const readInline = () => {
    const el = document.getElementById('controlsData');
    if (el && el.textContent.trim()) {
      try { return JSON.parse(el.textContent).controls || []; } catch { return []; }
    }
    return [];
  };

  if (isFile) {
    // Avoid CORS errors entirely when opened via file://
    state.controls = readInline();
    return;
  }

  try {
    const res = await fetch('data/controls.json');
    if(!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    state.controls = data.controls;
  } catch {
    state.controls = readInline();
  }
}

async function init(){
  setThemeToggle();
  wireNav();
  wireControls();
  wireDialog();
  wireShortcuts();
  wireStudy();
  await loadData();
  renderControls();
  buildStudy(state.controls[0]?.id);
  updateKPIs();
  updateInsights();
  // Gentle hint if running from file:// and inline data is minimal
  if (location.protocol === 'file:') {
    const ul = document.getElementById('insightsList');
    if (ul) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.innerHTML = 'Tip: For full dataset and no CORS warnings, run a local server (e.g., <code>python3 -m http.server 8000</code>) and open <code>http://localhost:8000</code>.';
      ul.appendChild(li);
    }
  }

  wireDataLoader();
}

function renderQuiz(c){
  const challengeSelect = document.getElementById('challengeSelect');
  const modeScenario = document.getElementById('modeScenario');
  if (challengeSelect){ challengeSelect.value = state.challenge; challengeSelect.onchange = () => { state.challenge = challengeSelect.value; localStorage.setItem('cisv8-challenge', state.challenge); renderQuiz(c); }; }
  if (modeScenario){ modeScenario.checked = !!state.modeScenario; modeScenario.onchange = () => { state.modeScenario = modeScenario.checked; localStorage.setItem('cisv8-modeScenario', JSON.stringify(state.modeScenario)); renderQuiz(c); }; }

  // Scenarios
  const sel = document.getElementById('scenarioSelect');
  const text = document.getElementById('scenarioText');
  const explain = document.getElementById('scenarioExplain');
  const btnExplain = document.getElementById('btnScenarioExplain');
  sel.innerHTML = '';
  if (Array.isArray(c.scenarios) && c.scenarios.length){
    c.scenarios.forEach((s, i)=>{
      const opt = document.createElement('option');
      opt.value = String(i); opt.textContent = `Scenario ${i+1}`; sel.appendChild(opt);
    });
    const show = (i)=>{ text.textContent = c.scenarios[i].text; explain.textContent = c.scenarios[i].explanation || ''; explain.classList.add('hidden'); buildSafeguardChoices(c, i); };
    sel.onchange = ()=> show(Number(sel.value));
    btnExplain.onclick = ()=> explain.classList.toggle('hidden');
    show(0);
  } else {
    sel.innerHTML = '<option>None</option>';
    text.textContent = 'No scenario available for this control yet.';
    explain.textContent = '';
    buildSafeguardChoices(c, 0);
  }

  // NIST CSF chips
  const csfMap = { ID: 'Identify', PR: 'Protect', DE: 'Detect', RS: 'Respond', RC: 'Recover' };
  const csfChoices = document.getElementById('csfChoices');
  csfChoices.innerHTML = '';
  Object.entries(csfMap).forEach(([code, label])=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.value = code;
    b.textContent = `${label} (${code})`;
    b.onclick = ()=> b.classList.toggle('active');
    csfChoices.appendChild(b);
  });

  // Build safeguards choices according to mode + challenge
  function buildSafeguardChoices(ctrl, scenarioIndex){
    const sgWrap = document.getElementById('safeguardChoices');
    sgWrap.innerHTML = '';
    const scenario = (ctrl.scenarios && ctrl.scenarios[scenarioIndex]) || {};
    const target = (state.modeScenario && Array.isArray(scenario.safeguards) && scenario.safeguards.length)
      ? scenario.safeguards
      : (ctrl.safeguards || []).map(s=>s.id);

    // Correct set objects
    const correctObjs = (ctrl.safeguards || []).filter(s=>target.includes(s.id));

    // Decoys from other controls
    const allSg = state.controls.flatMap(cc=> (cc.id!==ctrl.id ? (cc.safeguards||[]) : []));
    const exclude = new Set(target);
    const decoyPool = allSg.filter(s=>!exclude.has(s.id));
    const need = state.challenge==='hard' ? 6 : state.challenge==='medium' ? 4 : 2;
    const decoys = sample(decoyPool, need);

    // Build combined choices and shuffle
    const choices = [...correctObjs, ...decoys];
    shuffle(choices);
    choices.forEach(sg=>{
      const div = document.createElement('label');
      div.className = 'choice';
      div.innerHTML = `<input type="checkbox" value="${sg.id}"> <span><strong>${sg.id}</strong> – ${sg.title}</span>`;
      sgWrap.appendChild(div);
    });
  }

  // IG checkboxes reset
  ['IG1','IG2','IG3'].forEach(code=>{
    const box = document.querySelector(`#qIG input[value="${code}"]`);
    if (box) box.checked = false;
  });

  // Check answers
  const btnCheck = document.getElementById('btnCheckQuiz');
  const result = document.getElementById('quizResult');
  btnCheck.onclick = ()=>{
    let score = 0; let total = 3;

    // IG grading
    const pickedIG = ['IG1','IG2','IG3'].filter(code=>document.querySelector(`#qIG input[value="${code}"]`).checked);
    const correctIG = c.ig.slice().sort().join(',');
    const pickedIGStr = pickedIG.slice().sort().join(',');
    if (pickedIGStr === correctIG) score++;

    // CSF grading
    const pickedCSF = [...document.querySelectorAll('#csfChoices .chip.active')].map(b=>b.dataset.value).sort().join(',');
    const correctCSF = (c.csf || []).slice().sort().join(',');
    if (pickedCSF === correctCSF) score++;

    // Safeguards grading
    const scenarioIndex = Number(document.getElementById('scenarioSelect')?.value || 0);
    const scenario = (c.scenarios && c.scenarios[scenarioIndex]) || {};
    const target = (state.modeScenario && Array.isArray(scenario.safeguards) && scenario.safeguards.length)
      ? scenario.safeguards
      : (c.safeguards || []).map(s=>s.id);
    const pickedSG = [...document.querySelectorAll('#safeguardChoices input:checked')].map(i=>i.value).sort().join(',');
    const correctSG = target.slice().sort().join(',');
    // Mark choices
    document.querySelectorAll('#safeguardChoices .choice').forEach(ch=>{
      ch.classList.remove('correct','incorrect');
      const val = ch.querySelector('input').value;
      if (target.includes(val)){
        if (ch.querySelector('input').checked) ch.classList.add('correct');
      } else if (ch.querySelector('input').checked) {
        ch.classList.add('incorrect');
      }
    });
    if (pickedSG === correctSG) score++;

    result.textContent = `Score: ${score}/${total}`;
  };
}

// Utils
function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function sample(arr, n){ const copy=[...arr]; shuffle(copy); return copy.slice(0, Math.max(0, Math.min(n, copy.length))); }

function wireDataLoader(){
  const fileInput = document.getElementById('csvFile');
  const btnApply = document.getElementById('btnApplyCSV');
  const btnExport = document.getElementById('btnExportJSON');
  const status = document.getElementById('loaderStatus');
  if (!fileInput) return;

  let parsed = null;
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (!f) { btnApply.disabled = true; status.textContent = ''; return; }
    const text = await f.text();
    try {
      parsed = parseCSV(text);
      status.textContent = `Parsed ${parsed.rows} rows, ${parsed.controls.length} controls.`;
      btnApply.disabled = false;
    } catch (e) {
      status.textContent = `Failed to parse CSV: ${e.message}`;
      btnApply.disabled = true;
    }
  });

  btnApply?.addEventListener('click', () => {
    if (!parsed) return;
    state.controls = parsed.controls;
    renderControls();
    buildStudy(state.controls[0]?.id);
    updateKPIs();
    updateInsights();
    status.textContent = 'Applied CSV to in-memory dataset. (Not saved to file)';
  });

  btnExport?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({controls: state.controls}, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'controls.json'; a.click(); URL.revokeObjectURL(url);
  });
}

function parseCSV(text){
  // Expect headers: control_num,control_title,sg_id,sg_title,igs,csf
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error('Empty file');
  const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
  const idx = (name) => headers.indexOf(name);
  const need = ['control_num','control_title','sg_id','sg_title','igs','csf'];
  for (const n of need){ if (idx(n) === -1) throw new Error(`Missing column: ${n}`); }
  const map = new Map();
  for (let i=1;i<lines.length;i++){
    const row = parseCSVRow(lines[i]);
    if (!row) continue;
    const num = Number(row[idx('control_num')]);
    if (!num) continue;
    const title = row[idx('control_title')];
    const sgId = row[idx('sg_id')];
    const sgTitle = row[idx('sg_title')];
    const igs = (row[idx('igs')]||'').split(/;|,|\s+/).filter(Boolean);
    const csf = (row[idx('csf')]||'').split(/;|,|\s+/).filter(Boolean);
    if (!map.has(num)){
      map.set(num, { id:`c${num}`, num, title, summary:'', ig:[...new Set(igs)], csf:[...new Set(csf)], tags:[], why:[], how:[], metrics:[], checklist:[], safeguards:[], scenarios:[] });
    }
    const ctrl = map.get(num);
    ctrl.title = title || ctrl.title;
    ctrl.ig = [...new Set([...(ctrl.ig||[]), ...igs])];
    ctrl.csf = [...new Set([...(ctrl.csf||[]), ...csf])];
    if (sgId) ctrl.safeguards.push({id: sgId, title: sgTitle});
  }
  const controls = Array.from(map.values()).sort((a,b)=>a.num-b.num);
  return { rows: lines.length-1, controls };
}

function parseCSVRow(line){
  // Minimal CSV parser to handle quoted commas
  const out = []; let cur = ''; let inQ = false;
  for (let i=0;i<line.length;i++){
    const ch = line[i];
    if (ch==='"'){
      if (inQ && line[i+1]==='"'){ cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch===',' && !inQ){ out.push(cur); cur=''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out.map(s=>s.trim());
}

init();
