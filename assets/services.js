(() => {
  const section = document.querySelector('[data-commerce-services]');
  if (!section) return;
  const rows = [...section.querySelectorAll('.commerce-service')];
  const setOpen = (row, open) => {
    row.classList.toggle('is-open', open);
    row.querySelector('.commerce-service-toggle').setAttribute('aria-expanded', String(open));
    const panel = row.querySelector('.commerce-service-panel');
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    row.querySelector('.commerce-service-symbol').textContent = open ? '−' : '+';
  };
  rows.forEach(row => {
    const button = row.querySelector('.commerce-service-toggle');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      rows.forEach(item => setOpen(item, item === row && open));
    });
  });
})();
