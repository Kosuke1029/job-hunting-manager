const DashboardPage = {
  _sortDir: 1,

  render() {
    const companies = DB.getCompanies();
    const allSteps  = DB.getSteps();
    const compMap   = {};
    companies.forEach(c => compMap[c.id] = c);

    const ongoing  = companies.filter(c => { const s = getComputedStatus(c); return !s.finalResult; });
    const passed   = companies.filter(c => { const s = getComputedStatus(c); return s.finalResult === 'IS参加決定' || s.finalResult === '内定'; });
    const rejected = companies.filter(c => { const s = getComputedStatus(c); return s.finalResult === 'お祈り'; });
    const today = new Date(); today.setHours(0,0,0,0);
    const in14  = new Date(today.getTime() + 14 * 86400000);

    // 選考ステップから直近イベントを収集
    const upcomingSteps = allSteps
      .filter(s => {
        if (!s.date || s.result === 'お祈り' || s.result === '辞退' || s.result === '通過') return false;
        const d = new Date(s.date);
        return d >= today && d <= in14;
      })
      .map(s => ({ ...s, _d: new Date(s.date), _company: compMap[s.companyId] }))
      .filter(s => s._company && !s._company.finalResult);

    // ステップ未登録企業のフォールバック（scheduleDate）
    const companiesWithSteps = new Set(allSteps.map(s => s.companyId));
    const upcomingCompanies = companies
      .filter(c => {
        const st = getComputedStatus(c);
        if (!st.nextDate || companiesWithSteps.has(c.id)) return false;
        if (st.finalResult) return false;
        const d = new Date(st.nextDate);
        return d >= today && d <= in14;
      })
      .map(c => ({ ...c, _d: new Date(getComputedStatus(c).nextDate) }));

    const allUpcoming = [
      ...upcomingSteps.map(s => ({ date: s.date, _d: s._d, name: s.name, company: s._company, isStep: true })),
      ...upcomingCompanies.map(c => ({ date: c.scheduleDate, _d: c._d, name: c.currentStage || '', company: c, isStep: false }))
    ].sort((a,b) => this._sortDir * (a._d - b._d));

    // 本選考内定・インターン参加決定カウンター
    const honOffers   = companies.filter(c => c.type === '本選考'  && getComputedStatus(c).finalResult === '内定').length;
    const internPassed = companies.filter(c => c.type === 'インターン' && getComputedStatus(c).finalResult === 'IS参加決定').length;

    const stageCnt = {};
    ongoing.forEach(c => {
      const st = getComputedStatus(c);
      if (st.currentStage) stageCnt[st.currentStage] = (stageCnt[st.currentStage]||0)+1;
    });

    const recentCompanies = [...companies]
      .sort((a,b) => new Date(b.updatedAt||b.createdAt) - new Date(a.updatedAt||a.createdAt))
      .slice(0,6);

    return `
<div class="page-content">
  <div class="stats-grid">
    ${this._statCard('登録企業数', companies.length, 'blue',  iconBuilding(), 'all')}
    ${this._statCard('選考中',     ongoing.length,   'indigo', iconTrend(),    'ongoing')}
    ${this._statCard('通過・内定', passed.length,    'green',  iconCheck(),    'passed')}
    ${this._statCard('お祈り',     rejected.length,  'red',    iconX(),        'rejected')}
  </div>

  <div class="dashboard-counter-row">
    <div class="counter-card counter-hon" style="cursor:pointer" onclick="DashboardPage.showCompanyList('honOffers')" title="クリックして企業一覧を表示">
      <div class="counter-value">${honOffers}</div>
      <div class="counter-label">🎉 本選考 内定</div>
    </div>
    <div class="counter-card counter-intern" style="cursor:pointer" onclick="DashboardPage.showCompanyList('internPassed')" title="クリックして企業一覧を表示">
      <div class="counter-value">${internPassed}</div>
      <div class="counter-label">✅ インターン 参加決定</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">直近14日のスケジュール</h3>
        <button class="btn btn-ghost btn-sm" onclick="DashboardPage.toggleSort()">
          ${this._sortDir === 1 ? '↑ 日付昇順' : '↓ 日付降順'}
        </button>
      </div>
      <div class="card-body">
        ${allUpcoming.length === 0
          ? '<p class="empty-msg">直近14日以内のスケジュールはありません</p>'
          : `<table class="table">
              <thead><tr><th>企業名</th><th>タイプ</th><th>選考ステップ</th><th>日程</th><th>残り</th></tr></thead>
              <tbody>
                ${allUpcoming.map(ev => {
                  const d = daysUntil(ev.date);
                  const cls = d !== null && d <= 3 ? 'text-danger fw-bold' : d !== null && d <= 7 ? 'text-warning fw-bold' : '';
                  const c = ev.company;
                  return `<tr style="cursor:pointer" onclick="CompaniesPage.openDetail('${c.id}')">
                    <td><b>${esc(c.name)}</b></td>
                    <td>${renderCompanyTypeBadge(c.type)}</td>
                    <td>${ev.isStep ? esc(ev.name) : renderStageBadge(ev.name)}</td>
                    <td>${formatDate(ev.date)}</td>
                    <td class="${cls}">${d === 0 ? '今日' : `${d}日後`}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`
        }
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">選考ステージ分布（進行中）</h3></div>
      <div class="card-body">
        ${ongoing.length === 0
          ? '<p class="empty-msg">進行中の企業がありません</p>'
          : Object.entries(stageCnt)
              .filter(([,cnt]) => cnt > 0)
              .sort((a,b) => b[1] - a[1])
              .map(([s, cnt]) => {
                const pct = Math.round(cnt / ongoing.length * 100);
                const c = STAGE_COLOR[s] || '#6366f1';
                return `<div class="stage-bar-row">
                  <span class="stage-label">${esc(s)}</span>
                  <div class="stage-track"><div class="stage-fill" style="width:${pct}%;background:${c}"></div></div>
                  <span class="stage-count">${cnt}</span>
                </div>`;
              }).join('')
        }
      </div>
    </div>
  </div>

  ${recentCompanies.length > 0 ? `
  <div class="card mt-4">
    <div class="card-header">
      <h3 class="card-title">最近の企業</h3>
      <button class="card-link" onclick="App.navigate('companies')">全て見る →</button>
    </div>
    <div class="card-body p0">
      <table class="table table-hover">
        <thead><tr><th>企業名</th><th>タイプ</th><th>業界</th><th>Tier</th><th>選考状況</th></tr></thead>
        <tbody>
          ${recentCompanies.map(c => {
            const st = getComputedStatus(c);
            return `<tr style="cursor:pointer" onclick="CompaniesPage.openDetail('${c.id}')">
              <td><b>${esc(c.name)}</b></td>
              <td>${renderCompanyTypeBadge(c.type)}</td>
              <td>${renderIndustryBadge(c.industry)}</td>
              <td>${renderTierBadge(c.tier)}</td>
              <td>${st.finalResult ? renderResultBadge(st.finalResult) : renderCurrentStageBadge(st.currentStage)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>` : ''}
</div>`;
  },

  toggleSort() { this._sortDir *= -1; App.rerender(); },

  showCompanyList(filter) {
    const companies = DB.getCompanies();
    let filtered, title;
    if (filter === 'all') {
      filtered = companies;
      title = `登録企業一覧（${companies.length}社）`;
    } else if (filter === 'ongoing') {
      filtered = companies.filter(c => !getComputedStatus(c).finalResult);
      title = `選考中の企業（${filtered.length}社）`;
    } else if (filter === 'passed') {
      filtered = companies.filter(c => {
        const s = getComputedStatus(c);
        return s.finalResult === 'IS参加決定' || s.finalResult === '内定';
      });
      title = `通過・内定の企業（${filtered.length}社）`;
    } else if (filter === 'rejected') {
      filtered = companies.filter(c => getComputedStatus(c).finalResult === 'お祈り');
      title = `お祈りの企業（${filtered.length}社）`;
    } else if (filter === 'honOffers') {
      filtered = companies.filter(c => c.type === '本選考' && getComputedStatus(c).finalResult === '内定');
      title = `本選考 内定企業（${filtered.length}社）`;
    } else if (filter === 'internPassed') {
      filtered = companies.filter(c => c.type === 'インターン' && getComputedStatus(c).finalResult === 'IS参加決定');
      title = `インターン 参加決定企業（${filtered.length}社）`;
    } else { return; }

    Modal.show({
      title,
      wide: true,
      noFooter: true,
      body: `
        ${filtered.length === 0
          ? '<p class="empty-msg m-4">該当する企業がありません</p>'
          : `<table class="table table-hover">
              <thead><tr><th>企業名</th><th>タイプ</th><th>業界</th><th>Tier</th><th>選考状況</th></tr></thead>
              <tbody>
                ${filtered.map(c => {
                  const st = getComputedStatus(c);
                  return `<tr style="cursor:pointer" onclick="Modal.close();CompaniesPage.openDetail('${c.id}')">
                    <td><b>${esc(c.name)}</b></td>
                    <td>${renderCompanyTypeBadge(c.type)}</td>
                    <td>${renderIndustryBadge(c.industry)}</td>
                    <td>${renderTierBadge(c.tier)}</td>
                    <td>${st.finalResult ? renderResultBadge(st.finalResult) : renderCurrentStageBadge(st.currentStage)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`
        }
        <div class="modal-detail-actions mt-4">
          <button class="btn btn-ghost btn-sm" onclick="Modal.close()">閉じる</button>
        </div>
      `
    });
  },

  _statCard(label, value, color, icon, filter) {
    const clickAttr = filter ? `style="cursor:pointer" onclick="DashboardPage.showCompanyList('${filter}')"` : '';
    return `<div class="stat-card" ${clickAttr}>
      <div class="stat-icon si-${color}">${icon}</div>
      <div class="stat-body">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    </div>`;
  },

  mount() {}
};

function iconBuilding() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M9 21V7l7-4v18M9 11h4M9 15h4"/></svg>`;
}
function iconTrend() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
}
function iconCheck() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
}
function iconX() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
}
