/* Direct document-to-document reveal. The browser retains the outgoing page
   while loading the destination; no empty overlay or intercepted navigation. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Remove flags left by the previous curtain implementation on an open session.
  try { sessionStorage.removeItem('heven:page-entry'); } catch {}
  const documentKey = url => [url.origin, url.pathname.replace(/\/$/, '') || '/', url.search].join('|');
  const supportedPath = path => path === '/' || /^\/case-studies(?:\/[a-z0-9-]+)?\/?$/.test(path);
  const destination = link => {
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !supportedPath(url.pathname) || documentKey(url) === documentKey(location)) return;
    return url;
  };
  // Intent-based warming: no downloads for section anchors or external links.
  const warmed = new Set();
  const warm = event => {
    if (window.navigator?.connection?.saveData) return;
    const url = destination(event.target?.closest?.('a[href]'));
    if (!url || warmed.has(documentKey(url)) || warmed.size >= 8) return;
    warmed.add(documentKey(url));
    const prefetch = (href, as) => {
      const resource = document.createElement('link');
      resource.rel = 'prefetch'; resource.href = href; resource.as = as;
      document.head.append(resource);
    };
    prefetch(url.origin + url.pathname + url.search, 'document');
    const slug = url.pathname.match(/^\/case-studies\/(emyasa|stone-kuche|parsomen|dor|dor-os|academic-quest)\/?$/)?.[1];
    if (slug && window.innerWidth < 900) {
      const width = window.innerWidth * (window.devicePixelRatio || 1);
      prefetch(`/assets/cases/heroes/mobile/${slug}-${width <= 540 ? 540 : 1080}.webp`, 'image');
    } else if (slug) {
      const width = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * (window.devicePixelRatio || 1);
      prefetch(`/assets/cases/heroes/${slug}${width <= 1280 ? '-1280' : ''}.webp`, 'image');
    }
  };
  document.addEventListener('pointerover', warm, {passive:true});
  document.addEventListener('focusin', warm);
  document.addEventListener('pointerdown', warm, {passive:true});
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    warm(event);
  });
  window.addEventListener('pageswap', event => {
    if (reduced.matches) event.viewTransition?.skipTransition();
  });
  window.addEventListener('pagereveal', event => {
    if (reduced.matches) event.viewTransition?.skipTransition();
    window.HevenMotion?.reset();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) window.HevenMotion?.reset();
  });
})();

