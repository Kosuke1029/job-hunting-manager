const ESPage = {
  _filterCompany: '',
  _filterCategory: '',
  _companySearch: '',
  _sort: 'company',
  _tab: 'list',
  _templateCategory: '',
  _templateQuality: '',

  render() {
    return `
<div class="page-content">
  <div class="tab-bar">
    <button id="es-tab-btn-list" class="tab ${this._tab==='list'?'active':''}" onclick="ESPage.switchTab('list')">ES一覧</button>
    <button id="es-tab-btn-templates" class="tab ${this._tab==='templates'?'active':''}" onclick="ESPage.switchTab('templates')">テンプレート管理</button>
  </div>
  <div id="es-tab-content" class="mt-3">${this._renderTabContent()}</div>
</div>`;
  },

  switchTab(tab) {
    this._tab = tab;
    App.rerender();
  },

  _renderTabContent() {
    if (this._tab === 'list') return this._renderList();
    if (this._tab === 'templates') return this._renderTemplates();
    return '';
  },

  getAddBtn() {
    if (this._tab === 'list')      return `<button class="btn btn-primary" onclick="ESPage.openAdd()">＋ ES追加</button>`;
    if (this._tab === 'templates') return `<button class="btn btn-primary" onclick="ESPage.openAddTemplate()">＋ テンプレート追加</button>`;
    return '';
  },

  _renderList() {
    const companies = DB.getCompanies();
    const allES = DB.getES();
    const compMap = {};
    companies.forEach(c => compMap[c.id] = c);

    let filtered = allES;
    if (this._filterCompany)  filtered = filtered.filter(e => e.companyId === this._filterCompany);
    if (this._filterCategory) filtered = filtered.filter(e => e.category === this._filterCategory);

    const grouped = {};
    filtered.forEach(e => {
      if (!grouped[e.companyId]) grouped[e.companyId] = [];
      grouped[e.companyId].push(e);
    });

    let sortedGroupKeys = Object.keys(grouped);
    if (this._sort === 'company') {
      sortedGroupKeys.sort((a,b) => {
        const ca = compMap[a], cb = compMap[b];
        if (!ca || !cb) return 0;
        return (ca.name||'').localeCompare(cb.name||'', 'ja');
      });
    } else if (this._sort === 'date') {
      sortedGroupKeys.sort((a,b) => {
        const ca = compMap[a], cb = compMap[b];
        return (cb?.updatedAt||'') < (ca?.updatedAt||'') ? -1 : 1;
      });
    } else if (this._sort === 'created') {
      sortedGroupKeys.sort((a,b) => {
        const minA = grouped[a].reduce((m,e) => (e.createdAt||'') < m ? (e.createdAt||'') : m, grouped[a][0]?.createdAt||'');
        const minB = grouped[b].reduce((m,e) => (e.createdAt||'') < m ? (e.createdAt||'') : m, grouped[b][0]?.createdAt||'');
        return minA < minB ? -1 : minA > minB ? 1 : 0;
      });
    }

    if (this._companySearch) {
      const q = this._companySearch.toLowerCase();
      sortedGroupKeys = sortedGroupKeys.filter(cid => (compMap[cid]?.name||'').toLowerCase().includes(q));
    }

    return `
  <!-- フィルター・ソートバー -->
  <div class="filter-bar card">
    <input class="filter-input" id="es-company-search" type="text" placeholder="企業名で検索..." value="${esc(this._companySearch)}" oninput="ESPage.onCompanySearch(this.value)">
    <select class="filter-select" onchange="ESPage.onFilterCategory(this.value)">
      <option value="">全カテゴリ</option>
      ${PR_TYPES.map(t => `<option value="${t}" ${this._filterCategory===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <select class="filter-select" onchange="ESPage.onSort(this.value)">
      <option value="company" ${this._sort==='company'?'selected':''}>企業名順</option>
      <option value="date"    ${this._sort==='date'?'selected':''}>更新日順</option>
      <option value="created" ${this._sort==='created'?'selected':''}>追加日順</option>
    </select>
    <span class="filter-count">${filtered.length}設問</span>
  </div>

  ${companies.length === 0
    ? '<div class="card mt-3"><p class="empty-msg m-4">先に企業を追加してください。</p></div>'
    : sortedGroupKeys.length === 0
      ? `<div class="card mt-3"><p class="empty-msg m-4">ESがありません。右上の「＋ES追加」から追加するか、企業詳細から追加してください。</p></div>`
      : sortedGroupKeys.map(cid => {
          const co = compMap[cid];
          const entries = this._sortedEntries(grouped[cid]);
          return `
            <div class="card mt-3">
              <div class="card-header es-company-header">
                <div class="flex-row gap-2">
                  <h3 class="card-title">${esc(co ? co.name : '不明な企業')}</h3>
                  ${co ? renderCompanyTypeBadge(co.type) : ''}
                  ${co ? renderIndustryBadge(co.industry) : ''}
                  ${co ? renderTierBadge(co.tier) : ''}
                  <span class="es-count-badge">${entries.length}設問</span>
                </div>
                <button class="btn btn-primary btn-sm" onclick="ESPage.openAdd('${cid}','${esc(co ? co.name : '')}')">+ 設問を追加</button>
              </div>
              <div class="es-questions-list">
                ${entries.map((e, idx) => this._entryHTML(e, idx + 1, entries.length, entries)).join('')}
              </div>
            </div>`;
        }).join('')
  }`;
  },

  _entryHTML(e, num, total, allEntries) {
    const esResultBadge = e.esResult
      ? `<span class="badge" style="color:${e.esResult==='通過'?'#10b981':'#6b7280'};background:${e.esResult==='通過'?'#d1fae5':'#f3f4f6'};font-weight:600">書類: ${esc(e.esResult)}</span>`
      : '';
    return `
      <div class="es-entry" id="es-${e.id}">
        <div class="es-entry-header">
          <div class="flex-row gap-2">
            <span class="es-num">設問 ${num} / ${total}</span>
            ${renderQualityBadge(e.quality)}
            ${e.category ? `<span class="badge" style="background:#f3f4f6;color:#6b7280">${esc(e.category)}</span>` : ''}
            ${esResultBadge}
            ${e.submittedDate ? `<span class="text-sm text-muted">提出日: ${formatDate(e.submittedDate)}</span>` : ''}
          </div>
          <div class="action-btns">
            ${num > 1 ? `<button class="btn-icon" title="上に移動" onclick="ESPage.moveEntry('${e.id}','up')">↑</button>` : ''}
            ${num < total ? `<button class="btn-icon" title="下に移動" onclick="ESPage.moveEntry('${e.id}','down')">↓</button>` : ''}
            <button class="btn-icon" title="編集" onclick="ESPage.openEdit('${e.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" title="削除" onclick="ESPage.confirmDelete('${e.id}')">🗑️</button>
          </div>
        </div>

        <div class="es-question-block">
          <span class="es-q-label">設問</span>
          <p class="es-q">${esc(e.question)}</p>
        </div>

        <div class="es-answer-block">
          <div class="es-answer-header">
            <span class="es-q-label">回答</span>
            <span class="char-badge">${e.charCount}字</span>
          </div>
          <p class="es-a">${esc(e.answer).replace(/\n/g,'<br>')}</p>
        </div>
      </div>
      ${num < total ? '<hr class="es-divider">' : ''}`;
  },

  onFilterCompany(val) { this._filterCompany = val; App.rerender(); },
  onFilterCategory(val) { this._filterCategory = val; App.rerender(); },
  onSort(val) { this._sort = val; App.rerender(); },
  onCompanySearch(val) {
    this._companySearch = val;
    App.rerender();
    const el = document.getElementById('es-company-search');
    if (el) { el.focus(); el.setSelectionRange(val.length, val.length); }
  },

  resetOrder(companyId) {
    const entries = DB.getES()
      .filter(e => e.companyId === companyId)
      .sort((a, b) => (a.createdAt||'') < (b.createdAt||'') ? -1 : 1);
    entries.forEach((e, i) => DB.updateES(e.id, { order: i }));
    Toast.success('追加日順に並べ直しました');
    App.rerender();
  },

  _sortedEntries(entries) {
    return [...entries].sort((a, b) => {
      const ao = a.order, bo = b.order;
      if (ao !== undefined && bo !== undefined) return ao - bo;
      if (ao === undefined && bo === undefined) return (a.createdAt||'') < (b.createdAt||'') ? -1 : 1;
      return ao !== undefined ? -1 : 1;
    });
  },

  moveEntry(id, direction) {
    const e = DB.getES().find(x => x.id === id);
    if (!e) return;
    const sorted = this._sortedEntries(DB.getES().filter(x => x.companyId === e.companyId));
    const idx = sorted.findIndex(x => x.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    sorted.forEach((x, i) => DB.updateES(x.id, { order: i }));
    DB.updateES(sorted[idx].id, { order: targetIdx });
    DB.updateES(sorted[targetIdx].id, { order: idx });
    App.rerender();
  },

  mount() {},

  // ── ES追加・編集フォーム ──────────────────────────────────────────────
  openAdd(presetCompanyId = '', presetCompanyName = '') {
    const companies = DB.getCompanies();
    const preset = presetCompanyId || this._filterCompany || '';
    Modal.show({
      title: presetCompanyName ? `ESを追加 — ${presetCompanyName}` : 'ESを追加',
      body: this._form({}, companies, preset),
      onSubmit: () => {
        const d = getFormData('es-form');
        if (!d.companyId) { Toast.error('企業を選択してください'); return; }
        if (!d.question)  { Toast.error('設問内容を入力してください'); return; }
        DB.addES(d); Modal.close(); Toast.success('ESを追加しました');
        App.rerender(); App.updateSidebarStats();
      }
    });
    setTimeout(() => this._bindCharCount(), 100);
  },

  openEdit(id) {
    const e = DB.getES().find(x => x.id === id);
    if (!e) return;
    const companies = DB.getCompanies();
    const co = companies.find(c => c.id === e.companyId);

    const sameCompany = this._sortedEntries(DB.getES().filter(x => x.companyId === e.companyId));
    const idx = sameCompany.findIndex(x => x.id === id);
    const navInfo = sameCompany.length > 1 ? {
      prevId: idx > 0 ? sameCompany[idx-1].id : null,
      nextId: idx < sameCompany.length-1 ? sameCompany[idx+1].id : null,
      current: idx + 1,
      total: sameCompany.length
    } : null;

    Modal.show({
      title: co ? `ESを編集 — ${co.name}` : 'ESを編集',
      body: this._form(e, companies, e.companyId, navInfo),
      onSubmit: () => {
        const d = getFormData('es-form');
        if (!d.question) { Toast.error('設問内容を入力してください'); return; }
        if (!d.answer)   { Toast.error('回答内容を入力してください'); return; }
        DB.updateES(id, d); Modal.close(); Toast.success('更新しました');
        App.rerender();
      }
    });
    setTimeout(() => this._bindCharCount(), 100);
  },

  confirmDelete(id) {
    Modal.confirm({
      title: 'ESを削除',
      message: 'このES設問エントリーを削除しますか？',
      danger: true,
      onConfirm: () => { DB.deleteES(id); Toast.success('削除しました'); App.rerender(); App.updateSidebarStats(); }
    });
  },

  _form(e = {}, companies = [], presetId = '', navInfo = null) {
    const isEdit = !!e.companyId;
    const navHTML = navInfo ? `
      <div class="es-nav-bar">
        ${navInfo.prevId ? `<button type="button" class="btn btn-ghost btn-sm" onclick="ESPage.openEdit('${navInfo.prevId}')">← 前の設問</button>` : '<span></span>'}
        <span class="text-muted text-sm">設問 ${navInfo.current} / ${navInfo.total}</span>
        ${navInfo.nextId ? `<button type="button" class="btn btn-ghost btn-sm" onclick="ESPage.openEdit('${navInfo.nextId}')">次の設問 →</button>` : '<span></span>'}
      </div>` : '';

    return `${navHTML}<form id="es-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">企業 <span class="req">*</span></label>
        <select class="form-select" name="companyId" ${isEdit ? 'disabled' : ''}>
          <option value="">企業を選択...</option>
          ${companies.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ja')).map(c =>
            `<option value="${c.id}" ${(e.companyId||presetId)===c.id?'selected':''}>${esc(c.name)}</option>`
          ).join('')}
        </select>
        ${isEdit ? `<input type="hidden" name="companyId" value="${e.companyId}">` : ''}
      </div>

      <div class="form-group span-2">
        <label class="form-label">設問内容 <span class="req">*</span></label>
        <textarea class="form-textarea" name="question" rows="2" placeholder="例）あなたの強みを300字以内で書いてください">${esc(e.question||'')}</textarea>
      </div>

      <div class="form-group span-2">
        <label class="form-label">
          回答内容
          <span class="char-counter" id="char-count">0字</span>
        </label>
        <textarea class="form-textarea" name="answer" id="es-answer" rows="7" placeholder="回答を入力...">${esc(e.answer||'')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">カテゴリ</label>
        <select class="form-select" name="category">
          <option value="">未分類</option>
          ${PR_TYPES.map(t => `<option value="${t}" ${e.category===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">ESの出来</label>
        <select class="form-select" name="quality">
          <option value="">未評価</option>
          ${ES_QUALITY_LABELS.map(q =>
            `<option value="${q}" ${e.quality===q?'selected':''}>${ES_QUALITY_ICON[q]} ${q}</option>`
          ).join('')}
        </select>
        <p class="form-hint">✨自信あり／📝普通／📌要改善／🤖AI生成</p>
      </div>

      <div class="form-group">
        <label class="form-label">提出日</label>
        <input class="form-input" name="submittedDate" type="date" value="${esc(e.submittedDate||'')}">
      </div>

      <div class="form-group">
        <label class="form-label">書類結果</label>
        <select class="form-select" name="esResult">
          <option value="">未確定</option>
          <option value="通過" ${e.esResult==='通過'?'selected':''}>✅ 通過</option>
          <option value="お祈り" ${e.esResult==='お祈り'?'selected':''}>❌ お祈り</option>
        </select>
      </div>
    </form>`;
  },

  _bindCharCount() {
    const ta = document.getElementById('es-answer');
    const counter = document.getElementById('char-count');
    if (!ta || !counter) return;
    const update = () => { counter.textContent = `${ta.value.length}字`; };
    update();
    ta.addEventListener('input', update);
  },

  // ── テンプレート管理 ──────────────────────────────────────────────────
  _renderTemplates() {
    const allTemplates = DB.getESTemplates();

    let templates = allTemplates;
    if (this._templateCategory) templates = templates.filter(t => t.category === this._templateCategory);
    if (this._templateQuality)  templates = templates.filter(t => t.quality  === this._templateQuality);

    const filterBar = `<div class="filter-bar card">
      <select class="filter-select" onchange="ESPage.switchTemplateCategory(this.value)">
        <option value="">全カテゴリ</option>
        ${PR_TYPES.map(c => `<option value="${c}" ${this._templateCategory===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="ESPage.switchTemplateQuality(this.value)">
        <option value="">全ての出来</option>
        ${ES_QUALITY_LABELS.map(q => `<option value="${q}" ${this._templateQuality===q?'selected':''}>${ES_QUALITY_ICON[q]} ${q}</option>`).join('')}
      </select>
      <span class="filter-count">${templates.length}件</span>
    </div>`;

    if (templates.length === 0) {
      return `${filterBar}<div class="card mt-3"><p class="empty-msg m-4">テンプレートがありません。右上の「＋テンプレート追加」から追加してください。</p></div>`;
    }

    return filterBar + templates.map(t => `
      <div class="card mt-3">
        <div class="card-header">
          <div class="flex-row gap-2">
            <h3 class="card-title">${esc(t.title)}</h3>
            ${t.category ? `<span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-2)">${esc(t.category)}</span>` : ''}
            ${renderQualityBadge(t.quality)}
            ${t.reviewCount ? `<span class="badge" style="background:rgba(79,110,247,0.2);color:#818cf8">添削 ${esc(String(t.reviewCount))}回</span>` : ''}
          </div>
          <div class="action-btns">
            <button class="btn-icon" onclick="ESPage.openEditTemplate('${t.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="ESPage.confirmDeleteTemplate('${t.id}')">🗑️</button>
          </div>
        </div>
        <div class="card-body">
          <p style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:var(--text-1)">${esc(t.content)}</p>
          ${t.feedbackUrl ? `
            <div style="margin-top:12px;padding:10px 12px;background:rgba(79,110,247,0.08);border-radius:6px;border:1px solid rgba(79,110,247,0.25)">
              <span style="font-size:12px;color:var(--accent);font-weight:600">添削フィードバック:</span>
              <a href="${esc(t.feedbackUrl)}" target="_blank" rel="noopener" style="display:block;font-size:13px;color:var(--accent);word-break:break-all;margin-top:2px">${esc(t.feedbackUrl)}</a>
            </div>` : ''}
          <div style="margin-top:8px;font-size:12px;color:var(--text-3)">${formatDate(t.createdAt)} 作成 · ${(t.content||'').length}字</div>
        </div>
      </div>`
    ).join('');
  },

  switchTemplateCategory(cat) {
    this._templateCategory = cat;
    const el = document.getElementById('es-tab-content');
    if (el) el.innerHTML = this._renderTabContent();
  },

  switchTemplateQuality(q) {
    this._templateQuality = q;
    const el = document.getElementById('es-tab-content');
    if (el) el.innerHTML = this._renderTabContent();
  },

  openAddTemplate() {
    Modal.show({
      title: 'テンプレートを追加',
      body: this._templateForm({}),
      onSubmit: () => {
        const d = getFormData('template-form');
        if (!d.title)   { Toast.error('タイトルを入力してください'); return; }
        if (!d.content) { Toast.error('内容を入力してください'); return; }
        DB.addESTemplate(d); Modal.close(); Toast.success('テンプレートを追加しました');
        const el = document.getElementById('es-tab-content');
        if (el) el.innerHTML = this._renderTabContent();
      }
    });
  },

  openEditTemplate(id) {
    const t = DB.getESTemplates().find(x => x.id === id);
    if (!t) return;
    Modal.show({
      title: 'テンプレートを編集',
      body: this._templateForm(t),
      onSubmit: () => {
        const d = getFormData('template-form');
        if (!d.title)   { Toast.error('タイトルを入力してください'); return; }
        if (!d.content) { Toast.error('内容を入力してください'); return; }
        DB.updateESTemplate(id, d); Modal.close(); Toast.success('更新しました');
        const el = document.getElementById('es-tab-content');
        if (el) el.innerHTML = this._renderTabContent();
      }
    });
  },

  confirmDeleteTemplate(id) {
    Modal.confirm({
      title: 'テンプレートを削除',
      message: 'このテンプレートを削除しますか？',
      danger: true,
      onConfirm: () => {
        DB.deleteESTemplate(id); Toast.success('削除しました');
        const el = document.getElementById('es-tab-content');
        if (el) el.innerHTML = this._renderTabContent();
      }
    });
  },

  _templateForm(t = {}) {
    return `<form id="template-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">タイトル <span class="req">*</span></label>
        <input class="form-input" name="title" value="${esc(t.title||'')}" placeholder="例）自己PR（300字）・ガクチカ汎用版">
      </div>
      <div class="form-group">
        <label class="form-label">カテゴリ</label>
        <select class="form-select" name="category">
          <option value="">未分類</option>
          ${PR_TYPES.map(p => `<option value="${p}" ${t.category===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">ESの出来</label>
        <select class="form-select" name="quality">
          <option value="">未評価</option>
          ${ES_QUALITY_LABELS.map(q =>
            `<option value="${q}" ${t.quality===q?'selected':''}>${ES_QUALITY_ICON[q]} ${q}</option>`
          ).join('')}
        </select>
        <p class="form-hint">✨自信あり／📝普通／📌要改善／🤖AI生成</p>
      </div>
      <div class="form-group">
        <label class="form-label">添削回数</label>
        <input class="form-input" name="reviewCount" type="number" min="0" value="${esc(String(t.reviewCount||''))}" placeholder="0">
        <p class="form-hint">添削を依頼した回数</p>
      </div>
      <div class="form-group">
        <label class="form-label">フィードバックURL（添削結果など）</label>
        <input class="form-input" name="feedbackUrl" type="url" value="${esc(t.feedbackUrl||'')}" placeholder="例）https://docs.google.com/...">
        <p class="form-hint">GoogleドキュメントなどのURL</p>
      </div>
      <div class="form-group span-2">
        <label class="form-label">内容 <span class="req">*</span></label>
        <textarea class="form-textarea" name="content" rows="8" placeholder="テンプレート文章を入力...">${esc(t.content||'')}</textarea>
      </div>
    </form>`;
  }
};
