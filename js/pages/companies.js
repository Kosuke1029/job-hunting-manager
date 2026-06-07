const CompaniesPage = {
  _filter: { tier: '', industry: '', stage: '', search: '', type: '' },
  _sort: { key: 'updatedAt', dir: -1 },
  _detailId: null,

  render() {
    const companies = this._filtered();
    return `
<div class="page-content">
  <!-- フィルターバー -->
  <div class="filter-bar card">
    <input class="filter-input" id="search-input" type="text" placeholder="企業名で検索..." value="${esc(this._filter.search)}" oninput="CompaniesPage.onSearch(this.value)">
    <select class="filter-select" onchange="CompaniesPage.onFilter('type',this.value)">
      <option value="">全タイプ</option>
      ${COMPANY_TYPES.map(t => `<option value="${t}" ${this._filter.type===t?'selected':''}>${t}</option>`).join('')}
    </select>
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
                <th>タイプ</th>
                <th>業界</th>
                <th class="sortable" onclick="CompaniesPage.sort('tier')">Tier ${this._sortIcon('tier')}</th>
                <th>選考状況</th>
                <th class="sortable" onclick="CompaniesPage.sort('scheduleDate')">直近日程 ${this._sortIcon('scheduleDate')}</th>
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
    const status = getComputedStatus(c);
    const steps = DB.getSteps(c.id).filter(s => s.date && s.result !== 'お祈り' && s.result !== '辞退' && s.result !== '通過');
    const nextStep = steps.sort((a,b) => a.date < b.date ? -1 : 1)[0];
    const displayDate = nextStep ? nextStep.date : status.nextDate;
    const displayLabel = nextStep ? nextStep.name : '';
    const d = displayDate ? daysUntil(displayDate) : null;
    const dateClass = d !== null && !status.finalResult && d >= 0 && d <= 3 ? 'text-danger fw-bold' : d !== null && !status.finalResult && d <= 7 ? 'text-warning fw-bold' : '';
    return `<tr class="company-row" onclick="CompaniesPage.openDetail('${c.id}')">
      <td><b>${esc(c.name)}</b></td>
      <td>${renderCompanyTypeBadge(c.type)}</td>
      <td>${renderIndustryBadge(c.industry)}</td>
      <td>${renderTierBadge(c.tier)}</td>
      <td>${status.finalResult ? renderResultBadge(status.finalResult) : renderCurrentStageBadge(status.currentStage)}</td>
      <td class="${dateClass}">
        ${displayDate
          ? `<div>${formatDate(displayDate)}</div>${displayLabel ? `<div class="text-sm text-muted">${esc(displayLabel)}</div>` : ''}`
          : '-'}
      </td>
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
    const { tier, industry, stage, search, type } = this._filter;
    if (search)   list = list.filter(c => c.name.includes(search));
    if (type)     list = list.filter(c => c.type === type);
    if (tier)     list = list.filter(c => c.tier === tier);
    if (industry) list = list.filter(c => c.industry === industry);
    if (stage)    list = list.filter(c => c.finalResult === stage || c.currentStage === stage);
    list.sort((a,b) => {
      let va = a[this._sort.key] || '', vb = b[this._sort.key] || '';
      if (this._sort.key === 'tier') { va = TIERS.indexOf(va); vb = TIERS.indexOf(vb); }
      if (this._sort.key === 'scheduleDate') {
        const sa = DB.getSteps(a.id).filter(s => s.date && s.result !== 'お祈り' && s.result !== '辞退' && s.result !== '通過').sort((x,y) => x.date < y.date ? -1 : 1);
        const sb = DB.getSteps(b.id).filter(s => s.date && s.result !== 'お祈り' && s.result !== '辞退' && s.result !== '通過').sort((x,y) => x.date < y.date ? -1 : 1);
        va = sa[0]?.date || a.scheduleDate || '';
        vb = sb[0]?.date || b.scheduleDate || '';
      }
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

  onSearch(val) {
    this._filter.search = val;
    App.rerender();
    const el = document.getElementById('search-input');
    if (el) { el.focus(); el.setSelectionRange(val.length, val.length); }
  },
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
      message: `「${name}」を削除します。関連するES・面接メモ・OB訪問・選考フローも全て削除されます。`,
      danger: true,
      onConfirm: () => {
        DB.deleteCompany(id); Toast.success('削除しました');
        App.rerender(); App.updateSidebarStats();
      }
    });
  },

  _form(c = {}) {
    const hasSteps = DB.getSteps(c.id || '').length > 0;
    return `<form id="company-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">企業名 <span class="req">*</span></label>
        <input class="form-input" name="name" value="${esc(c.name||'')}" placeholder="例）株式会社〇〇" required>
      </div>
      <div class="form-group">
        <label class="form-label">選考タイプ</label>
        <select class="form-select" name="type">
          <option value="">未設定</option>
          ${COMPANY_TYPES.map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
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
        <label class="form-label">応募方法</label>
        <select class="form-select" name="applicationMethod">${selectOptions(METHODS, c.applicationMethod)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">最終結果（内定・お祈りが決まったら入力）</label>
        <select class="form-select" name="finalResult">${selectOptions(RESULTS, c.finalResult, '未確定')}</select>
      </div>
      ${hasSteps ? `
      <div class="form-group span-2">
        <p class="form-hint" style="background:#e0e7ff;padding:10px 14px;border-radius:8px;color:#4338ca">
          ✅ 選考フローが登録されています。現在の選考状況はフローから自動判定されます。
        </p>
      </div>` : ''}
      <div class="form-group span-2">
        <label class="form-label">メモ</label>
        <textarea class="form-textarea" name="notes" rows="3" placeholder="備考・感想など">${esc(c.notes||'')}</textarea>
      </div>
    </form>`;
  },

  // ── 企業詳細モーダル ──────────────────────────────────────────
  openDetail(id) {
    this._detailId = id;
    const c = DB.getCompanies().find(x => x.id === id);
    if (!c) return;
    const esEntries = DB.getES().filter(e => e.companyId === id);
    const interviews = DB.getInterviews().filter(i => i.companyId === id);
    const obog = DB.getOBOG().filter(o => o.companyId === id);
    const steps = DB.getSteps(id).sort((a,b) => (a.order||0) - (b.order||0) || (a.createdAt||'') < (b.createdAt||'') ? -1 : 1);

    Modal.show({
      title: c.name,
      wide: true,
      noFooter: true,
      body: `
        <div class="detail-badges mb-3">
          ${c.type ? renderCompanyTypeBadge(c.type) : ''}
          ${renderIndustryBadge(c.industry)}
          ${renderTierBadge(c.tier)}
          ${c.finalResult ? renderResultBadge(c.finalResult) : renderStageBadge(c.currentStage)}
          <span class="text-muted text-sm ml-2">${esc(c.applicationMethod||'')}</span>
        </div>
        ${c.notes ? `<p class="detail-notes mb-3">${esc(c.notes)}</p>` : ''}

        <div class="detail-tabs" id="detail-tabs">
          <button class="dtab active" onclick="CompaniesPage._switchTab(this,'tab-flow')">選考フロー (${steps.length})</button>
          <button class="dtab" onclick="CompaniesPage._switchTab(this,'tab-es')">ES (${esEntries.length})</button>
          <button class="dtab" onclick="CompaniesPage._switchTab(this,'tab-iv')">面接メモ (${interviews.length})</button>
          <button class="dtab" onclick="CompaniesPage._switchTab(this,'tab-ob')">OB/OG訪問 (${obog.length})</button>
        </div>

        <div id="tab-flow" class="dtab-body">
          ${this._stepsTabContent(id, steps)}
        </div>

        <div id="tab-es" class="dtab-body hidden">
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
                    ${e.category ? `<span class="badge" style="background:#f3f4f6;color:#6b7280">${esc(e.category)}</span>` : ''}
                    ${e.esResult ? `<span class="badge" style="color:${e.esResult==='通過'?'#10b981':'#6b7280'};background:${e.esResult==='通過'?'#d1fae5':'#f3f4f6'};font-weight:600">書類: ${esc(e.esResult)}</span>` : ''}
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

  // ── 選考フロータブ ────────────────────────────────────────────
  _stepsTabContent(companyId, steps) {
    return `
      <div class="steps-header mb-3">
        <button class="btn btn-sm btn-primary" onclick="CompaniesPage.openAddStep('${companyId}')">+ ステップを追加</button>
      </div>
      ${steps.length === 0
        ? '<p class="empty-msg">選考フローが登録されていません。「＋ステップを追加」から追加してください。</p>'
        : `<div class="steps-timeline">${steps.map((s, idx) => this._stepRow(s, idx, steps.length)).join('')}</div>`
      }`;
  },

  _stepRow(s, idx, total) {
    const isLast = idx === total - 1;
    const dotColor = STEP_RESULT_COLOR[s.result] || '#94a3b8';
    const d = s.date ? daysUntil(s.date) : null;
    const showCountdown = (s.result === '未定' || s.result === '進行中') && d !== null && d >= 0;
    const dateClass = showCountdown && d <= 3 ? 'text-danger fw-bold' : showCountdown && d <= 7 ? 'text-warning fw-bold' : '';
    const isSubmittable = ['ES提出', 'WEBテスト', '動画選考'].includes(s.name);
    const submittedBadge = isSubmittable
      ? (s.submitted
          ? '<span class="badge" style="color:#10b981;background:#d1fae5;border:1px solid #6ee7b7">✓ 提出済み</span>'
          : '<span class="badge" style="color:#ef4444;background:#fee2e2;border:1px solid #fca5a5">未提出</span>')
      : '';
    return `
      <div class="step-row">
        <div class="step-connector">
          <div class="step-dot" style="background:${dotColor};border-color:${dotColor}"></div>
          ${!isLast ? '<div class="step-line"></div>' : ''}
        </div>
        <div class="step-content">
          <div class="step-header">
            <div class="flex-row gap-2">
              <span class="step-num">${idx + 1}</span>
              <b class="step-name">${esc(s.name)}</b>
              ${renderStepResultBadge(s.result)}
              ${s.selectionType ? renderCompanyTypeBadge(s.selectionType) : ''}
              ${submittedBadge}
            </div>
            <div class="action-btns">
              ${isSubmittable && !s.submitted ? `<button class="btn-icon" title="提出済みにする" onclick="CompaniesPage.markStepSubmitted('${s.id}')">✅</button>` : ''}
              <button class="btn-icon" onclick="CompaniesPage.openEditStep('${s.id}')">✏️</button>
              <button class="btn-icon btn-icon-danger" onclick="CompaniesPage.confirmDeleteStep('${s.id}')">🗑️</button>
            </div>
          </div>
          ${s.date ? `<div class="step-date ${dateClass}"><span class="text-muted text-sm">${esc(s.dateType||'予定日')}: </span>${formatDate(s.date)}${showCountdown ? ` <span class="text-sm">(${d === 0 ? '今日' : `${d}日後`})</span>` : ''}</div>` : ''}
          ${s.notes ? `<div class="step-notes">${esc(s.notes)}</div>` : ''}
        </div>
      </div>`;
  },

  markStepSubmitted(stepId) {
    DB.updateStep(stepId, { submitted: true });
    Toast.success('提出済みにしました');
    this.openDetail(this._detailId);
  },

  // ── ステップ追加・編集 ────────────────────────────────────────
  openAddStep(companyId) {
    const company = DB.getCompanies().find(c => c.id === companyId);
    const defaultType = company?.type || '';
    const existing = DB.getSteps(companyId);
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(s => s.order || 0)) + 1 : 1;
    Modal.show({
      title: 'ステップを追加',
      body: this._stepForm({}, nextOrder, defaultType),
      onSubmit: () => {
        const d = getFormData('step-form');
        if (!d.name) { Toast.error('ステップ名を入力してください'); return; }
        DB.addStep({ ...d, companyId, order: parseInt(d.order) || nextOrder });
        Toast.success('ステップを追加しました');
        this.openDetail(this._detailId);
      }
    });
  },

  openEditStep(stepId) {
    const s = DB.getSteps().find(x => x.id === stepId);
    if (!s) return;
    Modal.show({
      title: 'ステップを編集',
      body: this._stepForm(s, s.order || 1),
      onSubmit: () => {
        const d = getFormData('step-form');
        if (!d.name) { Toast.error('ステップ名を入力してください'); return; }
        DB.updateStep(stepId, { ...d, order: parseInt(d.order) || s.order || 1 });
        Toast.success('更新しました');
        this.openDetail(this._detailId);
      }
    });
  },

  confirmDeleteStep(stepId) {
    Modal.confirm({
      title: 'ステップを削除',
      message: 'このステップを削除しますか？',
      danger: true,
      onConfirm: () => {
        DB.deleteStep(stepId); Toast.success('削除しました');
        this.openDetail(this._detailId);
      }
    });
  },

  _stepForm(s = {}, defaultOrder = 1, defaultSelectionType = '') {
    const sType = s.selectionType !== undefined ? s.selectionType : defaultSelectionType;
    return `<form id="step-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">ステップ名 <span class="req">*</span></label>
        <select class="form-select" name="name">
          <option value="">選択してください...</option>
          ${STEP_NAMES.map(n => `<option value="${n}" ${s.name===n?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">選考区分</label>
        <select class="form-select" name="selectionType">
          <option value="">未設定</option>
          ${COMPANY_TYPES.map(t => `<option value="${t}" ${sType===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付種別</label>
        <select class="form-select" name="dateType">
          <option value="予定日" ${(!s.dateType||s.dateType==='予定日')?'selected':''}>予定日</option>
          <option value="締切" ${s.dateType==='締切'?'selected':''}>締切</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">日付</label>
        <input class="form-input" name="date" type="date" value="${esc(s.date||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">結果</label>
        <select class="form-select" name="result">
          ${STEP_RESULTS.map(r => `<option value="${r}" ${(s.result||'未定')===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">表示順</label>
        <input class="form-input" name="order" type="number" min="1" value="${s.order||defaultOrder}">
      </div>
      <div class="form-group span-2">
        <label class="form-label">メモ</label>
        <textarea class="form-textarea" name="notes" rows="2" placeholder="備考など...">${esc(s.notes||'')}</textarea>
      </div>
      <div class="form-group span-2">
        <label class="form-label" style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" name="submitted" ${s.submitted ? 'checked' : ''}> 提出・完了済み（ES提出・WEBテスト・動画選考で使用）
        </label>
      </div>
    </form>`;
  },

  _switchTab(btn, tabId) {
    document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dtab-body').forEach(b => b.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(tabId).classList.remove('hidden');
  }
};
