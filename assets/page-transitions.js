/* Page changes only. Section anchors retain the home's native scroll behavior.
   The head bootstrap covers the destination before its first paint. */
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'heven:page-entry';
  const storage = value => { try {
    if (value === undefined) { const saved = sessionStorage.getItem(storageKey); sessionStorage.removeItem(storageKey); return saved; }
    sessionStorage.setItem(storageKey, value);
  } catch {} };
  const pending = storage();
  if (typeof root.animate !== 'function') return;
  const documentKey = url => [url.origin, url.pathname.replace(/\/$/, '') || '/', url.search].join('|');
  const entryKey = href => { try {
    const url = new URL(href, location.href);
    return [documentKey(url), url.hash].join('|');
  } catch { return null; } };
  if (pending && entryKey(pending) === entryKey(location.href) && !reduced.matches) root.classList.add('is-page-entering');
  const domReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  const painted = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const initialize = () => {
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain'; curtain.setAttribute('aria-hidden', 'true'); curtain.inert = true;
    document.body.append(curtain);
    let leaving = false, coverMotion, transitionId = 0, recovery;
    const reset = () => {
      transitionId++;
      leaving = false; coverMotion?.cancel(); coverMotion = undefined;
      clearTimeout(recovery);
      curtain.style.transform = '';
      root.classList.remove('is-page-entering', 'is-page-leaving');
      window.HevenMotion?.reset();
    };
    const enter = async () => {
      const id = transitionId;
      const current = () => leaving && id === transitionId;
      // Keep the destination covered until its modules, fonts and first layout are ready.
      await domReady;
      await document.fonts?.ready;
      if (!current()) return;
      window.HevenMotion?.reset();
      await painted();
      if (!current()) return;
      if (location.hash) {
        try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'start',behavior:'instant'}); } catch {}
      }
      // Decode the actual visible images, including responsive heroes and home section content.
      // A timer cannot determine readiness; offscreen galleries must not delay the reveal.
      const images = [...document.querySelectorAll('main img')].filter(image => {
        const rect = image.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      });
      await Promise.all(images.map(image => {
        image.loading = 'eager';
        if (image.decode) return image.decode().catch(() => {});
        if (image.complete) return;
        return new Promise(resolve => {
          const done = () => { image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
          image.addEventListener('load', done, {once:true}); image.addEventListener('error', done, {once:true});
        });
      }));
      if (!current()) return;
      window.HevenMotion?.reset();
      await painted();
      if (!current()) return;
      if (reduced.matches) { reset(); return; }
      const previous = coverMotion;
      coverMotion = curtain.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(0,-100%,0)'}], {duration:520,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      previous?.cancel();
      root.classList.remove('is-page-entering');
      try { await coverMotion.finished; } catch {}
      if (id === transitionId) reset();
    };
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
      if (slug) {
        const width = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * (window.devicePixelRatio || 1);
        prefetch(`/assets/cases/heroes/${slug}${width <= 1280 ? '-1280' : ''}.webp`, 'image');
      }
    };
    document.addEventListener('pointerover', warm, {passive:true});
    document.addEventListener('focusin', warm);
    document.addEventListener('pointerdown', warm, {passive:true});
    document.addEventListener('click', async event => {
      const link = event.target?.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          reduced.matches) return;
      const url = destination(link);
      if (!url) return;
      event.preventDefault();
      if (leaving) return;
      warm(event);
      leaving = true; const id = ++transitionId; root.classList.add('is-page-leaving');
      // Animate only the overlay: transforms/filters on main break fixed and sticky chapters.
      coverMotion = curtain.animate([{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}], {duration:360,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      try { await coverMotion.finished; } catch { if (!leaving) return; }
      if (!leaving || id !== transitionId) return;
      storage(url.href); location.assign(url.href);
      // If a navigation is canceled or fails, the current page remains usable.
      recovery = setTimeout(reset, 8000);
    });
    window.addEventListener('pagehide', () => clearTimeout(recovery));
    window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
    if (root.classList.contains('is-page-entering')) {
      leaving = true; root.classList.add('is-page-leaving'); curtain.style.transform = 'translate3d(0,0,0)';
      void enter();
    }
  };
  // Mount the cover as soon as body exists; reveal only after the destination is ready.
  if (document.readyState === 'loading') {
    const ready = () => {
      if (document.readyState === 'loading') return;
      document.removeEventListener('readystatechange', ready);
      initialize();
    };
    document.addEventListener('readystatechange', ready);
  } else initialize();
})();
