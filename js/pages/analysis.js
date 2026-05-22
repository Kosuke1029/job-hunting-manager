const AnalysisPage = {
  _charts: [],

  render() {
    return `
<div class="page-content">
  <div class="analysis-grid">
    <div class="card">
      <div class="card-header"><h3 class="card-title">ステージ別落選数</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-stage"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">Tier別 応募・結果</h3></div>
      <div class="card-body chart-wrap"><canvas id="chart-tier"></canvas></div>
    </div>
    <div class="card span-2">
      <div class="card-header"><h3 class="card-title">月別 応募数推移</h3></div>
      <div class="card-body chart-wrap-wide"><canvas id="chart-monthly"></canvas></div>
    </div>
  </div>

  <div class="stats-summary card mt-4">
    <div class="card-header"><h3 class="card-title">選考サマリー</h3></div>
    <div class="card-body" id="summary-body"></div>
  </div>
</div>`;
  },

  mount() {
    this._charts.forEach(c => { try { c.destroy(); } catch {} });
    this._charts = [];
    if (typeof Chart === 'undefined') {
      document.querySelector('.page-content').insertAdjacentHTML('afterbegin',
        '<div class="alert alert-warn">グラフ表示にはインターネット接続が必要です（Chart.js CDN）</div>');
      this._renderSummary();
      return;
    }
    this._renderStageChart();
    this._renderTierChart();
    this._renderMonthlyChart();
    this._renderSummary();
  },

  _renderStageChart() {
    const companies = DB.getCompanies();
    const rejected = companies.filter(c => c.finalResult === 'お祈り');
    const stageLabels = [...STAGES, ...RESULTS];
    const stageCnt = {};
    stageLabels.forEach(s => stageCnt[s] = 0);
    // 進行中 = 各ステージにいる数
    companies.filter(c => !c.finalResult).forEach(c => { if (c.currentStage) stageCnt[c.currentStage]++; });
    // お祈りになったとき最後のステージで落ちた
    rejected.forEach(c => { if (c.currentStage) stageCnt[c.currentStage]++; });

    const labels = STAGES.filter(s => stageCnt[s] > 0);
    const data   = labels.map(s => stageCnt[s]);
    const colors = labels.map(s => STAGE_COLOR[s] || '#6b7280');

    const ctx = document.getElementById('chart-stage');
    if (!ctx) return;
    this._charts.push(new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: '企業数', data, backgroundColor: colors, borderRadius: 6 }] },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  },

  _renderTierChart() {
    const companies = DB.getCompanies();
    const labels = TIERS.filter(t => companies.some(c => c.tier === t));
    const ongoing  = labels.map(t => companies.filter(c => c.tier===t && !c.finalResult).length);
    const passed   = labels.map(t => companies.filter(c => c.tier===t && (c.finalResult==='IS参加決定'||c.finalResult==='内定')).length);
    const rejected = labels.map(t => companies.filter(c => c.tier===t && c.finalResult==='お祈り').length);

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

  _renderMonthlyChart() {
    const companies = DB.getCompanies();
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
  },

  _renderSummary() {
    const companies = DB.getCompanies();
    const total    = companies.length;
    const ongoing  = companies.filter(c => !c.finalResult).length;
    const passed   = companies.filter(c => c.finalResult==='IS参加決定'||c.finalResult==='内定').length;
    const rejected = companies.filter(c => c.finalResult==='お祈り').length;
    const concluded = passed + rejected;
    const passRate = concluded > 0 ? Math.round(passed / concluded * 100) : 0;
    const esCount  = DB.getES().length;
    const ivCount  = DB.getInterviews().length;

    const el = document.getElementById('summary-body');
    if (!el) return;
    el.innerHTML = `
      <div class="summary-grid">
        ${this._summaryItem('総登録企業', total + '社')}
        ${this._summaryItem('選考中', ongoing + '社')}
        ${this._summaryItem('通過・内定', passed + '社')}
        ${this._summaryItem('お祈り', rejected + '社')}
        ${this._summaryItem('最終通過率', passRate + '%')}
        ${this._summaryItem('登録ESエントリー', esCount + '件')}
        ${this._summaryItem('面接メモ', ivCount + '件')}
      </div>`;
  },

  _summaryItem(label, value) {
    return `<div class="summary-item"><div class="summary-val">${value}</div><div class="summary-lbl">${label}</div></div>`;
  }
};
