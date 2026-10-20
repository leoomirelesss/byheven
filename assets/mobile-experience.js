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
      const buttons = [-1, 1].map(direction => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-controls', track.id);
        button.setAttribute('aria-label', (isMac ? 'Pantalla ' : 'Proyecto ') + (direction < 0 ? 'anterior' : 'siguiente'));
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="' + (direction < 0 ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6') + '"/></svg>';
        listen(button, 'click', () => {
          const items = [...track.children].filter(item => !item.hidden);
          if (!items.length) return;
          const first = items[0].offsetLeft;
          const positions = items.map(item => item.offsetLeft - first);
          const current = positions.reduce((best, position, i) => Math.abs(position - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? i : best, 0);
          const next = Math.max(0, Math.min(items.length - 1, current + direction));
          track.scrollTo({left: positions[next], behavior: reduced.matches ? 'instant' : 'smooth'});
        });
        controls.append(button);
        return button;
      });
      parent.append(controls);
      const sync = () => {
        buttons[0].disabled = track.scrollLeft <= 2;
        buttons[1].disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      };
      listen(track, 'scroll', sync, {passive: true});
      const resize = new ResizeObserver(sync);
      resize.observe(track);
      const changes = new MutationObserver(sync);
      changes.observe(track, {subtree: true, attributes: true, attributeFilter: ['hidden']});
      sync();
      cleanups.push(() => {
        resize.disconnect(); changes.disconnect(); controls.remove();
        if (!previousId) track.removeAttribute('id');
      });
    });

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
