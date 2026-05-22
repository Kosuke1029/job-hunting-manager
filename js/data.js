// ── 定数 ────────────────────────────────────────────────────────────────
const STAGES  = ['エントリー済み','書類選考中','WEBテスト中','GD中','1次面接中','2次面接中','3次面接中'];
const RESULTS = ['IS参加決定','内定','お祈り','辞退'];
const TIERS   = ['S','A','B','C','D'];
const INDUSTRIES = ['IT・通信','コンサル','人材','SIer','金融','メーカー','広告','その他'];
const METHODS = ['自己応募','スカウト','リファラル','その他'];
const PR_TYPES = ['自己PR','ガクチカ','志望動機','その他'];
const INTERVIEW_STAGES = ['書類選考','WEBテスト','GD','1次面接','2次面接','3次面接','その他'];

// ── DB ──────────────────────────────────────────────────────────────────
const DB = {
  K: {
    C: 'skt_companies',
    E: 'skt_es',
    I: 'skt_interviews',
    O: 'skt_obog',
    P: 'skt_prbank'
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

  // PR Bank
  getPRBank() { return this._get(this.K.P); },
  addPR(d) {
    const list = this.getPRBank();
    const item = { ...d, id: this._id(), charCount: (d.content||'').length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.push(item); this._set(this.K.P, list); return item;
  },
  updatePR(id, d) {
    const list = this.getPRBank();
    const i = list.findIndex(p => p.id === id); if (i<0) return null;
    if (d.content !== undefined) d.charCount = d.content.length;
    list[i] = { ...list[i], ...d, updatedAt: new Date().toISOString() };
    this._set(this.K.P, list); return list[i];
  },
  deletePR(id) { this._set(this.K.P, this.getPRBank().filter(p => p.id !== id)); },

  // Export / Import
  exportAll() {
    return { version:'1.0', exportedAt: new Date().toISOString(),
      companies: this.getCompanies(), es: this.getES(),
      interviews: this.getInterviews(), obog: this.getOBOG(), prBank: this.getPRBank() };
  },
  importAll(raw) {
    if (raw.companies)  this._set(this.K.C, raw.companies);
    if (raw.es)         this._set(this.K.E, raw.es);
    if (raw.interviews) this._set(this.K.I, raw.interviews);
    if (raw.obog)       this._set(this.K.O, raw.obog);
    if (raw.prBank)     this._set(this.K.P, raw.prBank);
  },
  clearAll() { Object.values(this.K).forEach(k => localStorage.removeItem(k)); }
};
