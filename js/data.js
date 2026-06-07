// ── 定数 ────────────────────────────────────────────────────────────────
const STAGES  = ['エントリー済み','書類選考中','WEBテスト中','GD中','1次面接中','2次面接中','3次面接中'];
const RESULTS = ['IS参加決定','内定','お祈り','辞退'];
const TIERS   = ['S','A','B','C','D'];
const INDUSTRIES = [
  'IT・通信','コンサル','人材','SIer',
  '金融','保険','証券',
  'メーカー','自動車・輸送機器','電機・電子','化学・素材','食品・飲料',
  '不動産（デベロッパー）','不動産（仲介・管理）','建設・ゼネコン',
  '商社（総合）','商社（専門）',
  '広告','小売・流通',
  'エネルギー・インフラ','鉄道・航空・物流','ゲーム・エンタメ','教育',
  'その他'
];
const METHODS = ['自己応募','スカウト','リファラル','その他'];
const PR_TYPES = ['自己PR','ガクチカ','志望動機','その他'];
const INTERVIEW_STAGES = ['書類選考','WEBテスト','GD','1次面接','2次面接','3次面接','その他'];
const COMPANY_TYPES = ['本選考','インターン'];
const STEP_NAMES = ['エントリー','ES提出','WEBテスト','GD','動画選考','1次面接','2次面接','3次面接','4次面接','5次面接','最終面接','インターン','job','ワークショップ','説明会','面談','その他'];
const STEP_RESULTS = ['未定','進行中','通過','お祈り','辞退'];
const TODO_PRIORITIES = ['高','中','低'];

// ── DB ──────────────────────────────────────────────────────────────────
const DB = {
  K: {
    C: 'skt_companies',
    E: 'skt_es',
    I: 'skt_interviews',
    O: 'skt_obog',
    P: 'skt_prbank',
    S: 'skt_steps',
    T: 'skt_todos',
    ET: 'skt_es_templates'
  },

  _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
  _get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
  _set(k,v) { localStorage.setItem(k, JSON.stringify(v)); },

  // Companies
  getCompanies()  { return this._get(this.K.C); },
  addCompany(d)   {
    const list = this.getCompanies();
    const item = { ...d, id: this._id(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.push(item); this._set(this.K.C, list); return item;
  },
  updateCompany(id, d) {
    const list = this.getCompanies();
    const i = list.findIndex(c => c.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d, updatedAt: new Date().toISOString() };
    this._set(this.K.C, list); return list[i];
  },
  deleteCompany(id) {
    this._set(this.K.C, this.getCompanies().filter(c => c.id !== id));
    this._set(this.K.E, this.getES().filter(e => e.companyId !== id));
    this._set(this.K.I, this.getInterviews().filter(i => i.companyId !== id));
    this._set(this.K.O, this.getOBOG().filter(o => o.companyId !== id));
    this._set(this.K.S, this.getSteps().filter(s => s.companyId !== id));
  },

  // ES
  getES() { return this._get(this.K.E); },
  addES(d) {
    const list = this.getES();
    const item = { ...d, id: this._id(), charCount: (d.answer||'').length, createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.E, list); return item;
  },
  updateES(id, d) {
    const list = this.getES();
    const i = list.findIndex(e => e.id === id); if (i<0) return null;
    if (d.answer !== undefined) d.charCount = d.answer.length;
    list[i] = { ...list[i], ...d }; this._set(this.K.E, list); return list[i];
  },
  deleteES(id) { this._set(this.K.E, this.getES().filter(e => e.id !== id)); },

  // Interviews
  getInterviews() { return this._get(this.K.I); },
  addInterview(d) {
    const list = this.getInterviews();
    const item = { ...d, id: this._id(), createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.I, list); return item;
  },
  updateInterview(id, d) {
    const list = this.getInterviews();
    const i = list.findIndex(x => x.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d }; this._set(this.K.I, list); return list[i];
  },
  deleteInterview(id) { this._set(this.K.I, this.getInterviews().filter(i => i.id !== id)); },

  // OB/OG
  getOBOG() { return this._get(this.K.O); },
  addOBOG(d) {
    const list = this.getOBOG();
    const item = { ...d, id: this._id(), createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.O, list); return item;
  },
  updateOBOG(id, d) {
    const list = this.getOBOG();
    const i = list.findIndex(o => o.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d }; this._set(this.K.O, list); return list[i];
  },
  deleteOBOG(id) { this._set(this.K.O, this.getOBOG().filter(o => o.id !== id)); },

  // PR Bank（データ互換性のため保持）
  getPRBank() { return this._get(this.K.P); },

  // ES Templates
  getESTemplates() { return this._get(this.K.ET); },
  addESTemplate(d) {
    const list = this.getESTemplates();
    const item = { ...d, id: this._id(), createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.ET, list); return item;
  },
  updateESTemplate(id, d) {
    const list = this.getESTemplates();
    const i = list.findIndex(e => e.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d }; this._set(this.K.ET, list); return list[i];
  },
  deleteESTemplate(id) { this._set(this.K.ET, this.getESTemplates().filter(e => e.id !== id)); },

  // Selection Steps
  getSteps(companyId) {
    const all = this._get(this.K.S);
    return companyId ? all.filter(s => s.companyId === companyId) : all;
  },
  addStep(d) {
    const list = this._get(this.K.S);
    const item = { ...d, id: this._id(), createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.S, list); return item;
  },
  updateStep(id, d) {
    const list = this._get(this.K.S);
    const i = list.findIndex(s => s.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d };
    this._set(this.K.S, list); return list[i];
  },
  deleteStep(id) { this._set(this.K.S, this._get(this.K.S).filter(s => s.id !== id)); },

  // Todos
  getTodos() { return this._get(this.K.T); },
  addTodo(d) {
    const list = this.getTodos();
    const item = { ...d, id: this._id(), done: false, createdAt: new Date().toISOString() };
    list.push(item); this._set(this.K.T, list); return item;
  },
  updateTodo(id, d) {
    const list = this.getTodos();
    const i = list.findIndex(t => t.id === id); if (i<0) return null;
    list[i] = { ...list[i], ...d };
    this._set(this.K.T, list); return list[i];
  },
  deleteTodo(id) { this._set(this.K.T, this.getTodos().filter(t => t.id !== id)); },

  // Export / Import
  exportAll() {
    return { version:'1.0', exportedAt: new Date().toISOString(),
      companies: this.getCompanies(), es: this.getES(),
      interviews: this.getInterviews(), obog: this.getOBOG(), prBank: this.getPRBank(),
      steps: this.getSteps(), todos: this.getTodos(), esTemplates: this.getESTemplates() };
  },
  importAll(raw) {
    if (raw.companies)    this._set(this.K.C, raw.companies);
    if (raw.es)           this._set(this.K.E, raw.es);
    if (raw.interviews)   this._set(this.K.I, raw.interviews);
    if (raw.obog)         this._set(this.K.O, raw.obog);
    if (raw.prBank)       this._set(this.K.P, raw.prBank);
    if (raw.steps)        this._set(this.K.S, raw.steps);
    if (raw.todos)        this._set(this.K.T, raw.todos);
    if (raw.esTemplates)  this._set(this.K.ET, raw.esTemplates);
  },
  clearAll() { Object.values(this.K).forEach(k => localStorage.removeItem(k)); }
};
