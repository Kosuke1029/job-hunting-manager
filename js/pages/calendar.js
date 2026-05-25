const CalendarPage = {
  _year:  new Date().getFullYear(),
  _month: new Date().getMonth(),
  _filterType: '',

  render() {
    return `
<div class="page-content">
  <div class="cal-controls card mb-3">
    <button class="btn btn-ghost btn-sm" onclick="CalendarPage.prevMonth()">← 前月</button>
    <h2 class="cal-title">${this._year}年${this._month + 1}月</h2>
    <button class="btn btn-ghost btn-sm" onclick="CalendarPage.nextMonth()">次月 →</button>
    <button class="btn btn-primary btn-sm" onclick="CalendarPage.goToday()">今日</button>
    <select class="filter-select" onchange="CalendarPage.onFilterType(this.value)">
      <option value="">全タイプ</option>
      ${COMPANY_TYPES.map(t => `<option value="${t}" ${this._filterType===t?'selected':''}>${t}</option>`).join('')}
    </select>
  </div>

  <div class="card">
    <div class="cal-grid-header">
      ${['日','月','火','水','木','金','土'].map((d,i) =>
        `<div class="cal-dow ${i===0?'cal-sun':i===6?'cal-sat':''}">${d}</div>`
      ).join('')}
    </div>
    <div class="cal-grid">
      ${this._buildGrid()}
    </div>
  </div>

  <div class="card mt-3">
    <div class="card-header"><h3 class="card-title">${this._year}年${this._month + 1}月 スケジュール一覧</h3></div>
    <div class="card-body">
      ${this._buildAgenda()}
    </div>
  </div>
</div>`;
  },

  mount() {},

  _getEvents() {
    const companies = DB.getCompanies();
    const compMap = {};
    companies.forEach(c => compMap[c.id] = c);
    const events = [];

    DB.getSteps().forEach(s => {
      if (!s.date) return;
      const c = compMap[s.companyId];
      if (!c) return;
      if (this._filterType && c.type !== this._filterType) return;
      events.push({
        date: s.date,
        label: `${c.name} / ${s.name}`,
        result: s.result || '未定',
        type: c.type,
        companyId: s.companyId,
        dateType: s.dateType || '予定日',
        notes: s.notes || ''
      });
    });

    const companiesWithSteps = new Set(DB.getSteps().map(s => s.companyId));
    companies.forEach(c => {
      if (!c.scheduleDate || companiesWithSteps.has(c.id)) return;
      if (this._filterType && c.type !== this._filterType) return;
      events.push({
        date: c.scheduleDate,
        label: `${c.name}${c.currentStage ? ' / ' + c.currentStage : ''}`,
        result: c.finalResult || '未定',
        type: c.type,
        companyId: c.id,
        dateType: '予定日',
        notes: ''
      });
    });

    return events;
  },

  _buildGrid() {
    const events = this._getEvents();
    const eventsByDate = {};
    events.forEach(e => {
      if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
      eventsByDate[e.date].push(e);
    });

    const first = new Date(this._year, this._month, 1);
    const last  = new Date(this._year, this._month + 1, 0);
    const today = new Date(); today.setHours(0,0,0,0);
    const cells = [];

    for (let i = 0; i < first.getDay(); i++) cells.push('<div class="cal-cell cal-cell-empty"></div>');

    for (let d = 1; d <= last.getDate(); d++) {
      const dateStr = `${this._year}-${String(this._month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayDate = new Date(this._year, this._month, d);
      const isToday  = dayDate.getTime() === today.getTime();
      const isSun = dayDate.getDay() === 0;
      const isSat = dayDate.getDay() === 6;
      const dayEvents = eventsByDate[dateStr] || [];

      cells.push(`<div class="cal-cell${isToday?' cal-today':''}${isSun?' cal-sun-cell':''}${isSat?' cal-sat-cell':''}" onclick="CalendarPage.showDayDetail('${dateStr}')">
        <div class="cal-date">${d}</div>
        <div class="cal-events">
          ${dayEvents.slice(0,3).map(e => {
            const dotColor = STEP_RESULT_COLOR[e.result] || '#94a3b8';
            const shortLabel = e.label.length > 12 ? e.label.slice(0,12)+'…' : e.label;
            return `<div class="cal-event-chip" style="background:${dotColor}18;border-left:3px solid ${dotColor}" title="${esc(e.label)}">${esc(shortLabel)}</div>`;
          }).join('')}
          ${dayEvents.length > 3 ? `<div class="cal-event-more">+${dayEvents.length - 3}件</div>` : ''}
        </div>
      </div>`);
    }

    const remaining = (7 - (first.getDay() + last.getDate()) % 7) % 7;
    for (let i = 0; i < remaining; i++) cells.push('<div class="cal-cell cal-cell-empty"></div>');

    return cells.join('');
  },

  _buildAgenda() {
    const events = this._getEvents()
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === this._year && d.getMonth() === this._month;
      })
      .sort((a,b) => a.date < b.date ? -1 : 1);

    if (events.length === 0) return '<p class="empty-msg">この月のスケジュールはありません</p>';

    let lastDate = '';
    return events.map(e => {
      const header = e.date !== lastDate
        ? `<div class="agenda-date-header">${formatDate(e.date)}</div>` : '';
      lastDate = e.date;
      const d = daysUntil(e.date);
      const dotColor = STEP_RESULT_COLOR[e.result] || '#94a3b8';
      const countdownCls = d !== null && d >= 0 && (e.result === '未定' || e.result === '進行中')
        ? (d <= 3 ? 'text-danger fw-bold' : d <= 7 ? 'text-warning fw-bold' : 'text-muted') : 'text-muted';

      return `${header}<div class="agenda-item" onclick="CompaniesPage.openDetail('${e.companyId}')">
        <div class="agenda-dot" style="background:${dotColor}"></div>
        <div class="agenda-body">
          <div class="agenda-label">${esc(e.label)}</div>
          <div class="flex-row gap-2">
            ${renderCompanyTypeBadge(e.type)}
            <span class="text-sm text-muted">${esc(e.dateType)}</span>
            ${renderStepResultBadge(e.result)}
            ${d !== null && d >= 0 && (e.result === '未定' || e.result === '進行中')
              ? `<span class="text-sm ${countdownCls}">${d === 0 ? '今日' : `${d}日後`}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  },

  showDayDetail(dateStr) {
    const events = this._getEvents().filter(e => e.date === dateStr);
    if (events.length === 0) return;
    Modal.show({
      title: `${formatDate(dateStr)} のスケジュール`,
      noFooter: true,
      body: `
        ${events.map(e => {
          const dotColor = STEP_RESULT_COLOR[e.result] || '#94a3b8';
          return `<div class="agenda-item" style="cursor:pointer" onclick="Modal.close();CompaniesPage.openDetail('${e.companyId}')">
            <div class="agenda-dot" style="background:${dotColor}"></div>
            <div class="agenda-body">
              <div class="agenda-label">${esc(e.label)}</div>
              <div class="flex-row gap-2">
                ${renderCompanyTypeBadge(e.type)}
                <span class="text-sm text-muted">${esc(e.dateType)}</span>
                ${renderStepResultBadge(e.result)}
                ${e.notes ? `<span class="text-sm text-muted">${esc(e.notes)}</span>` : ''}
              </div>
            </div>
          </div>`;
        }).join('')}
        <div class="text-right mt-3">
          <button class="btn btn-ghost btn-sm" onclick="Modal.close()">閉じる</button>
        </div>`
    });
  },

  prevMonth() {
    this._month--;
    if (this._month < 0) { this._month = 11; this._year--; }
    App.rerender();
  },
  nextMonth() {
    this._month++;
    if (this._month > 11) { this._month = 0; this._year++; }
    App.rerender();
  },
  goToday() {
    this._year  = new Date().getFullYear();
    this._month = new Date().getMonth();
    App.rerender();
  },
  onFilterType(val) { this._filterType = val; App.rerender(); }
};
