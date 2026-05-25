const AnalysisPage = {
  _charts: [],
  _filterType: '',

  render() {
    return `
<div class="page-content">
  <!-- タイプフィルター -->
  <div class="filter-bar card mb-3">
    <span style="font-size:13px;font-weight:600;color:var(--text-2)">絞り込み:</span>
    <select class="filter-select" onchange="AnalysisPage.setFilter(this.value)">
      <option value="">全タイプ</option>
      ${COMPANY_TYPES.map(t => `<option value="${t}" ${this._filterType===t?'selected':''}>${t}</option>`).join('')}
    </select>
  </div>

  <!-- KPIカード -->
  <div id="kpi-row">${this._renderKPI()}</div>

  <!-- チャートグリッド -->
  <div class="analysis-grid mt-3">
    <div class="card">
      <div class="card-header"><h3 class="card-title">選考ステップ別 通過 / お祈り</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-steps"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">Tier別 応募・結果</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-tier"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">業界別 応募・通過</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-industry"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">インターン vs 本選考</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-type"></canvas></div>
    </div>
    <div class="card span-2">
      <div class="card-header"><h3 class="card-title">月別 応募数推移</h3></div>
      <div class="card-body chart-wrap-wide"><canvas id="chart-monthly"></canvas></div>
    </div>
  </div>

  <!-- ステップ別通過率テーブル -->
  <div class="card mt-3">
    <div class="card-header"><h3 class="card-title">選考ステップ別 通過率詳細</h3></div>
    <div class="card-body p0">${this._renderStepTable()}</div>
  </div>
</div>`;
  },

  setFilter(val) { this._filterType = val; App.rerender(); },

  mount() {
    this._charts.forEach(c => { try { c.destroy(); } catch {} });
    this._charts = [];
    if (typeof Chart === 'undefined') {
      document.querySelector('.page-content').insertAdjacentHTML('afterbegin',
        '<div class="alert alert-warn">グラフ表示にはインターネット接続が必要です（Chart.js CDN）</div>');
      return;
    }
    this._renderStepsChart();
    this._renderTierChart();
    this._renderIndustryChart();
    this._renderTypeChart();
    this._renderMonthlyChart();
  },

  _getCompanies() {
    let list = DB.getCompanies();
    if (this._filterType) list = list.filter(c => c.type === this._filterType);
    return list;
  },

  // ── KPI ──────────────────────────────────────────────────────
  _renderKPI() {
    const companies = this._getCompanies();
    const allSteps  = DB.getSteps();
    const compSet   = new Set(companies.map(c => c.id));

    const statuses  = companies.map(c => getComputedStatus(c));
    const total     = companies.length;
    const ongoing   = statuses.filter(s => !s.finalResult).length;
    const passed    = statuses.filter(s => s.finalResult === 'IS参加決定' || s.finalResult === '内定').length;
    const rejected  = statuses.filter(s => s.finalResult === 'お祈り').length;
    const concluded = passed + rejected;
    const passRate  = concluded > 0 ? Math.round(passed / concluded * 100) : 0;
    const esCount   = DB.getES().filter(e => compSet.has(e.companyId)).length;

    // 最もお祈りが多いステップ
    const failMap = {};
    allSteps.forEach(s => {
      if (!compSet.has(s.companyId)) return;
      if (s.result === 'お祈り') failMap[s.name] = (failMap[s.name]||0) + 1;
    });
    const hardest = Object.entries(failMap).sort((a,b)=>b[1]-a[1])[0];

    // 通過率の色
    const rateColor = passRate >= 50 ? '#10b981' : passRate >= 25 ? '#f59e0b' : passed === 0 ? '#6b7280' : '#ef4444';

    const items = [
      { label: '登録企業',   value: total + '社',   color: '#6366f1' },
      { label: '選考中',     value: ongoing + '社',  color: '#3b82f6' },
      { label: '内定・通過', value: passed + '社',   color: '#10b981' },
      { label: 'お祈り',     value: rejected + '社', color: '#6b7280' },
      { label: '最終通過率', value: passRate + '%',  color: rateColor },
      { label: 'ES登録数',   value: esCount + '件',  color: '#8b5cf6' },
      { label: '最難関ステップ', value: hardest ? `${hardest[0]}（${hardest[1]}社）` : '—', color: '#ef4444' },
    ];

    return `<div class="kpi-row">
      ${items.map(item => `<div class="kpi-card" style="border-top:3px solid ${item.color}">
        <div class="kpi-value" style="color:${item.color}">${esc(item.value)}</div>
        <div class="kpi-label">${esc(item.label)}</div>
      </div>`).join('')}
    </div>`;
  },

  // ── ステップ別通過率テーブル ──────────────────────────────────
  _renderStepTable() {
    const companies = this._getCompanies();
    const compSet   = new Set(companies.map(c => c.id));
    const allSteps  = DB.getSteps().filter(s => compSet.has(s.companyId));

    const stats = {};
    allSteps.forEach(s => {
      if (!stats[s.name]) stats[s.name] = { pass: 0, fail: 0, active: 0 };
      const st = stats[s.name];
      if      (s.result === '通過') st.pass++;
      else if (s.result === 'お祈り' || s.result === '辞退') st.fail++;
      else    st.active++;
    });

    const rows = Object.entries(stats).sort((a,b) => (b[1].pass+b[1].fail+b[1].active) - (a[1].pass+a[1].fail+a[1].active));
    if (rows.length === 0) {
      return '<p class="empty-msg m-4">選考ステップのデータがありません。企業詳細の「選考フロー」タブから追加してください。</p>';
    }

    return `<table class="table">
      <thead>
        <tr>
          <th>選考ステップ</th>
          <th style="text-align:center">参加</th>
          <th style="text-align:center">通過</th>
          <th style="text-align:center">お祈り/辞退</th>
          <th style="text-align:center">進行中</th>
          <th>通過率</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([name, st]) => {
          const concluded = st.pass + st.fail;
          const rate = concluded > 0 ? Math.round(st.pass / concluded * 100) : null;
          const barColor = rate === null ? '#94a3b8' : rate >= 60 ? '#10b981' : rate >= 35 ? '#f59e0b' : '#ef4444';
          return `<tr>
            <td><b>${esc(name)}</b></td>
            <td style="text-align:center">${st.pass + st.fail + st.active}</td>
            <td style="text-align:center;color:#10b981;font-weight:700">${st.pass}</td>
            <td style="text-align:center;color:#ef4444;font-weight:700">${st.fail}</td>
            <td style="text-align:center;color:#6b7280">${st.active}</td>
            <td style="min-width:120px">
              ${rate !== null
                ? `<div class="rate-bar-wrap">
                    <div class="rate-track"><div class="rate-fill" style="width:${rate}%;background:${barColor}"></div></div>
                    <span style="color:${barColor};font-weight:700;font-size:13px;white-space:nowrap">${rate}%</span>
                   </div>`
                : '<span class="text-muted text-sm">集計中</span>'}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  },

  // ── Charts ────────────────────────────────────────────────────
  _renderStepsChart() {
    const companies = this._getCompanies();
    const compSet   = new Set(companies.map(c => c.id));
    const allSteps  = DB.getSteps().filter(s => compSet.has(s.companyId));

    const stats = {};
    allSteps.forEach(s => {
      if (s.result === '通過') {
        if (!stats[s.name]) stats[s.name] = { pass:0, fail:0 };
        stats[s.name].pass++;
      } else if (s.result === 'お祈り' || s.result === '辞退') {
        if (!stats[s.name]) stats[s.name] = { pass:0, fail:0 };
        stats[s.name].fail++;
      }
    });

    const entries = Object.entries(stats).filter(([,st]) => st.pass + st.fail > 0)
                           .sort((a,b) => b[1].pass + b[1].fail - (a[1].pass + a[1].fail));
    if (entries.length === 0) return;

    const ctx = document.getElementById('chart-steps');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(([n]) => n),
        datasets: [
          { label: '通過', data: entries.map(([,st]) => st.pass), backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'お祈り/辞退', data: entries.map(([,st]) => st.fail), backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }, y: { stacked: true } }
      }
    }));
  },

  _renderTierChart() {
    const companies = this._getCompanies();
    const labels = TIERS.filter(t => companies.some(c => c.tier === t));
    const statusOf = c => getComputedStatus(c);
    const ongoing  = labels.map(t => companies.filter(c => c.tier===t && !statusOf(c).finalResult).length);
    const passed   = labels.map(t => companies.filter(c => c.tier===t && (statusOf(c).finalResult==='IS参加決定'||statusOf(c).finalResult==='内定')).length);
    const rejected = labels.map(t => companies.filter(c => c.tier===t && statusOf(c).finalResult==='お祈り').length);

    const ctx = document.getElementById('chart-tier');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '選考中', data: ongoing,  backgroundColor: '#6366f1', borderRadius: 4 },
          { label: '通過・内定', data: passed, backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'お祈り', data: rejected, backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  },

  _renderIndustryChart() {
    const companies = this._getCompanies();
    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
    if (industries.length === 0) return;

    const statusOf = c => getComputedStatus(c);
    const ctx = document.getElementById('chart-industry');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: industries,
        datasets: [
          { label: '選考中',    data: industries.map(i => companies.filter(c => c.industry===i && !statusOf(c).finalResult).length), backgroundColor: '#6366f1', borderRadius: 4 },
          { label: '内定・通過', data: industries.map(i => companies.filter(c => c.industry===i && (statusOf(c).finalResult==='内定'||statusOf(c).finalResult==='IS参加決定')).length), backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'お祈り',    data: industries.map(i => companies.filter(c => c.industry===i && statusOf(c).finalResult==='お祈り').length), backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }, y: { stacked: true } }
      }
    }));
  },

  _renderTypeChart() {
    const all = DB.getCompanies();
    const statusOf = c => getComputedStatus(c);
    const make = type => ({
      ongoing:  all.filter(c => c.type === type && !statusOf(c).finalResult).length,
      passed:   all.filter(c => c.type === type && (statusOf(c).finalResult==='内定'||statusOf(c).finalResult==='IS参加決定')).length,
      rejected: all.filter(c => c.type === type && statusOf(c).finalResult==='お祈り').length,
    });
    const hon  = make('本選考');
    const inte = make('インターン');

    const ctx = document.getElementById('chart-type');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          '本選考：選考中', '本選考：内定', '本選考：お祈り',
          'インターン：選考中', 'インターン：参加決定', 'インターン：お祈り'
        ],
        datasets: [{
          data: [ hon.ongoing, hon.passed, hon.rejected, inte.ongoing, inte.passed, inte.rejected ],
          backgroundColor: ['#6366f1','#10b981','#6b7280','#f59e0b','#34d399','#9ca3af'],
          borderWidth: 2, borderColor: '#fff'
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 14 } } },
        cutout: '50%'
      }
    }));
  },

  _renderMonthlyChart() {
    const companies = this._getCompanies();
    const monthMap = {};
    companies.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}`;
      monthMap[key] = (monthMap[key]||0)+1;
    });
    const labels = Object.keys(monthMap).sort();
    const data   = labels.map(k => monthMap[k]);

    const ctx = document.getElementById('chart-monthly');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '応募企業数',
          data,
          fill: true,
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderColor: '#6366f1',
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#6366f1'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  }
};
