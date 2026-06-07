// ── ページ定義 ──────────────────────────────────────────────────────────
const PAGES = {
  dashboard: { page: () => DashboardPage,  title: 'ダッシュボード', icon: '🏠' },
  companies: { page: () => CompaniesPage,  title: '企業管理',       icon: '🏢' },
  es:        { page: () => ESPage,         title: 'ES管理',         icon: '📄' },
  calendar:  { page: () => CalendarPage,   title: 'カレンダー',     icon: '📅' },
  memo:      { page: () => MemoPage,       title: 'メモ',           icon: '📝' },
  analysis:  { page: () => AnalysisPage,   title: '選考分析',       icon: '📊' },
  settings:  { page: () => SettingsPage,   title: '設定',           icon: '⚙️'  },
  motiv:     { page: () => MotivPage,      title: 'やる気を失った俺たちへ', icon: '🔥', hidden: true }
};

const App = {
  _current: null,

  init() {
    this._buildNav();
    window.addEventListener('hashchange', () => this._onHash());
    const hash = location.hash.replace('#','') || 'dashboard';
    this.navigate(hash);
  },

  navigate(pageKey) {
    if (!PAGES[pageKey]) pageKey = 'dashboard';
    this._current = pageKey;
    location.hash = pageKey;
    this._renderPage(pageKey);
    this._setActiveNav(pageKey);
    this.updateHeaderActions();
  },

  _onHash() {
    const key = location.hash.replace('#','') || 'dashboard';
    if (key !== this._current) this.navigate(key);
  },

  _renderPage(key) {
    const def = PAGES[key];
    const pageObj = def.page();
    document.getElementById('page-title').textContent = def.title;
    document.getElementById('page-container').innerHTML = pageObj.render();
    if (pageObj.mount) pageObj.mount();
  },

  rerender() {
    if (this._current) this._renderPage(this._current);
    this.updateHeaderActions();
  },

  updateHeaderActions() {
    const el = document.getElementById('header-actions');
    if (!el) return;
    const key = this._current;
    if (key === 'companies') {
      el.innerHTML = `<button class="btn btn-primary" onclick="CompaniesPage.openAdd()">+ 企業追加</button>`;
    } else if (key === 'es') {
      el.innerHTML = ESPage.getAddBtn();
    } else if (key === 'memo') {
      el.innerHTML = MemoPage.getAddBtn();
    } else {
      el.innerHTML = '';
    }
  },

  updateSidebarStats() {
    const el = document.getElementById('sidebar-stats');
    if (!el) return;
    const companies = DB.getCompanies();
    const ongoing = companies.filter(c => !c.finalResult).length;
    const todos   = DB.getTodos().filter(t => !t.done).length;
    el.innerHTML = `<span>${companies.length}社 / 選考中 ${ongoing}社</span>${todos > 0 ? `<span style="margin-top:4px;color:#f59e0b">TODO ${todos}件</span>` : ''}`;
  },

  _buildNav() {
    const nav = document.getElementById('nav-list');
    if (!nav) return;
    Object.entries(PAGES).forEach(([key, def]) => {
      if (def.hidden) return;
      const li = document.createElement('li');
      li.innerHTML = `<a class="nav-item" data-page="${key}" href="#${key}">
        <span class="nav-icon">${def.icon}</span>
        <span class="nav-label">${def.title}</span>
      </a>`;
      nav.appendChild(li);
    });
  },

  _setActiveNav(key) {
    document.querySelectorAll('.nav-item').forEach(a => {
      a.classList.toggle('active', a.dataset.page === key);
    });
  }
};

// ── サイドバートグル ────────────────────────────────────────────────────
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── 初期化 ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.updateSidebarStats();
});
