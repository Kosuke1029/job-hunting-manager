const MemoPage = {
  _tab: 'pr',

  render() {
    return `
<div class="page-content">
  <div class="tab-bar">
    <button class="tab ${this._tab==='pr'?'active':''}" onclick="MemoPage.switchTab('pr')">自己PR / ガクチカ</button>
    <button class="tab ${this._tab==='iv'?'active':''}" onclick="MemoPage.switchTab('iv')">面接メモ</button>
    <button class="tab ${this._tab==='ob'?'active':''}" onclick="MemoPage.switchTab('ob')">OB / OG 訪問</button>
  </div>
  <div id="tab-content" class="mt-3">${this._renderTab()}</div>
</div>`;
  },

  mount() {},

  switchTab(tab) {
    this._tab = tab;
    const el = document.getElementById('tab-content');
    if (el) { el.innerHTML = this._renderTab(); App.updateHeaderActions(); }
  },

  getAddBtn() {
    if (this._tab === 'pr') return `<button class="btn btn-primary" onclick="MemoPage.openAddPR()">+ 追加</button>`;
    if (this._tab === 'iv') return `<button class="btn btn-primary" onclick="MemoPage.openAddInterview()">+ 追加</button>`;
    if (this._tab === 'ob') return `<button class="btn btn-primary" onclick="MemoPage.openAddOBOG()">+ 追加</button>`;
    return '';
  },

  _renderTab() {
    if (this._tab === 'pr') return this._renderPR();
    if (this._tab === 'iv') return this._renderInterviews();
    if (this._tab === 'ob') return this._renderOBOG();
    return '';
  },

  // ── 自己PRバンク ──────────────────────────────────────────────
  _renderPR() {
    const list = DB.getPRBank().sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (list.length === 0) return '<p class="empty-msg">自己PR・ガクチカがありません。追加してください。</p>';
    return list.map(p => `
      <div class="pr-card card">
        <div class="pr-card-header">
          <div class="flex-row gap-2">
            <b>${esc(p.title)}</b>
            <span class="badge" style="background:#e0e7ff;color:#6366f1">${esc(p.type||'')}</span>
          </div>
          <div class="action-btns">
            <button class="btn-icon" onclick="MemoPage.openEditPR('${p.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeletePR('${p.id}')">🗑️</button>
          </div>
        </div>
        <p class="pr-content">${esc(p.content).replace(/\n/g,'<br>')}</p>
        <div class="pr-footer">
          <span class="char-badge">${p.charCount}字</span>
          <span class="text-muted text-sm">更新: ${formatDate(p.updatedAt)}</span>
        </div>
      </div>`).join('');
  },

  openAddPR() {
    Modal.show({
      title: '自己PR / ガクチカを追加',
      body: this._prForm({}),
      onSubmit: () => {
        const d = getFormData('pr-form');
        if (!d.title)   { Toast.error('タイトルを入力してください'); return; }
        if (!d.content) { Toast.error('内容を入力してください'); return; }
        DB.addPR(d); Modal.close(); Toast.success('追加しました');
        document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
    setTimeout(() => this._bindPRCharCount(), 100);
  },

  openEditPR(id) {
    const p = DB.getPRBank().find(x => x.id === id);
    if (!p) return;
    Modal.show({
      title: '自己PR / ガクチカを編集',
      body: this._prForm(p),
      onSubmit: () => {
        const d = getFormData('pr-form');
        if (!d.title)   { Toast.error('タイトルを入力してください'); return; }
        if (!d.content) { Toast.error('内容を入力してください'); return; }
        DB.updatePR(id, d); Modal.close(); Toast.success('更新しました');
        document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
    setTimeout(() => this._bindPRCharCount(), 100);
  },

  confirmDeletePR(id) {
    Modal.confirm({
      title: '削除確認',
      message: 'このエントリーを削除しますか？',
      danger: true,
      onConfirm: () => { DB.deletePR(id); Toast.success('削除しました'); document.getElementById('tab-content').innerHTML = this._renderTab(); }
    });
  },

  _prForm(p = {}) {
    return `<form id="pr-form" class="form-grid">
      <div class="form-group">
        <label class="form-label">タイトル <span class="req">*</span></label>
        <input class="form-input" name="title" value="${esc(p.title||'')}" placeholder="例）リーダーシップ系ガクチカ">
      </div>
      <div class="form-group">
        <label class="form-label">種類</label>
        <select class="form-select" name="type">${selectOptions(PR_TYPES, p.type)}</select>
      </div>
      <div class="form-group span-2">
        <label class="form-label">
          内容 <span class="req">*</span>
          <span class="char-counter" id="pr-char-count">0字</span>
        </label>
        <textarea class="form-textarea" name="content" id="pr-content" rows="8" placeholder="内容を入力...">${esc(p.content||'')}</textarea>
      </div>
    </form>`;
  },

  _bindPRCharCount() {
    const ta = document.getElementById('pr-content');
    const c  = document.getElementById('pr-char-count');
    if (!ta || !c) return;
    const upd = () => { c.textContent = `${ta.value.length}字`; };
    upd(); ta.addEventListener('input', upd);
  },

  // ── 面接メモ ──────────────────────────────────────────────────
  _renderInterviews() {
    const list = DB.getInterviews().sort((a,b) => (b.date||'') > (a.date||'') ? 1 : -1);
    const compMap = {};
    DB.getCompanies().forEach(c => compMap[c.id] = c);
    if (list.length === 0) return '<p class="empty-msg">面接メモがありません。追加してください。</p>';
    return list.map(iv => {
      const co = compMap[iv.companyId];
      return `<div class="iv-card card">
        <div class="iv-card-header">
          <div class="flex-row gap-2">
            ${co ? `<b>${esc(co.name)}</b>${renderIndustryBadge(co.industry)}` : '<span class="text-muted">不明な企業</span>'}
            <span class="badge" style="background:#ffedd5;color:#f97316">${esc(iv.stage||'')}</span>
            <span class="text-muted text-sm">${formatDate(iv.date)}</span>
          </div>
          <div class="action-btns">
            <button class="btn-icon" onclick="MemoPage.openEditInterview('${iv.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeleteInterview('${iv.id}')">🗑️</button>
          </div>
        </div>
        ${iv.questions ? `<div class="iv-section"><span class="iv-section-lbl">質問内容</span><p>${esc(iv.questions).replace(/\n/g,'<br>')}</p></div>` : ''}
        ${iv.myAnswers ? `<div class="iv-section"><span class="iv-section-lbl">自分の回答</span><p>${esc(iv.myAnswers).replace(/\n/g,'<br>')}</p></div>` : ''}
        ${iv.feedback  ? `<div class="iv-section"><span class="iv-section-lbl">振り返り・改善点</span><p>${esc(iv.feedback).replace(/\n/g,'<br>')}</p></div>` : ''}
      </div>`;
    }).join('');
  },

  openAddInterview(presetCompanyId = '', presetCompanyName = '') {
    Modal.show({
      title: '面接メモを追加',
      body: this._ivForm({}, presetCompanyId),
      onSubmit: () => {
        const d = getFormData('iv-form');
        if (!d.companyId) { Toast.error('企業を選択してください'); return; }
        DB.addInterview(d); Modal.close(); Toast.success('追加しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  openEditInterview(id) {
    const iv = DB.getInterviews().find(x => x.id === id);
    if (!iv) return;
    Modal.show({
      title: '面接メモを編集',
      body: this._ivForm(iv, iv.companyId),
      onSubmit: () => {
        const d = getFormData('iv-form');
        DB.updateInterview(id, d); Modal.close(); Toast.success('更新しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  confirmDeleteInterview(id) {
    Modal.confirm({
      title: '削除確認', message: 'この面接メモを削除しますか？', danger: true,
      onConfirm: () => {
        DB.deleteInterview(id); Toast.success('削除しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  _ivForm(iv = {}, presetId = '') {
    const companies = DB.getCompanies();
    return `<form id="iv-form" class="form-grid">
      <div class="form-group">
        <label class="form-label">企業 <span class="req">*</span></label>
        <select class="form-select" name="companyId">
          <option value="">選択...</option>
          ${companies.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ja')).map(c =>
            `<option value="${c.id}" ${(iv.companyId||presetId)===c.id?'selected':''}>${esc(c.name)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">面接ステージ</label>
        <select class="form-select" name="stage">${selectOptions(INTERVIEW_STAGES, iv.stage)}</select>
      </div>
      <div class="form-group">
        <label class="form-label">面接日</label>
        <input class="form-input" name="date" type="date" value="${esc(iv.date||'')}">
      </div>
      <div class="form-group span-2">
        <label class="form-label">聞かれた質問</label>
        <textarea class="form-textarea" name="questions" rows="3" placeholder="面接で聞かれた内容...">${esc(iv.questions||'')}</textarea>
      </div>
      <div class="form-group span-2">
        <label class="form-label">自分の回答</label>
        <textarea class="form-textarea" name="myAnswers" rows="3" placeholder="自分の回答内容...">${esc(iv.myAnswers||'')}</textarea>
      </div>
      <div class="form-group span-2">
        <label class="form-label">振り返り・改善点</label>
        <textarea class="form-textarea" name="feedback" rows="2" placeholder="良かった点、改善点など...">${esc(iv.feedback||'')}</textarea>
      </div>
    </form>`;
  },

  // ── OB/OG訪問 ────────────────────────────────────────────────
  _renderOBOG() {
    const list = DB.getOBOG().sort((a,b) => (b.date||'') > (a.date||'') ? 1 : -1);
    const compMap = {};
    DB.getCompanies().forEach(c => compMap[c.id] = c);
    if (list.length === 0) return '<p class="empty-msg">OB/OG訪問記録がありません。追加してください。</p>';
    return list.map(o => {
      const co = o.companyId ? compMap[o.companyId] : null;
      return `<div class="iv-card card">
        <div class="iv-card-header">
          <div class="flex-row gap-2">
            <b>${esc(o.personName)}</b>
            ${co ? `<span class="text-muted text-sm">@ ${esc(co.name)}</span>` : o.companyName ? `<span class="text-muted text-sm">@ ${esc(o.companyName)}</span>` : ''}
            <span class="text-muted text-sm">${formatDate(o.date)}</span>
          </div>
          <div class="action-btns">
            <button class="btn-icon" onclick="MemoPage.openEditOBOG('${o.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeleteOBOG('${o.id}')">🗑️</button>
          </div>
        </div>
        ${o.notes ? `<p class="iv-section">${esc(o.notes).replace(/\n/g,'<br>')}</p>` : ''}
      </div>`;
    }).join('');
  },

  openAddOBOG(presetCompanyId = '', presetCompanyName = '') {
    Modal.show({
      title: 'OB/OG訪問を追加',
      body: this._obForm({}, presetCompanyId),
      onSubmit: () => {
        const d = getFormData('ob-form');
        if (!d.personName) { Toast.error('氏名を入力してください'); return; }
        DB.addOBOG(d); Modal.close(); Toast.success('追加しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  openEditOBOG(id) {
    const o = DB.getOBOG().find(x => x.id === id);
    if (!o) return;
    Modal.show({
      title: 'OB/OG訪問を編集',
      body: this._obForm(o, o.companyId),
      onSubmit: () => {
        const d = getFormData('ob-form');
        DB.updateOBOG(id, d); Modal.close(); Toast.success('更新しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  confirmDeleteOBOG(id) {
    Modal.confirm({
      title: '削除確認', message: 'このOB/OG訪問記録を削除しますか？', danger: true,
      onConfirm: () => {
        DB.deleteOBOG(id); Toast.success('削除しました');
        if (document.getElementById('tab-content')) document.getElementById('tab-content').innerHTML = this._renderTab();
      }
    });
  },

  _obForm(o = {}, presetId = '') {
    const companies = DB.getCompanies();
    return `<form id="ob-form" class="form-grid">
      <div class="form-group">
        <label class="form-label">氏名 <span class="req">*</span></label>
        <input class="form-input" name="personName" value="${esc(o.personName||'')}" placeholder="例）田中さん">
      </div>
      <div class="form-group">
        <label class="form-label">訪問日</label>
        <input class="form-input" name="date" type="date" value="${esc(o.date||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">企業（登録済みから選択）</label>
        <select class="form-select" name="companyId">
          <option value="">選択しない</option>
          ${companies.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ja')).map(c =>
            `<option value="${c.id}" ${(o.companyId||presetId)===c.id?'selected':''}>${esc(c.name)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">企業名（手動入力）</label>
        <input class="form-input" name="companyName" value="${esc(o.companyName||'')}" placeholder="登録済み企業以外の場合">
      </div>
      <div class="form-group span-2">
        <label class="form-label">メモ</label>
        <textarea class="form-textarea" name="notes" rows="4" placeholder="話の内容、気になった点など...">${esc(o.notes||'')}</textarea>
      </div>
    </form>`;
  }
};
