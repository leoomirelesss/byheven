(() => {
  const toggle = document.querySelector('.cinema-menu-toggle');
  const panel = document.getElementById('mobile-menu-panel');
  const main = document.querySelector('main');
  const setMenu = (open, returnFocus = false) => {
    document.body.classList.toggle('mobile-menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    panel?.setAttribute('aria-hidden', String(!open));
    if (panel) panel.inert = !open;
    if (main) main.inert = open;
    if (open) requestAnimationFrame(() => panel?.querySelector('a')?.focus());
    else if (returnFocus) toggle?.focus();
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  panel?.addEventListener('click', event => {
    if (event.target.closest('a[href^="#"]')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) setMenu(false, true);
  });

  const steps = [...document.querySelectorAll('[data-home-step]')];
  const count = document.querySelector('[data-home-step-count]');
  if ('IntersectionObserver' in window && steps.length) {
    const observer = new IntersectionObserver(entries => {
      const current = entries.find(entry => entry.isIntersecting)?.target;
      if (!current) return;
      steps.forEach(step => step.classList.toggle('is-current', step === current));
      if (count) count.textContent = current.dataset.homeStep.padStart(2, '0');
    }, {rootMargin: '-25% 0px -40% 0px'});
    steps.forEach(step => observer.observe(step));
  }

  const form = document.getElementById('contact-form');
  const status = document.getElementById('home-form-status');
  const required = form ? [...form.querySelectorAll('[required]')] : [];
  required.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
  form?.addEventListener('submit', event => {
    event.preventDefault();
    required.forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Completa este campo para continuar.'));
    if (!form.reportValidity()) return;
    const value = name => form.elements.namedItem(name)?.value.trim() || '';
    const message = [
      'Hola BY HEVËN, me gustaría platicar sobre mi proyecto.',
      '',
      `Nombre: ${value('name')}`,
      ...(value('business') ? [`Negocio o sitio: ${value('business')}`] : []),
      `Me interesa: ${value('service')}`,
      '',
      value('text')
    ].join('\n');
    const url = new URL(form.action);
    url.searchParams.set('text', message);
    if (status) status.textContent = 'Tu mensaje está listo. Se abrirá WhatsApp para que lo revises y lo envíes.';
    window.location.assign(url.href);
  });
})();
