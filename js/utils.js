// ── カラーマップ ────────────────────────────────────────────────────────
const TIER_COLOR = { S:'#fbbf24', A:'#818cf8', B:'#34d399', C:'#94a3b8', D:'#64748b' };
const TIER_BG    = { S:'rgba(251,191,36,0.15)', A:'rgba(129,140,248,0.15)', B:'rgba(52,211,153,0.15)', C:'rgba(148,163,184,0.12)', D:'rgba(100,116,139,0.12)' };

const IND_COLOR = {
  'IT・通信':'#60a5fa','コンサル':'#a78bfa','人材':'#f472b6',
  'SIer':'#22d3ee','金融':'#fbbf24','メーカー':'#34d399','広告':'#fb923c','その他':'#94a3b8',
  '保険':'#fbbf24','証券':'#f59e0b',
  '自動車・輸送機器':'#34d399','電機・電子':'#38bdf8','化学・素材':'#c084fc','食品・飲料':'#facc15',
  '不動産（デベロッパー）':'#f87171','不動産（仲介・管理）':'#fca5a5','建設・ゼネコン':'#d97706',
  '商社（総合）':'#22d3ee','商社（専門）':'#06b6d4',
  '小売・流通':'#a3e635',
  'エネルギー・インフラ':'#a8a29e','鉄道・航空・物流':'#94a3b8','ゲーム・エンタメ':'#f472b6','教育':'#a78bfa'
};
const IND_BG = {
  'IT・通信':'rgba(96,165,250,0.15)','コンサル':'rgba(167,139,250,0.15)','人材':'rgba(244,114,182,0.15)',
  'SIer':'rgba(34,211,238,0.15)','金融':'rgba(251,191,36,0.15)','メーカー':'rgba(52,211,153,0.15)','広告':'rgba(251,146,60,0.15)','その他':'rgba(148,163,184,0.12)',
  '保険':'rgba(251,191,36,0.15)','証券':'rgba(245,158,11,0.15)',
  '自動車・輸送機器':'rgba(52,211,153,0.15)','電機・電子':'rgba(56,189,248,0.15)','化学・素材':'rgba(192,132,252,0.15)','食品・飲料':'rgba(250,204,21,0.15)',
  '不動産（デベロッパー）':'rgba(248,113,113,0.15)','不動産（仲介・管理）':'rgba(252,165,165,0.15)','建設・ゼネコン':'rgba(217,119,6,0.15)',
  '商社（総合）':'rgba(34,211,238,0.15)','商社（専門）':'rgba(6,182,212,0.15)',
  '小売・流通':'rgba(163,230,53,0.15)',
  'エネルギー・インフラ':'rgba(168,162,158,0.15)','鉄道・航空・物流':'rgba(148,163,184,0.12)','ゲーム・エンタメ':'rgba(244,114,182,0.15)','教育':'rgba(167,139,250,0.15)'
};

const STAGE_COLOR = {
  'エントリー済み':'#94a3b8','書類選考中':'#60a5fa','WEBテスト中':'#a78bfa',
  'GD中':'#fbbf24','1次面接中':'#fb923c','2次面接中':'#f87171','3次面接中':'#ef4444'
};
const STAGE_BG = {
  'エントリー済み':'rgba(148,163,184,0.12)','書類選考中':'rgba(96,165,250,0.15)','WEBテスト中':'rgba(167,139,250,0.15)',
  'GD中':'rgba(251,191,36,0.15)','1次面接中':'rgba(251,146,60,0.15)','2次面接中':'rgba(248,113,113,0.15)','3次面接中':'rgba(239,68,68,0.2)'
};

const RESULT_COLOR = { 'IS参加決定':'#34d399','内定':'#10b981','お祈り':'#94a3b8','辞退':'#64748b' };
const RESULT_BG    = { 'IS参加決定':'rgba(52,211,153,0.18)','内定':'rgba(16,185,129,0.18)','お祈り':'rgba(148,163,184,0.12)','辞退':'rgba(100,116,139,0.12)' };

const ES_QUALITY_LABELS = ['自信あり', '普通', '要改善', 'AI生成'];
const ES_QUALITY_COLOR  = { '自信あり':'#34d399', '普通':'#94a3b8', '要改善':'#fb923c', 'AI生成':'#a78bfa' };
const ES_QUALITY_BG     = { '自信あり':'rgba(52,211,153,0.15)', '普通':'rgba(148,163,184,0.12)', '要改善':'rgba(251,146,60,0.15)', 'AI生成':'rgba(167,139,250,0.15)' };
const ES_QUALITY_ICON   = { '自信あり':'✨', '普通':'📝', '要改善':'📌', 'AI生成':'🤖' };

const COMPANY_TYPE_COLOR = { '本選考':'#818cf8', 'インターン':'#fbbf24' };
const COMPANY_TYPE_BG    = { '本選考':'rgba(129,140,248,0.18)', 'インターン':'rgba(251,191,36,0.18)' };

const STEP_RESULT_COLOR = {
  '未定':'#94a3b8', '進行中':'#60a5fa', '通過':'#34d399', 'お祈り':'#94a3b8', '辞退':'#64748b'
};
const STEP_RESULT_BG = {
  '未定':'rgba(148,163,184,0.12)', '進行中':'rgba(96,165,250,0.18)', '通過':'rgba(52,211,153,0.18)', 'お祈り':'rgba(148,163,184,0.12)', '辞退':'rgba(100,116,139,0.12)'
};

