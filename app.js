// ===================== DATA =====================
const STORAGE_KEY = 'peladeiros_itapoa_v1';
const MIN_PLAYERS = 16;
const PLAYERS_PER_TEAM = 8;

const ADMIN_USER = 'darlyson.santos';
const ADMIN_PASS = '40028922';

let isAdminAuthenticated = false;

let state = {
  players: [],
  teams: null,
  matchDate: new Date().toISOString().slice(0, 7)
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar dados', e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===================== HELPERS =====================
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ===================== CORE =====================
function getConfirmed() {
  return state.players.filter(p => p.confirmed);
}

function getArrived() {
  return state.players
    .filter(p => p.arrivedAt)
    .sort((a, b) => new Date(a.arrivedAt) - new Date(b.arrivedAt));
}

function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
    toast('Esse nome já está na lista');
    return false;
  }
  state.players.push({
    id: generateId(),
    name: trimmed,
    confirmed: true,
    arrivedAt: null
  });
  saveState();
  return true;
}

function confirmArrival(id) {
  const p = state.players.find(x => x.id === id);
  if (!p) return;
  if (!p.confirmed) p.confirmed = true;
  if (p.arrivedAt) {
    toast(`${p.name} já está na lista de sorteio`);
    return;
  }
  p.arrivedAt = new Date().toISOString();
  saveState();
  toast(`${p.name} chegou! Posição #${getArrived().length}`);
  render();
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  if (state.teams) state.teams = null;
  saveState();
  toast('Removido da lista');
  render();
}

function drawTeams() {
  if (!isAdminAuthenticated) {
    toast('Apenas o administrador pode sortear');
    return;
  }
  const arrived = getArrived();
  if (arrived.length < MIN_PLAYERS) {
    toast(`Precisa de pelo menos ${MIN_PLAYERS} no campo. Atual: ${arrived.length}`);
    return;
  }
  const selected = arrived.slice(0, MIN_PLAYERS);
  const shuffled = [...selected];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  state.teams = {
    a: shuffled.slice(0, PLAYERS_PER_TEAM),
    b: shuffled.slice(PLAYERS_PER_TEAM, MIN_PLAYERS)
  };
  saveState();
  toast('Times sorteados! ⚽');
  showTeams();
  render();
}

function clearMatch() {
  if (!confirm('Limpar confirmações e chegadas do jogo atual?')) return;
  state.players.forEach(p => {
    p.confirmed = false;
    p.arrivedAt = null;
  });
  state.teams = null;
  saveState();
  toast('Jogo resetado');
  render();
}

function clearAll() {
  if (!confirm('Apagar TODOS os jogadores e dados?')) return;
  state.players = [];
  state.teams = null;
  saveState();
  toast('Tudo limpo');
  render();
}

