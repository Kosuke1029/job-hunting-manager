const CompaniesPage = {
  _filter: { tier: '', industry: '', stage: '', search: '' },
  _sort: { key: 'updatedAt', dir: -1 },

  render() {
    const companies = this._filtered();
    return `
<div class="page-content">
  <!-- フィルターバー -->
  <div class="filter-bar card">
    <input class="filter-input" id="search-input" type="text" placeholder="企業名で検索..." value="${esc(this._filter.search)}" oninput="CompaniesPage.onSearch(this.value)">
    <select class="filter-select" onchange="CompaniesPage.onFilter('tier',this.value)">
      <option value="">全Tier</option>
      ${TIERS.map(t => `<option value="${t}" ${this._filter.tier===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <select class="filter-select" onchange="CompaniesPage.onFilter('industry',this.value)">
      <option value="">全業界</option>
      ${INDUSTRIES.map(i => `<option value="${i}" ${this._filter.industry===i?'selected':''}>${i}</option>`).join('')}
    </select>
    <select class="filter-select" onchange="CompaniesPage.onFilter('stage',this.value)">
      <option value="">全ステージ</option>
      ${STAGES.map(s => `<option value="${s}" ${this._filter.stage===s?'selected':''}>${s}</option>`).join('')}
      ${RESULTS.map(r => `<option value="${r}" ${this._filter.stage===r?'selected':''}>${r}</option>`).join('')}
    </select>
    <span class="filter-count">${companies.length}社</span>
  </div>

  <!-- テーブル -->
  <div class="card mt-3">
    <div class="card-body p0">
      ${companies.length === 0
        ? '<p class="empty-msg m-4">企業が見つかりません。右上の「＋企業追加」から追加してください。</p>'
        : `<table class="table table-hover">
            <thead>
              <tr>
                <th class="sortable" onclick="CompaniesPage.sort('name')">企業名 ${this._sortIcon('name')}</th>
                <th>業界</th>
                <th class="sortable" onclick="CompaniesPage.sort('tier')">Tier ${this._sortIcon('tier')}</th>
                <th>選考状況</th>
                <th class="sortable" onclick="CompaniesPage.sort('scheduleDate')">日程 ${this._sortIcon('scheduleDate')}</th>
                <th>応募方法</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => this._row(c)).join('')}
            </tbody>
          </table>`
      }
    </div>
  </div>
</div>`;
  },

  _row(c) {
    const d = c.scheduleDate ? daysUntil(c.scheduleDate) : null;
    const dateClass = d !== null && !c.finalResult && d >= 0 && d <= 3 ? 'text-danger fw-bold' : d !== null && !c.finalResult && d <= 7 ? 'text-warning fw-bold' : '';
    return `<tr class="company-row" onclick="CompaniesPage.openDetail('${c.id}')">
      <td><b>${esc(c.name)}</b></td>
      <td>${renderIndustryBadge(c.industry)}</td>
      <td>${renderTierBadge(c.tier)}</td>
      <td>${c.finalResult ? renderResultBadge(c.finalResult) : renderStageBadge(c.currentStage)}</td>
      <td class="${dateClass}">${formatDate(c.scheduleDate)}</td>
      <td><span class="text-muted text-sm">${esc(c.applicationMethod||'')}</span></td>
      <td onclick="event.stopPropagation()">
        <div class="action-btns">
          <button class="btn-icon" title="編集" onclick="CompaniesPage.openEdit('${c.id}')">✏️</button>
          <button class="btn-icon btn-icon-danger" title="削除" onclick="CompaniesPage.confirmDelete('${c.id}','${esc(c.name)}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  },

  _filtered() {
    let list = DB.getCompanies();
    const { tier, industry, stage, search } = this._filter;
    if (search) list = list.filter(c => c.name.includes(search));
    if (tier)     list = list.filter(c => c.tier === tier);
    if (industry) list = list.filter(c => c.industry === industry);
    if (stage)    list = list.filter(c => c.finalResult === stage || c.currentStage === stage);
    list.sort((a,b) => {
      let va = a[this._sort.key] || '', vb = b[this._sort.key] || '';
      if (this._sort.key === 'tier') { va = TIERS.indexOf(va); vb = TIERS.indexOf(vb); }
      return va < vb ? -this._sort.dir : va > vb ? this._sort.dir : 0;
    });
    return list;
  },

  _sortIcon(key) {
    if (this._sort.key !== key) return '<span class="sort-icon">↕</span>';
    return this._sort.dir === 1 ? '<span class="sort-icon active">↑</span>' : '<span class="sort-icon active">↓</span>';
  },

  sort(key) {
    if (this._sort.key === key) this._sort.dir *= -1;
    else { this._sort.key = key; this._sort.dir = 1; }
    App.rerender();
  },

  onSearch(val) { this._filter.search = val; App.rerender(); },
  onFilter(key, val) { this._filter[key] = val; App.rerender(); },

  mount() {},

  // ── 追加・編集フォーム ────────────────────────────────────────
  openAdd() {
    Modal.show({
      title: '企業を追加',
      body: this._form({}),
      onSubmit: () => {
        const d = getFormData('company-form');
        if (!d.name) { Toast.error('企業名は必須です'); return; }
        DB.addCompany(d);
        Modal.close(); Toast.success('企業を追加しました');
        App.rerender(); App.updateSidebarStats();
      }
    });
  },

  openEdit(id) {
    const c = DB.getCompanies().find(x => x.id === id);
    if (!c) return;
    Modal.show({
      title: '企業を編集',
      body: this._form(c),
      onSubmit: () => {
        const d = getFormData('company-form');
        if (!d.name) { Toast.error('企業名は必須です'); return; }
        DB.updateCompany(id, d);
        Modal.close(); Toast.success('更新しました');
        App.rerender();
      }
    });
  },

  confirmDelete(id, name) {
    Modal.confirm({
      title: '企業を削除',
      message: `「${name}」を削除します。関連するES・面接メモ・OB訪問も全て削除されます。`,
      danger: true,
      onConfirm: () => {
        DB.deleteCompany(id); Toast.success('削除しました');
        App.rerender(); App.updateSidebarStats();
      }
    });
  },

  _form(c = {}) {
    return `<form id="company-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">企業名 <span class="req">*</span></label>
        <input class="form-input" name="name" value="${esc(c.name||'')}" placeholder="例）株式会社〇〇" required>
      </div>
      <div class="form-group">
        <label class="form-label">業界</label>
        <select class="form-select" name="industry">${selectOptions(INDUSTRIES, c.industry)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Tier</label>
        <select class="form-select" name="tier">${selectOptions(TIERS, c.tier)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">選考ステージ</label>
        <select class="form-select" name="currentStage">${selectOptions(STAGES, c.currentStage)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">応募方法</label>
        <select class="form-select" name="applicationMethod">${selectOptions(METHODS, c.applicationMethod)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">日程（面接日・締切日など）</label>
        <input class="form-input" name="scheduleDate" type="date" value="${esc(c.scheduleDate||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">最終結果（決定後に入力）</label>
        <select class="form-select" name="finalResult">${selectOptions(RESULTS, c.finalResult, '未確定')}</select>
      </div>
      <div class="form-group span-2">
        <label class="form-label">メモ</label>
        <textarea class="form-textarea" name="notes" rows="3" placeholder="備考・感想など">${esc(c.notes||'')}</textarea>
      </div>
    </form>`;
  },

  // ── 企業詳細モーダル ──────────────────────────────────────────
  openDetail(id) {
    const c = DB.getCompanies().find(x => x.id === id);
    if (!c) return;
    const esEntries = DB.getES().filter(e => e.companyId === id);
    const interviews = DB.getInterviews().filter(i => i.companyId === id);
    const obog = DB.getOBOG().filter(o => o.companyId === id);

    Modal.show({
      title: c.name,
      wide: true,
      noFooter: true,
      body: `
        <div class="detail-badges mb-3">
          ${renderIndustryBadge(c.industry)}
          ${renderTierBadge(c.tier)}
          ${c.finalResult ? renderResultBadge(c.finalResult) : renderStageBadge(c.currentStage)}
          <span class="text-muted text-sm ml-2">${esc(c.applicationMethod||'')}</span>
          ${c.scheduleDate ? `<span class="text-muted text-sm">| 日程: ${formatDate(c.scheduleDate)}</span>` : ''}
        </div>
        ${c.notes ? `<p class="detail-notes mb-3">${esc(c.notes)}</p>` : ''}

        <div class="detail-tabs" id="detail-tabs">
          <button class="dtab active" onclick="CompaniesPage._switchTab(this,'tab-es')">ES (${esEntries.length})</button>
          <button class="dtab" onclick="CompaniesPage._switchTab(this,'tab-iv')">面接メモ (${interviews.length})</button>
          <button class="dtab" onclick="CompaniesPage._switchTab(this,'tab-ob')">OB/OG訪問 (${obog.length})</button>
        </div>

        <div id="tab-es" class="dtab-body">
          <div class="mb-2 text-right">
            <button class="btn btn-sm btn-primary" onclick="ESPage.openAdd('${id}', '${esc(c.name)}')">+ ES追加</button>
          </div>
          ${esEntries.length === 0 ? '<p class="empty-msg">ESがありません</p>' :
            esEntries.map((e, idx) => `
              <div class="es-card">
                <div class="es-card-header">
                  <div class="flex-row gap-2">
                    <span class="es-num">設問 ${idx+1}</span>
                    ${renderQualityBadge(e.quality)}
                    ${e.submittedDate ? `<span class="text-sm text-muted">提出: ${formatDate(e.submittedDate)}</span>` : ''}
                  </div>
                  <div>
                    <button class="btn-icon" onclick="ESPage.openEdit('${e.id}')">✏️</button>
                    <button class="btn-icon btn-icon-danger" onclick="ESPage.confirmDelete('${e.id}')">🗑️</button>
                  </div>
                </div>
                <p class="es-question"><b>Q: ${esc(e.question)}</b></p>
                <p class="es-answer">${esc(e.answer)}</p>
                <span class="es-charcount">${e.charCount}文字</span>
              </div>`).join('')
          }
        </div>

        <div id="tab-iv" class="dtab-body hidden">
          <div class="mb-2 text-right">
            <button class="btn btn-sm btn-primary" onclick="MemoPage.openAddInterview('${id}', '${esc(c.name)}')">+ 面接メモ追加</button>
          </div>
          ${interviews.length === 0 ? '<p class="empty-msg">面接メモがありません</p>' :
            interviews.map(iv => `
              <div class="iv-card">
                <div class="iv-card-header">
                  <b>${esc(iv.stage)}</b>
                  <span class="text-sm text-muted">${formatDate(iv.date)}</span>
                  <div>
                    <button class="btn-icon" onclick="MemoPage.openEditInterview('${iv.id}')">✏️</button>
                    <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeleteInterview('${iv.id}')">🗑️</button>
                  </div>
                </div>
                ${iv.questions ? `<p class="text-sm"><b>質問:</b> ${esc(iv.questions)}</p>` : ''}
                ${iv.myAnswers ? `<p class="text-sm"><b>回答:</b> ${esc(iv.myAnswers)}</p>` : ''}
                ${iv.feedback  ? `<p class="text-sm"><b>振り返り:</b> ${esc(iv.feedback)}</p>` : ''}
              </div>`).join('')
          }
        </div>

        <div id="tab-ob" class="dtab-body hidden">
          <div class="mb-2 text-right">
            <button class="btn btn-sm btn-primary" onclick="MemoPage.openAddOBOG('${id}', '${esc(c.name)}')">+ OB/OG追加</button>
          </div>
          ${obog.length === 0 ? '<p class="empty-msg">OB/OG訪問記録がありません</p>' :
            obog.map(o => `
              <div class="iv-card">
                <div class="iv-card-header">
                  <b>${esc(o.personName)}</b>
                  <span class="text-sm text-muted">${formatDate(o.date)}</span>
                  <div>
                    <button class="btn-icon" onclick="MemoPage.openEditOBOG('${o.id}')">✏️</button>
                    <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeleteOBOG('${o.id}')">🗑️</button>
                  </div>
                </div>
                ${o.notes ? `<p class="text-sm">${esc(o.notes)}</p>` : ''}
              </div>`).join('')
          }
        </div>

        <div class="modal-detail-actions mt-4">
          <button class="btn btn-ghost btn-sm" onclick="Modal.close()">閉じる</button>
          <button class="btn btn-primary btn-sm" onclick="Modal.close();CompaniesPage.openEdit('${id}')">編集する</button>
        </div>
      `
    });
  },

  _switchTab(btn, tabId) {
    document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dtab-body').forEach(b => b.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(tabId).classList.remove('hidden');
  }
};
