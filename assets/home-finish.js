(() => {
  const toggle = document.querySelector('.cinema-menu-toggle');
  const panel = document.getElementById('mobile-menu-panel');
  const main = document.querySelector('main');
  const footer = document.querySelector('.sticky-footer-wrapper');
  const nav = document.querySelector('.cinema-nav');
  let footerVisible = false;
  const syncNavigation = () => {
    if (!nav) return;
    const hidden = footerVisible && !document.body.classList.contains('mobile-menu-open');
    if (hidden && nav.contains(document.activeElement)) footer?.querySelector('a')?.focus({preventScroll: true});
    nav.classList.toggle('is-footer-hidden', hidden);
    nav.inert = hidden;
    nav.setAttribute('aria-hidden', String(hidden));
  };
  const setMenu = (open, returnFocus = false) => {
    document.body.classList.toggle('mobile-menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    panel?.setAttribute('aria-hidden', String(!open));
    if (panel) panel.inert = !open;
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    syncNavigation();
    if (open) requestAnimationFrame(() => panel?.querySelector('a')?.focus());
    else if (returnFocus) {
      if (footerVisible) footer?.querySelector('a')?.focus({preventScroll: true});
      else toggle?.focus();
    }
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  panel?.addEventListener('click', event => {
    if (event.target.closest('a[href]')) setMenu(false);
  });
  window.addEventListener('pageshow', event => { if (event.persisted) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) setMenu(false, true);
  });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const questions = [...document.querySelectorAll('.chat-item')];
  const pending = new Map();
  const resetReply = item => {
    (pending.get(item) || []).forEach(clearTimeout);
    pending.delete(item);
    item.classList.remove('is-animated');
    item.querySelector('.chat-typing').hidden = true;
    item.querySelectorAll('.chat-message').forEach(message => { message.hidden = false; });
    item.querySelector('.chat-reply').setAttribute('aria-busy', 'false');
  };
  const reply = item => {
    questions.forEach(other => {
      if (other !== item) { other.open = false; resetReply(other); }
    });
    resetReply(item);
    if (motion.matches) return;
    const messages = [...item.querySelectorAll('.chat-message')];
    const typing = item.querySelector('.chat-typing');
    const region = item.querySelector('.chat-reply');
    item.classList.add('is-animated');
    region.setAttribute('aria-busy', 'true');
    messages.forEach(message => { message.hidden = true; });
    typing.hidden = false;
    pending.set(item, messages.map((message, index) => setTimeout(() => {
      if (!item.open) return;
      typing.hidden = true;
      message.hidden = false;
      if (index === messages.length - 1) region.setAttribute('aria-busy', 'false');
    }, 380 + index * 220)));
  };
  questions.forEach(item => {
    item.querySelector('summary').addEventListener('click', () => { if (!item.open) reply(item); });
    item.addEventListener('toggle', () => {
      if (!item.open) resetReply(item);
      else if (!pending.has(item) && !motion.matches) reply(item);
    });
    item.addEventListener('keydown', event => {
      if (event.key === 'Escape' && item.open) {
        item.open = false;
        resetReply(item);
        item.querySelector('summary').focus();
      }
    });
  });
  motion.addEventListener('change', () => { if (motion.matches) questions.forEach(resetReply); });

  if (footer && nav) {
    const checkFooter = () => {
      const rect = footer.getBoundingClientRect();
      footerVisible = rect.top < window.innerHeight && rect.bottom > 0;
      syncNavigation();
    };
    checkFooter();
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const entry = entries.find(entry => entry.target === footer);
        if (!entry) return;
        footerVisible = entry.isIntersecting && entry.intersectionRect.height > 0;
        syncNavigation();
      }, {threshold: .001});
      observer.observe(footer);
    } else {
      let frame = 0;
      const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; checkFooter(); });
      };
      window.addEventListener('scroll', schedule, {passive: true});
      window.addEventListener('resize', schedule, {passive: true});
    }
  }

  if (footer && 'IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      footer.querySelectorAll('.footer-nav-col,.footer-brand,.footer-info').forEach(element => element.classList.add('visible'));
      observer.disconnect();
    }, {threshold: .15});
    footer.classList.add('footer-animated');
    observer.observe(footer);
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
