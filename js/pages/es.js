const ESPage = {
  _filterCompany: '',
  _filterCategory: '',
  _sort: 'company',

  render() {
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
    }

    return `
<div class="page-content">
  <!-- フィルター・ソートバー -->
  <div class="filter-bar card">
    <select class="filter-select" style="min-width:200px" onchange="ESPage.onFilterCompany(this.value)">
      <option value="">全企業 (${allES.length}件)</option>
      ${companies.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ja')).map(c => {
        const cnt = allES.filter(e=>e.companyId===c.id).length;
        return `<option value="${c.id}" ${this._filterCompany===c.id?'selected':''}>${esc(c.name)} (${cnt})</option>`;
      }).join('')}
    </select>
    <select class="filter-select" onchange="ESPage.onFilterCategory(this.value)">
      <option value="">全カテゴリ</option>
      ${PR_TYPES.map(t => `<option value="${t}" ${this._filterCategory===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <select class="filter-select" onchange="ESPage.onSort(this.value)">
      <option value="company" ${this._sort==='company'?'selected':''}>企業名順</option>
      <option value="date"    ${this._sort==='date'?'selected':''}>更新日順</option>
    </select>
    <span class="filter-count">${filtered.length}設問</span>
  </div>

  ${companies.length === 0
    ? '<div class="card mt-3"><p class="empty-msg m-4">先に企業を追加してください。</p></div>'
    : sortedGroupKeys.length === 0
      ? `<div class="card mt-3"><p class="empty-msg m-4">ESがありません。右上の「＋ES追加」から追加するか、企業詳細から追加してください。</p></div>`
      : sortedGroupKeys.map(cid => {
          const co = compMap[cid];
          const entries = grouped[cid].sort((a,b) => (a.createdAt||'') < (b.createdAt||'') ? -1 : 1);
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
                <button class="btn btn-primary btn-sm" onclick="ESPage.openAdd('${cid}','${esc(co ? co.name : '')}')">
                  + 設問を追加
                </button>
              </div>
              <div class="es-questions-list">
                ${entries.map((e, idx) => this._entryHTML(e, idx + 1, entries.length, entries)).join('')}
              </div>
            </div>`;
        }).join('')
  }
</div>`;
  },

  _entryHTML(e, num, total, allEntries) {
    return `
      <div class="es-entry" id="es-${e.id}">
        <div class="es-entry-header">
          <div class="flex-row gap-2">
            <span class="es-num">設問 ${num} / ${total}</span>
            ${renderQualityBadge(e.quality)}
            ${e.category ? `<span class="badge" style="background:#f3f4f6;color:#6b7280">${esc(e.category)}</span>` : ''}
            ${e.submittedDate ? `<span class="text-sm text-muted">提出日: ${formatDate(e.submittedDate)}</span>` : ''}
          </div>
          <div class="action-btns">
            ${num > 1 ? `<button class="btn-icon" title="前の設問" onclick="document.getElementById('es-${allEntries[num-2].id}').scrollIntoView({behavior:'smooth',block:'center'})">↑</button>` : ''}
            ${num < total ? `<button class="btn-icon" title="次の設問" onclick="document.getElementById('es-${allEntries[num].id}').scrollIntoView({behavior:'smooth',block:'center'})">↓</button>` : ''}
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

  mount() {},

  // ── 追加フォーム ──────────────────────────────────────────────
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
        if (!d.answer)    { Toast.error('回答内容を入力してください'); return; }
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

    const sameCompany = DB.getES()
      .filter(x => x.companyId === e.companyId)
      .sort((a,b) => (a.createdAt||'') < (b.createdAt||'') ? -1 : 1);
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
          回答内容 <span class="req">*</span>
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
    </form>`;
  },

  _bindCharCount() {
    const ta = document.getElementById('es-answer');
    const counter = document.getElementById('char-count');
    if (!ta || !counter) return;
    const update = () => { counter.textContent = `${ta.value.length}字`; };
    update();
    ta.addEventListener('input', update);
  }
};
