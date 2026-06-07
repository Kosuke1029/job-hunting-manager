const SettingsPage = {
  render() {
    const exported = DB.exportAll();
    const counts = {
      companies:  exported.companies.length,
      es:         exported.es.length,
      interviews: exported.interviews.length,
      obog:       exported.obog.length,
      steps:      (exported.steps||[]).length,
      todos:      (exported.todos||[]).length
    };
    return `
<div class="page-content">
  <div class="settings-grid">
    <div class="card">
      <div class="card-header"><h3 class="card-title">データのエクスポート</h3></div>
      <div class="card-body">
        <p class="text-muted mb-3">全データをJSONファイルとしてダウンロードします。友達への共有やバックアップに使用できます。</p>
        <div class="data-counts mb-3">
          <span>企業: <b>${counts.companies}</b>社</span>
          <span>ES: <b>${counts.es}</b>件</span>
          <span>面接メモ: <b>${counts.interviews}</b>件</span>
          <span>OB/OG: <b>${counts.obog}</b>件</span>
          <span>選考ステップ: <b>${counts.steps}</b>件</span>
          <span>TODO: <b>${counts.todos}</b>件</span>
        </div>
        <button class="btn btn-primary" onclick="SettingsPage.exportData()">JSONをダウンロード</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">データのインポート</h3></div>
      <div class="card-body">
        <p class="text-muted mb-3">JSONファイルを読み込みます。<b class="text-danger">現在のデータは上書きされます。</b>事前にエクスポートしてバックアップしてください。</p>
        <label class="btn btn-ghost" style="cursor:pointer">
          JSONファイルを選択
          <input type="file" accept=".json" style="display:none" onchange="SettingsPage.importData(this)">
        </label>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">データのリセット</h3></div>
      <div class="card-body">
        <p class="text-muted mb-3">全データを削除します。この操作は元に戻せません。</p>
        <button class="btn btn-danger" onclick="SettingsPage.confirmClear()">全データを削除する</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">共有方法</h3></div>
      <div class="card-body">
        <ol class="share-steps">
          <li>「JSONをダウンロード」でデータをエクスポート</li>
          <li>アプリフォルダ（就活管理アプリ）をzipに圧縮</li>
          <li>zip + JSONファイルを友達に送る</li>
          <li>友達はzipを解凍し、JSONをインポートすれば使用開始</li>
        </ol>
      </div>
    </div>
  </div>

  <div class="card mt-4" style="text-align:center;padding:28px 20px;">
    <button
      onclick="App.navigate('motiv')"
      style="
        background:none;border:none;cursor:pointer;
        font-size:15px;font-weight:600;
        color:rgba(255,255,255,0.45);
        letter-spacing:0.08em;
        transition:color 0.2s;
      "
      onmouseover="this.style.color='rgba(255,255,255,0.85)'"
      onmouseout="this.style.color='rgba(255,255,255,0.45)'"
    >やる気を失った俺たちへ</button>
  </div>
</div>`;
  },

  mount() {},

  exportData() {
    const data = DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download = `就活データ_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.json`;
    a.click();
    Toast.success('エクスポートしました');
  },

  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version) { Toast.error('無効なファイルです'); return; }
        Modal.confirm({
          title: 'データをインポート',
          message: `「${file.name}」をインポートします。現在のデータは上書きされます。よろしいですか？`,
          onConfirm: () => {
            DB.importAll(data);
            Toast.success('インポートしました');
            App.navigate('dashboard');
            App.updateSidebarStats();
          }
        });
      } catch { Toast.error('ファイルの読み込みに失敗しました'); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  confirmClear() {
    Modal.confirm({
      title: '全データを削除',
      message: '全データを削除します。この操作は元に戻せません。本当に削除しますか？',
      danger: true,
      onConfirm: () => {
        DB.clearAll(); Toast.success('全データを削除しました');
        App.navigate('dashboard'); App.updateSidebarStats();
      }
    });
  }
};
