// ── カラーマップ ────────────────────────────────────────────────────────
const TIER_COLOR = { S:'#f59e0b', A:'#6366f1', B:'#10b981', C:'#6b7280', D:'#94a3b8' };
const TIER_BG    = { S:'#fef3c7', A:'#e0e7ff', B:'#d1fae5', C:'#f3f4f6', D:'#f1f5f9' };

const IND_COLOR = {
  'IT・通信':'#3b82f6','コンサル':'#8b5cf6','人材':'#f43f5e',
  'SIer':'#06b6d4','金融':'#f59e0b','メーカー':'#10b981','広告':'#f97316','その他':'#6b7280'
};
const IND_BG = {
  'IT・通信':'#dbeafe','コンサル':'#ede9fe','人材':'#ffe4e6',
  'SIer':'#cffafe','金融':'#fef3c7','メーカー':'#d1fae5','広告':'#ffedd5','その他':'#f3f4f6'
};

const STAGE_COLOR = {
  'エントリー済み':'#94a3b8','書類選考中':'#3b82f6','WEBテスト中':'#8b5cf6',
  'GD中':'#f59e0b','1次面接中':'#f97316','2次面接中':'#ef4444','3次面接中':'#dc2626'
};
const STAGE_BG = {
  'エントリー済み':'#f1f5f9','書類選考中':'#dbeafe','WEBテスト中':'#ede9fe',
  'GD中':'#fef3c7','1次面接中':'#ffedd5','2次面接中':'#fee2e2','3次面接中':'#fecaca'
};

const RESULT_COLOR = { 'IS参加決定':'#10b981','内定':'#059669','お祈り':'#6b7280','辞退':'#9ca3af' };
const RESULT_BG    = { 'IS参加決定':'#d1fae5','内定':'#a7f3d0','お祈り':'#f3f4f6','辞退':'#f9fafb' };

const ES_QUALITY_LABELS = ['自信あり', '普通', '要改善', 'AI生成'];
const ES_QUALITY_COLOR  = { '自信あり':'#10b981', '普通':'#6b7280', '要改善':'#f97316', 'AI生成':'#8b5cf6' };
const ES_QUALITY_BG     = { '自信あり':'#d1fae5', '普通':'#f3f4f6', '要改善':'#ffedd5', 'AI生成':'#ede9fe' };
const ES_QUALITY_ICON   = { '自信あり':'✨', '普通':'📝', '要改善':'📌', 'AI生成':'🤖' };

const COMPANY_TYPE_COLOR = { '本選考':'#6366f1', 'インターン':'#f59e0b' };
const COMPANY_TYPE_BG    = { '本選考':'#e0e7ff', 'インターン':'#fef3c7' };

const STEP_RESULT_COLOR = {
  '未定':'#94a3b8', '進行中':'#3b82f6', '通過':'#10b981', 'お祈り':'#6b7280', '辞退':'#9ca3af'
};
const STEP_RESULT_BG = {
  '未定':'#f1f5f9', '進行中':'#dbeafe', '通過':'#d1fae5', 'お祈り':'#f3f4f6', '辞退':'#f9fafb'
};

const TODO_PRIORITY_COLOR = { '高':'#ef4444', '中':'#f59e0b', '低':'#10b981' };
const TODO_PRIORITY_BG    = { '高':'#fee2e2', '中':'#fef3c7', '低':'#d1fae5' };

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
  for (const s of steps) {
    if (s.result === 'お祈り') return { currentStage: s.name, finalResult: 'お祈り', nextDate: null };
    if (s.result === '辞退')   return { currentStage: s.name, finalResult: '辞退',   nextDate: null };
    if (s.result === '進行中' || s.result === '未定') {
      return { currentStage: s.name, finalResult: null, nextDate: s.date || null };
    }
  }

  // 全ステップ通過（手動のfinalResultなし）
  return { currentStage: steps[steps.length-1].name + '（通過）', finalResult: null, nextDate: null };
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
