/* Mobile-only enhancements; no listeners or DOM additions on desktop. */
(() => {
  const mobile = window.matchMedia('(max-width: 899px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup = () => {};
  function mount() {
    cleanup();
    cleanup = () => {};
    if (!mobile.matches) return;
    const abort = new AbortController();
    const cleanups = [() => abort.abort()];
    const listen = (node, type, fn, options = {}) => node?.addEventListener(type, fn, {...options, signal: abort.signal});

    const phone = document.querySelector('.flow-mobile-device img');
    if (phone) {
      const scene = phone.closest('.flow-scene');
      const showFallback = () => scene.classList.add('is-mobile-device-failed');
      const showPhoto = () => scene.classList.remove('is-mobile-device-failed');
      listen(phone, 'error', showFallback);
      listen(phone, 'load', showPhoto);
      if (phone.complete && !phone.naturalWidth) showFallback();
      cleanups.push(showPhoto);
    }

    document.querySelectorAll('.case-track, .case-device-display').forEach((track, index) => {
      const isMac = track.classList.contains('case-device-display');
      const parent = isMac ? track.closest('.case-device') : track.closest('.case-viewport');
      if (!parent) return;
      const previousId = track.getAttribute('id');
      if (!previousId) track.id = 'mobile-gallery-' + index;
      const controls = document.createElement('div');
      controls.className = 'mobile-gallery-controls';
      controls.setAttribute('role', 'group');
      controls.setAttribute('aria-label', isMac ? 'Pantallas del proyecto' : 'Recorrer proyectos');
      let positions = [], maximum = 0, requestedIndex = null;
      const nearest = () => positions.reduce((best, position, i) => Math.abs(position - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? i : best, 0);
      const buttons = [-1, 1].map(direction => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-controls', track.id);
        button.setAttribute('aria-label', (isMac ? 'Pantalla ' : 'Proyecto ') + (direction < 0 ? 'anterior' : 'siguiente'));
        const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (direction < 0 ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6') + '"/></svg>';
        button.innerHTML = icon;
        listen(button, 'click', () => {
          if (!positions.length) return;
          // Retarget native scrolling from the last request, even before its midpoint.
          const current = requestedIndex ?? nearest();
          requestedIndex = Math.max(0, Math.min(positions.length - 1, current + direction));
          if (window.HevenFeel) window.HevenFeel.scrollTo(track, positions[requestedIndex]);
          else track.scrollTo({left: positions[requestedIndex], behavior: reduced.matches ? 'instant' : 'smooth'});
          sync();
        });
        controls.append(button);
        return button;
      });
      parent.append(controls);
      const sync = () => {
        if (requestedIndex !== null && Math.abs(track.scrollLeft - positions[requestedIndex]) <= 2) requestedIndex = null;
        const destination = requestedIndex === null ? track.scrollLeft : positions[requestedIndex];
        buttons[0].disabled = !positions.length || destination <= 2;
        buttons[1].disabled = !positions.length || destination >= maximum - 2;
      };
      const measure = () => {
        window.HevenFeel?.stop(track);
        const items = [...track.children].filter(item => !item.hidden);
        maximum = Math.max(0, track.scrollWidth - track.clientWidth);
        const first = items[0]?.offsetLeft || 0;
        positions = [...new Set(items.map(item => Math.max(0, Math.min(maximum, item.offsetLeft - first))))];
        requestedIndex = null;
        sync();
      };
      const takeOver = () => {
        window.HevenFeel?.stop(track);
        if (requestedIndex === null) return;
        requestedIndex = null;
        track.scrollTo({left: track.scrollLeft, behavior: 'instant'});
        sync();
      };
      listen(track, 'scroll', sync, {passive: true});
      // Touch and wheel stay native: no preventDefault, capture or extra momentum.
      listen(track, 'pointerdown', takeOver, {passive: true});
      listen(track, 'wheel', takeOver, {passive: true});
      listen(track, 'keydown', () => { window.HevenFeel?.stop(track); requestedIndex = null; sync(); });
      listen(track, 'scrollend', () => { if (!window.HevenFeel?.isScrolling(track)) { requestedIndex = null; sync(); } });
      const resize = new ResizeObserver(measure);
      resize.observe(track);
      const changes = new MutationObserver(measure);
      changes.observe(track, {subtree: true, attributes: true, attributeFilter: ['hidden']});
      measure();
      cleanups.push(() => {
        window.HevenFeel?.stop(track);
        resize.disconnect(); changes.disconnect(); controls.remove();
        if (!previousId) track.removeAttribute('id');
      });
    });

    // Keep the initial FAQ short without deleting answers or creating a nested scroller.
    const questions = [...document.querySelectorAll('.chat-item')];
    if (questions.length > 4) {
      const extra = questions.slice(4);
      const original = extra.map(item => ({item, hidden: item.hidden, id: item.getAttribute('id')}));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-faq-more';
      original.forEach(({item, id}, i) => { if (!id) item.id = 'mobile-faq-' + i; });
      button.setAttribute('aria-controls', extra.map(item => item.id).join(' '));
      const show = expanded => {
        extra.forEach(item => { item.hidden = !expanded; });
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Ver menos preguntas −' : 'Ver las ' + extra.length + ' preguntas restantes +';
      };
      show(false);
      document.querySelector('.chat-faq')?.append(button);
      listen(button, 'click', () => {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        if (!expanded) extra.forEach(item => { item.open = false; });
        show(expanded);
        if (!expanded) button.scrollIntoView({block: 'nearest', behavior: 'instant'});
        window.HevenMotion?.invalidate();
      });
      cleanups.push(() => {
        original.forEach(({item, hidden, id}) => { item.hidden = hidden; if (!id) item.removeAttribute('id'); });
        button.remove();
      });
    }

    // Fit the final wordmark once per width/font change, with no scroll animation.
    const brand = document.querySelector('.footer-brand');
    const wordmark = brand?.querySelector('.footer-logo-large');
    if (wordmark) {
      const fit = () => {
        if (abort.signal.aborted) return;
        const available = brand.clientWidth - 2;
        const width = wordmark.getBoundingClientRect().width;
        const size = parseFloat(getComputedStyle(wordmark).fontSize);
        if (width > 0 && available > 0 && Math.abs(width - available) > .5) {
          wordmark.style.setProperty('--mobile-wordmark-size', (size * available / width).toFixed(3) + 'px');
        }
      };
      const resize = new ResizeObserver(fit);
      resize.observe(brand);
      document.fonts?.ready.then(fit);
      fit();
      cleanups.push(() => { resize.disconnect(); wordmark.style.removeProperty('--mobile-wordmark-size'); });
    }

    // Keep keyboard focus in the visible menu, including after orientation changes.
    const panel = document.getElementById('mobile-menu-panel');
    const nav = document.querySelector('.cinema-nav');
    listen(document, 'keydown', event => {
      if (event.key !== 'Tab' || !document.body.classList.contains('mobile-menu-open')) return;
      const nodes = [...(nav?.querySelectorAll('button,a') || []), ...(panel?.querySelectorAll('a') || [])]
        .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
      if (!nodes.length) return;
      const i = nodes.indexOf(document.activeElement);
      if (i < 0 || (event.shiftKey && i === 0) || (!event.shiftKey && i === nodes.length - 1)) {
        event.preventDefault(); event.stopImmediatePropagation();
        nodes[event.shiftKey ? nodes.length - 1 : 0].focus();
      }
    }, {capture: true});
    cleanup = () => cleanups.forEach(fn => fn());
  }
  mobile.addEventListener('change', mount);
  mount();
  window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); });
})();

