const Toast = {
  show(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${esc(msg)}</span>`;
    document.getElementById('toast-container').appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast-visible'));
    setTimeout(() => {
      el.classList.remove('toast-visible');
      setTimeout(() => el.remove(), 350);
    }, 3000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); }
};