const TODO_PRIORITY_COLOR = { '高':'#f87171', '中':'#fbbf24', '低':'#34d399' };
const TODO_PRIORITY_BG    = { '高':'rgba(248,113,113,0.18)', '中':'rgba(251,191,36,0.18)', '低':'rgba(52,211,153,0.18)' };

// ── バッジ生成 ──────────────────────────────────────────────────────────
function renderTierBadge(tier) {
  if (!tier) return '<span class="badge badge-empty">-</span>';
  const c = TIER_COLOR[tier] || '#6b7280';
  const bg = TIER_BG[tier] || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg};border:1px solid ${c}30;font-weight:700">Tier ${tier}</span>`;
}

function renderIndustryBadge(ind) {
  if (!ind) return '';
  const c = IND_COLOR[ind] || '#6b7280';
  const bg = IND_BG[ind] || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg}">${ind}</span>`;
}

function renderStageBadge(stage) {
  if (!stage) return '';
  const c = STAGE_COLOR[stage] || '#6b7280';
  const bg = STAGE_BG[stage] || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg}">${stage}</span>`;
}

function renderQualityBadge(quality) {
  if (!quality) return '';
  const c  = ES_QUALITY_COLOR[quality]  || '#6b7280';
  const bg = ES_QUALITY_BG[quality]    || '#f3f4f6';
  const ic = ES_QUALITY_ICON[quality]  || '';
  return `<span class="badge quality-badge" style="color:${c};background:${bg};border:1px solid ${c}40">${ic} ${quality}</span>`;
}

function renderResultBadge(result) {
  if (!result) return '';
  const c = RESULT_COLOR[result] || '#6b7280';
  const bg = RESULT_BG[result] || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg};font-weight:600">${result}</span>`;
}

function renderCompanyTypeBadge(type) {
  if (!type) return '';
  const c  = COMPANY_TYPE_COLOR[type] || '#6b7280';
  const bg = COMPANY_TYPE_BG[type]    || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg};font-weight:600">${type}</span>`;
}

function renderStepResultBadge(result) {
  if (!result) return '';
  const c  = STEP_RESULT_COLOR[result] || '#94a3b8';
  const bg = STEP_RESULT_BG[result]    || '#f1f5f9';
  return `<span class="badge" style="color:${c};background:${bg}">${result}</span>`;
}

function renderTodoPriorityBadge(priority) {
  if (!priority) return '';
  const c  = TODO_PRIORITY_COLOR[priority] || '#6b7280';
  const bg = TODO_PRIORITY_BG[priority]    || '#f3f4f6';
  return `<span class="badge" style="color:${c};background:${bg};font-weight:700">${priority}</span>`;
}

// ── 選考状況の自動判定 ──────────────────────────────────────────────────
// 選考フローがある場合はそちらから状態を導出し、なければ手動フィールドを使う
function getComputedStatus(company) {
  // 手動で最終結果が設定されていれば優先
  if (company.finalResult) {
    return { currentStage: company.currentStage || '', finalResult: company.finalResult, nextDate: null };
  }

  const steps = DB.getSteps(company.id).sort((a,b) =>
    (a.order||0) - (b.order||0) || (a.createdAt||'') < (b.createdAt||'') ? -1 : 1
  );

  if (steps.length === 0) {
    return { currentStage: company.currentStage || '', finalResult: null, nextDate: company.scheduleDate || null };
  }

  // ステップを順番に確認して現在地を判定
  // インターン/jobステップが存在するだけでIS参加決定（お祈り・辞退は除く）
  const internStep = steps.find(s =>
    (s.name === 'インターン' || s.name === 'job') &&
    s.result !== 'お祈り' && s.result !== '辞退'
  );
  if (internStep) {
    return { currentStage: 'インターン（参加決定）', finalResult: 'IS参加決定', nextDate: null };
  }

  for (const s of steps) {
    if (s.result === 'お祈り') return { currentStage: s.name, finalResult: 'お祈り', nextDate: null };
    if (s.result === '辞退')   return { currentStage: s.name, finalResult: '辞退',   nextDate: null };
    if (s.result === '進行中' || s.result === '未定') {
      return { currentStage: s.name, finalResult: null, nextDate: s.date || null };
    }
  }

  // 全ステップ通過（手動のfinalResultなし）
  const lastStep = steps[steps.length - 1].name;
  if (company.type === 'インターン') {
    return { currentStage: lastStep + '（通過）', finalResult: 'IS参加決定', nextDate: null };
  }
  return { currentStage: lastStep + '（通過）', finalResult: null, nextDate: null };
}

function renderCurrentStageBadge(stage) {
  if (!stage) return '';
  if (STAGE_COLOR[stage]) return renderStageBadge(stage);
  return `<span class="badge" style="color:#6366f1;background:#e0e7ff">${esc(stage)}</span>`;
}

// ── 日付ユーティリティ ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso);
  return Math.ceil((target - today) / 86400000);
}

// ── フォーム値取得 ───────────────────────────────────────────────────────
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};
  const data = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') data[el.name] = el.checked;
    else data[el.name] = el.value.trim();
  });
  return data;
}

// ── セレクトオプション生成 ───────────────────────────────────────────────
function selectOptions(arr, selected = '', placeholder = '選択してください') {
  const opts = [`<option value="">${placeholder}</option>`];
  arr.forEach(v => opts.push(`<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`));
  return opts.join('');
}

// ── エスケープ ───────────────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
