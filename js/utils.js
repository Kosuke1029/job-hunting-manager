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
