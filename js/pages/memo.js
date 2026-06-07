const MemoPage = {
  _tab: 'todo',
  _todoFilter: 'all',

  render() {
    return `
<div class="page-content">
  <div class="tab-bar">
    <button id="memo-tab-btn-todo" class="tab ${this._tab==='todo'?'active':''}" onclick="MemoPage.switchTab('todo')">TODOリスト</button>
    <button id="memo-tab-btn-iv" class="tab ${this._tab==='iv'?'active':''}" onclick="MemoPage.switchTab('iv')">面接メモ</button>
    <button id="memo-tab-btn-ob" class="tab ${this._tab==='ob'?'active':''}" onclick="MemoPage.switchTab('ob')">OB / OG 訪問</button>
  </div>
  <div id="tab-content" class="mt-3">${this._renderTab()}</div>
</div>`;
  },

  mount() {},

  switchTab(tab) {
    this._tab = tab;
    App.rerender();
  },

  getAddBtn() {
    if (this._tab === 'todo') return `<button class="btn btn-primary" onclick="MemoPage.openAddTodo()">+ TODO追加</button>`;
    if (this._tab === 'iv')   return `<button class="btn btn-primary" onclick="MemoPage.openAddInterview()">+ 追加</button>`;
    if (this._tab === 'ob')   return `<button class="btn btn-primary" onclick="MemoPage.openAddOBOG()">+ 追加</button>`;
    return '';
  },

  _renderTab() {
    if (this._tab === 'todo') return this._renderTodo();
    if (this._tab === 'iv')   return this._renderInterviews();
    if (this._tab === 'ob')   return this._renderOBOG();
    return '';
  },

  // ── TODOリスト ────────────────────────────────────────────────
  _renderTodo() {
    const all    = DB.getTodos();
    const active = all.filter(t => !t.done).length;
    const done   = all.filter(t => t.done).length;
    const todos  = this._filteredTodos();

    // 未提出のES/WEBテストステップを収集
    const compMap = {};
    DB.getCompanies().forEach(c => compMap[c.id] = c);
    const SUBMITTABLE = ['ES提出', 'WEBテスト', '動画選考'];
    const pendingSteps = DB.getSteps().filter(s => {
      if (!SUBMITTABLE.includes(s.name)) return false;
      if (s.submitted) return false;
      if (s.result === 'お祈り' || s.result === '辞退' || s.result === '通過') return false;
      const co = compMap[s.companyId];
      if (!co) return false;
      if (getComputedStatus(co).finalResult) return false;
      return true;
    }).sort((a,b) => (a.date||'') < (b.date||'') ? -1 : 1);

    const pendingSection = pendingSteps.length > 0 ? `
      <div class="card mb-3" style="border-left:4px solid #f59e0b">
        <div class="card-header" style="background:#fffbeb">
          <h3 class="card-title" style="color:#92400e">⚠️ 未提出の選考タスク (${pendingSteps.length}件)</h3>
        </div>
        <div class="card-body p0">
          <table class="table">
            <thead><tr><th>企業名</th><th>タスク</th><th>締切・予定日</th><th>残り</th><th>操作</th></tr></thead>
            <tbody>
              ${pendingSteps.map(s => {
                const co = compMap[s.companyId];
                const d = s.date ? daysUntil(s.date) : null;
                const cls = d !== null && d <= 3 ? 'text-danger fw-bold' : d !== null && d <= 7 ? 'text-warning fw-bold' : '';
                return `<tr>
                  <td style="cursor:pointer" onclick="CompaniesPage.openDetail('${s.companyId}')"><b>${esc(co ? co.name : '')}</b></td>
                  <td><span class="badge" style="color:#92400e;background:#fef3c7">${esc(s.name)}</span></td>
                  <td class="${cls}">${s.date ? formatDate(s.date) : '-'}</td>
                  <td class="${cls}">${d !== null ? (d === 0 ? '今日' : d < 0 ? `${Math.abs(d)}日超過` : `${d}日後`) : '-'}</td>
                  <td>
                    <button class="btn btn-sm" style="background:#10b981;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer" onclick="MemoPage.markStepSubmitted('${s.id}')">提出済み</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>` : '';

    return `
      ${pendingSection}
      <div class="todo-filter-bar mb-3">
        <button class="todo-filter-btn ${this._todoFilter==='all'?'active':''}" onclick="MemoPage.setTodoFilter('all')">全て (${all.length})</button>
        <button class="todo-filter-btn ${this._todoFilter==='active'?'active':''}" onclick="MemoPage.setTodoFilter('active')">未完了 (${active})</button>
        <button class="todo-filter-btn ${this._todoFilter==='done'?'active':''}" onclick="MemoPage.setTodoFilter('done')">完了 (${done})</button>
      </div>
      ${todos.length === 0
        ? '<p class="empty-msg">TODOがありません。右上の「＋TODO追加」から追加してください。</p>'
        : `<div class="todo-list">${todos.map(t => this._todoItem(t)).join('')}</div>`
      }`;
  },

  markStepSubmitted(stepId) {
    const s = DB.getSteps().find(x => x.id === stepId);
    const co = s ? DB.getCompanies().find(c => c.id === s.companyId) : null;
    const label = s ? `${co ? co.name + ' — ' : ''}${s.name}` : 'このタスク';
    Modal.confirm({
      title: '提出済みにする',
      message: `「${label}」を提出済みにしますか？`,
      onConfirm: () => {
        DB.updateStep(stepId, { submitted: true });
        Toast.success('提出済みにしました');
        App.rerender();
      }
    });
  },

  _filteredTodos() {
    let todos = DB.getTodos();
    if (this._todoFilter === 'active') todos = todos.filter(t => !t.done);
    if (this._todoFilter === 'done')   todos = todos.filter(t => t.done);
    const pOrd = { '高':0, '中':1, '低':2, '':3 };
    return todos.sort((a,b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = pOrd[a.priority||''] ?? 3, pb = pOrd[b.priority||''] ?? 3;
      if (pa !== pb) return pa - pb;
      if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.dueDate) return -1; if (b.dueDate) return 1;
      return (a.createdAt||'') < (b.createdAt||'') ? -1 : 1;
    });
  },

  _todoItem(t) {
    const compMap = {};
    DB.getCompanies().forEach(c => compMap[c.id] = c);
    const co = t.companyId ? compMap[t.companyId] : null;
    const d = t.dueDate ? daysUntil(t.dueDate) : null;
    const overdue = d !== null && d < 0 && !t.done;

    return `<div class="todo-item ${t.done ? 'todo-done' : ''} ${overdue ? 'todo-overdue' : ''}">
      <input type="checkbox" class="todo-check" ${t.done ? 'checked' : ''} onchange="MemoPage.toggleTodo('${t.id}')">
      <div class="todo-body">
        <div class="todo-text">${esc(t.text)}</div>
        <div class="todo-meta flex-row gap-2">
          ${t.priority ? renderTodoPriorityBadge(t.priority) : ''}
          ${t.dueDate ? `<span class="text-sm ${overdue ? 'text-danger fw-bold' : d !== null && d <= 3 ? 'text-warning fw-bold' : 'text-muted'}">${overdue ? '期限切れ ' : ''}${formatDate(t.dueDate)}</span>` : ''}
          ${co ? `<span class="text-sm text-muted">@ ${esc(co.name)}</span>` : ''}
        </div>
      </div>
      <div class="action-btns">
        <button class="btn-icon" onclick="MemoPage.openEditTodo('${t.id}')">✏️</button>
        <button class="btn-icon btn-icon-danger" onclick="MemoPage.confirmDeleteTodo('${t.id}')">🗑️</button>
      </div>
    </div>`;
  },

  setTodoFilter(f) {
    this._todoFilter = f;
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = this._renderTab();
  },

  toggleTodo(id) {
    const t = DB.getTodos().find(x => x.id === id);
    if (!t) return;
    DB.updateTodo(id, { done: !t.done });
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = this._renderTab();
  },

  openAddTodo() {
    Modal.show({
      title: 'TODOを追加',
      body: this._todoForm({}),
      onSubmit: () => {
        const d = getFormData('todo-form');
        if (!d.text) { Toast.error('タスク内容を入力してください'); return; }
        DB.addTodo(d); Modal.close(); Toast.success('追加しました');
        const el = document.getElementById('tab-content');
        if (el) el.innerHTML = this._renderTab();
      }
    });
  },

  openEditTodo(id) {
    const t = DB.getTodos().find(x => x.id === id);
    if (!t) return;
    Modal.show({
      title: 'TODOを編集',
      body: this._todoForm(t),
      onSubmit: () => {
        const d = getFormData('todo-form');
        if (!d.text) { Toast.error('タスク内容を入力してください'); return; }
        DB.updateTodo(id, d); Modal.close(); Toast.success('更新しました');
        const el = document.getElementById('tab-content');
        if (el) el.innerHTML = this._renderTab();
      }
    });
  },

  confirmDeleteTodo(id) {
    Modal.confirm({
      title: '削除確認', message: 'このTODOを削除しますか？', danger: true,
      onConfirm: () => {
        DB.deleteTodo(id); Toast.success('削除しました');
        const el = document.getElementById('tab-content');
        if (el) el.innerHTML = this._renderTab();
      }
    });
  },

  _todoForm(t = {}) {
    const companies = DB.getCompanies();
    return `<form id="todo-form" class="form-grid">
      <div class="form-group span-2">
        <label class="form-label">タスク内容 <span class="req">*</span></label>
        <input class="form-input" name="text" value="${esc(t.text||'')}" placeholder="例）〇〇社のESを書く">
      </div>
      <div class="form-group">
        <label class="form-label">優先度</label>
        <select class="form-select" name="priority">
          <option value="">なし</option>
          ${TODO_PRIORITIES.map(p => `<option value="${p}" ${t.priority===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">期限日</label>
        <input class="form-input" name="dueDate" type="date" value="${esc(t.dueDate||'')}">
      </div>
      <div class="form-group span-2">
        <label class="form-label">関連企業（任意）</label>
        <select class="form-select" name="companyId">
          <option value="">選択しない</option>
          ${companies.sort((a,b)=>(a.name||'').localeCompare(b.name||'','ja')).map(c =>
            `<option value="${c.id}" ${t.companyId===c.id?'selected':''}>${esc(c.name)}</option>`
          ).join('')}
        </select>
      </div>
    </form>`;
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