// ===================== RENDER =====================
function render() {
  const confirmed = getConfirmed();
  const arrived = getArrived();
  const remaining = Math.max(0, MIN_PLAYERS - arrived.length);
  const percent = Math.min(100, Math.round((arrived.length / MIN_PLAYERS) * 100));

  const el = (id) => document.getElementById(id);

  if (el('confirmedCount')) {
    el('confirmedCount').textContent = confirmed.length;
    el('arrivedCountText').textContent = `${arrived.length} no campo`;
    el('pendingCountText').textContent = remaining > 0
      ? `${remaining} restantes para o mínimo`
      : 'Pronto para o sorteio (admin)';
    el('progressPercent').textContent = `${percent}%`;
    el('circleProgress')?.setAttribute('stroke-dasharray', `${percent}, 100`);
  }

  // Lista de participação
  const confList = el('confirmedList');
  const confCount = el('confirmedListCount');
  if (confCount) confCount.textContent = confirmed.length;

  if (confList) {
    if (confirmed.length === 0) {
      confList.innerHTML = `<div class="empty">Ninguém na lista ainda.<br>Toque em “Adicionar meu nome”.</div>`;
    } else {
      confList.innerHTML = confirmed.map(p => {
        const isArrived = !!p.arrivedAt;
        return `
          <div class="list-item" data-id="${p.id}">
            <div class="avatar ${isArrived ? 'arrived' : ''}">${getInitials(p.name)}</div>
            <div class="item-info">
              <div class="item-name">${p.name}</div>
              <div class="item-meta">
                ${isArrived
                  ? '<span class="badge arrived">No campo</span>'
                  : '<span class="badge pending">Toque para confirmar chegada</span>'}
              </div>
            </div>
            <div class="item-value">${isArrived ? '✓' : ''}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Sorteio (ordem de chegada)
  const arrivalList = el('arrivalList');
  const arrivalCount = el('arrivalListCount');
  if (arrivalCount) arrivalCount.textContent = arrived.length;

  if (arrivalList) {
    if (arrived.length === 0) {
      arrivalList.innerHTML = `<div class="empty">Aguardando chegadas no campo.</div>`;
    } else {
      arrivalList.innerHTML = arrived.map((p, i) => `
        <div class="list-item" data-id="${p.id}">
          <div class="avatar arrived">${i + 1}</div>
          <div class="item-info">
            <div class="item-name">${p.name}</div>
          </div>
          <div class="item-value time">${formatTime(p.arrivedAt)}</div>
        </div>
      `).join('');
    }
  }

  document.querySelectorAll('.list-item[data-id]').forEach(item => {
    item.addEventListener('click', () => openActionModal(item.dataset.id));
  });
}

function renderAdminTab() {
  const main = document.getElementById('mainContent');
  const arrived = getArrived();
  const confirmed = getConfirmed();

  main.innerHTML = `
    <div class="admin-card">
      <h3>Status do jogo</h3>
      <div class="info-row"><span>Na participação</span><span>${confirmed.length}</span></div>
      <div class="info-row"><span>No campo (sorteio)</span><span>${arrived.length}</span></div>
      <div class="info-row"><span>Mínimo para sorteio</span><span>${MIN_PLAYERS}</span></div>
      <div class="info-row"><span>Times sorteados</span><span>${state.teams ? 'Sim' : 'Não'}</span></div>
    </div>

    <div class="admin-card">
      <h3>Ações do administrador</h3>
      <div class="admin-actions">
        <button class="btn-primary" id="adminDraw">Sortear times agora</button>
        <button class="btn-secondary" id="adminShowTeams">Ver times</button>
        <button class="btn-secondary" id="adminResetMatch">Resetar jogo atual</button>
        <button class="btn-danger" id="adminClearAll">Apagar todos os dados</button>
      </div>
    </div>

    <div class="admin-card">
      <button class="btn-secondary" id="adminLogout" style="width:100%">Sair da área admin</button>
    </div>
  `;

  document.getElementById('adminDraw')?.addEventListener('click', drawTeams);
  document.getElementById('adminShowTeams')?.addEventListener('click', showTeams);
  document.getElementById('adminResetMatch')?.addEventListener('click', clearMatch);
  document.getElementById('adminClearAll')?.addEventListener('click', clearAll);
  document.getElementById('adminLogout')?.addEventListener('click', () => {
    isAdminAuthenticated = false;
    toast('Você saiu da área administrativa');
    switchTab('home');
  });
}

function renderTeamsTab() {
  const main = document.getElementById('mainContent');

  if (!state.teams) {
    main.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 20px">
        <div style="font-size:48px;margin-bottom:12px">🎲</div>
        <h2 style="margin-bottom:8px">Nenhum time sorteado</h2>
        <p style="color:var(--text-secondary);font-size:14px">
          O admin sorteia quando houver pelo menos ${MIN_PLAYERS} jogadores no campo.
        </p>
      </div>
    `;
    return;
  }

  main.innerHTML = `
    <div class="teams-grid" style="margin-bottom:16px">
      <div class="team team-a">
        <h3>Time A (${state.teams.a.length})</h3>
        <ul>
          ${state.teams.a.map((p, i) => `<li><span>${i + 1}.</span>${p.name}</li>`).join('')}
        </ul>
      </div>
      <div class="team team-b">
        <h3>Time B (${state.teams.b.length})</h3>
        <ul>
          ${state.teams.b.map((p, i) => `<li><span>${i + 1}.</span>${p.name}</li>`).join('')}
        </ul>
      </div>
    </div>
    ${isAdminAuthenticated ? `
      <button class="btn-primary" id="redrawBtn" style="width:100%;margin-bottom:10px">Sortear novamente</button>
      <button class="btn-secondary" id="clearTeamsBtn" style="width:100%">Limpar times</button>
    ` : ''}
  `;

  document.getElementById('redrawBtn')?.addEventListener('click', () => {
    state.teams = null;
    drawTeams();
  });
  document.getElementById('clearTeamsBtn')?.addEventListener('click', () => {
    state.teams = null;
    saveState();
    toast('Times limpos');
    renderTeamsTab();
  });
}

function getHomeHTML() {
  return `
    <section class="card match-info-card">
      <div class="match-badge">PRÓXIMA PELADA</div>
      <div class="match-date">Sábado, 03 de outubro</div>
      <div class="match-time">⏰ 08:00</div>
      <div class="match-place">📍 Itapoã Parque</div>
    </section>

    <section class="card summary-card">
      <div class="summary-left">
        <span class="summary-label">PARTICIPANTES</span>
        <div class="summary-value" id="confirmedCount">0</div>
        <span class="summary-sub">na lista de participação</span>
        <div class="summary-status">
          <span class="dot green"></span>
          <span id="arrivedCountText">0 no campo</span>
        </div>
        <div class="summary-status">
          <span class="dot orange"></span>
          <span id="pendingCountText">0 restantes para o mínimo</span>
        </div>
      </div>
      <div class="progress-circle" id="progressCircle">
        <svg viewBox="0 0 36 36">
          <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          <path class="circle-progress" id="circleProgress" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
        <div class="progress-text">
          <span id="progressPercent">0%</span>
          <small>chegada</small>
        </div>
      </div>
    </section>

    <button class="btn-add-main" id="btnAdd">
      <span class="btn-add-icon">+</span>
      <span>Adicionar meu nome</span>
    </button>

    <section class="card list-card">
      <div class="list-header">
        <h2>Lista de participação</h2>
        <span class="list-count" id="confirmedListCount">0</span>
      </div>
      <p class="list-desc">Toque no seu nome no dia do jogo para confirmar que chegou no campo</p>
      <div class="list" id="confirmedList"></div>
    </section>

    <section class="card list-card">
      <div class="list-header">
        <h2>Sorteio</h2>
        <span class="list-count" id="arrivalListCount">0</span>
      </div>
      <p class="list-desc">Ordem de chegada no campo</p>
      <div class="list" id="arrivalList"></div>
    </section>
  `;
}

// ===================== MODALS =====================
let currentActionId = null;

function openActionModal(id) {
  currentActionId = id;
  const p = state.players.find(x => x.id === id);
  if (!p) return;

  document.getElementById('actionPlayerName').textContent = p.name;

  const arrivalBtn = document.getElementById('btnConfirmArrival');
  if (p.arrivedAt) {
    arrivalBtn.textContent = 'Já confirmou chegada ✓';
    arrivalBtn.disabled = true;
    arrivalBtn.style.opacity = '0.5';
  } else {
    arrivalBtn.textContent = 'Já estou no campo';
    arrivalBtn.disabled = false;
    arrivalBtn.style.opacity = '1';
  }

  document.getElementById('actionOverlay').classList.remove('hidden');
}

function closeActionModal() {
  document.getElementById('actionOverlay').classList.add('hidden');
  currentActionId = null;
}

function showTeams() {
  if (!state.teams) {
    toast('Nenhum time sorteado ainda');
    return;
  }
  document.getElementById('teamA').innerHTML = state.teams.a.map((p, i) =>
    `<li><span>${i + 1}.</span>${p.name}</li>`).join('');
  document.getElementById('teamB').innerHTML = state.teams.b.map((p, i) =>
    `<li><span>${i + 1}.</span>${p.name}</li>`).join('');
  document.getElementById('teamsOverlay').classList.remove('hidden');
}

// ===================== NAV =====================
function switchTab(tab) {
  if (tab === 'admin' && !isAdminAuthenticated) {
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginOverlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('loginUser').focus(), 100);
    return;
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');

  const main = document.getElementById('mainContent');

  if (tab === 'home') {
    main.innerHTML = getHomeHTML();
    // re-bind add button
    document.getElementById('btnAdd')?.addEventListener('click', openAddModal);
    render();
  } else if (tab === 'teams') {
    renderTeamsTab();
  } else if (tab === 'admin') {
    renderAdminTab();
  }
}

function openAddModal() {
  document.getElementById('playerNameInput').value = '';
  document.getElementById('addOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('playerNameInput').focus(), 100);
}

function initEvents() {
  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add player (header may not exist; main button is re-bound on tab switch)
  document.getElementById('btnAdd')?.addEventListener('click', openAddModal);

  document.getElementById('cancelAdd').addEventListener('click', () => {
    document.getElementById('addOverlay').classList.add('hidden');
  });

  document.getElementById('confirmAdd').addEventListener('click', () => {
    const name = document.getElementById('playerNameInput').value;
    if (addPlayer(name)) {
      document.getElementById('addOverlay').classList.add('hidden');
      toast(`${name.trim()} entrou na lista!`);
      const active = document.querySelector('.nav-item.active')?.dataset.tab || 'home';
      if (active === 'home') render();
      else switchTab(active);
    }
  });

  document.getElementById('playerNameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirmAdd').click();
  });

  // Action modal
  document.getElementById('cancelAction').addEventListener('click', closeActionModal);

  document.getElementById('btnConfirmArrival').addEventListener('click', () => {
    if (currentActionId) confirmArrival(currentActionId);
    closeActionModal();
  });

  document.getElementById('btnRemovePlayer').addEventListener('click', () => {
    if (currentActionId && confirm('Remover este nome da lista?')) {
      removePlayer(currentActionId);
      closeActionModal();
    }
  });

  // Help
  document.getElementById('btnHelp')?.addEventListener('click', () => {
    document.getElementById('helpOverlay').classList.remove('hidden');
  });
  document.getElementById('closeHelp')?.addEventListener('click', () => {
    document.getElementById('helpOverlay').classList.add('hidden');
  });

  // Teams overlay
  document.getElementById('closeTeams').addEventListener('click', () => {
    document.getElementById('teamsOverlay').classList.add('hidden');
  });

  document.getElementById('btnRedraw').addEventListener('click', () => {
    if (!isAdminAuthenticated) {
      toast('Apenas o administrador pode sortear novamente');
      return;
    }
    state.teams = null;
    drawTeams();
  });

  // Login
  document.getElementById('cancelLogin').addEventListener('click', () => {
    document.getElementById('loginOverlay').classList.add('hidden');
  });

  document.getElementById('confirmLogin').addEventListener('click', () => {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      isAdminAuthenticated = true;
      document.getElementById('loginOverlay').classList.add('hidden');
      toast('Bem-vindo, administrador!');
      switchTab('admin');
    } else {
      document.getElementById('loginError').style.display = 'block';
      document.getElementById('loginPass').value = '';
      document.getElementById('loginPass').focus();
    }
  });

  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirmLogin').click();
  });
  document.getElementById('loginUser').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPass').focus();
  });

  // Backdrop close
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.add('hidden');
    });
  });
}

// ===================== INIT =====================
loadState();
initEvents();
render();
