const Modal = {
  _cb: null,

  show({ title, body, submitLabel = '保存', onSubmit, wide = false, noFooter = false }) {
    this._cb = onSubmit || null;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = noFooter ? '' : `
      <button class="btn btn-ghost" onclick="Modal.close()">キャンセル</button>
      <button class="btn btn-primary" onclick="Modal.submit()">${esc(submitLabel)}</button>`;
    document.getElementById('modal-box').className = 'modal-box' + (wide ? ' modal-wide' : '');
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // フォームのEnterキーで送信
    setTimeout(() => {
      const form = document.querySelector('#modal-body form');
      if (form) form.addEventListener('keydown', e => { if (e.key==='Enter' && e.target.tagName!=='TEXTAREA') { e.preventDefault(); this.submit(); } });
      const first = document.querySelector('#modal-body input, #modal-body select, #modal-body textarea');
      if (first) first.focus();
    }, 50);
  },

  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    this._cb = null;
  },

  submit() { if (this._cb) this._cb(); },

  handleOverlayClick(e) { if (e.target.id === 'modal-overlay') this.close(); },

  confirm({ title, message, onConfirm, danger = false }) {
    this.show({
      title,
      body: `<p class="confirm-msg">${esc(message)}</p>`,
      submitLabel: danger ? '削除する' : 'OK',
      onSubmit: () => { this.close(); onConfirm(); }
    });
  }
};
