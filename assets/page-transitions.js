/* One transition controller for every supported route and studio navigation link.
   Run in the head so the destination is covered before its first paint. */
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
  const entryKey = href => { try {
    const url = new URL(href, location.href);
    return [url.origin, url.pathname.replace(/\/$/, '') || '/', url.search, url.hash].join('|');
  } catch { return null; } };
  if (pending && entryKey(pending) === entryKey(location.href) && !reduced.matches) root.classList.add('is-page-entering');
  const initialize = () => {
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain'; curtain.setAttribute('aria-hidden', 'true'); curtain.inert = true;
    document.body.append(curtain);
    let leaving = false, coverMotion, effects = [], transitionId = 0;
    const reset = () => {
      transitionId++;
      leaving = false; coverMotion?.cancel(); coverMotion = undefined;
      effects.forEach(effect => effect.cancel()); effects = [];
      curtain.style.transform = '';
      root.classList.remove('is-page-entering', 'is-page-leaving');
      window.HevenMotion?.reset();
    };
    const enter = async (waitForHero = false) => {
      const id = transitionId;
      if (waitForHero) {
        const image = document.querySelector('[data-case-hero] img');
        if (image?.decode) await Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 650))]);
      }
      if (!leaving || id !== transitionId) return;
      if (reduced.matches) { reset(); return; }
      effects.forEach(effect => effect.cancel()); effects = [];
      const previous = coverMotion;
      coverMotion = curtain.animate([{transform:'translate3d(0,0,0)'},{transform:'translate3d(0,-100%,0)'}], {duration:650,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
      previous?.cancel();
      root.classList.remove('is-page-entering');
      const main = document.querySelector('main');
      if (main) effects.push(main.animate([{transform:'translate3d(0,28px,0)',opacity:.8},{transform:'translate3d(0,0,0)',opacity:1}], {duration:650,easing:'cubic-bezier(.22,1,.36,1)'}));
      try { await coverMotion.finished; } catch {}
      if (id === transitionId) reset();
    };
    const supportedPath = path => path === '/' || /^\/case-studies(?:\/[a-z0-9-]+)?\/?$/.test(path);
    document.addEventListener('click', async event => {
      const link = event.target?.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          link.hasAttribute('download') || (link.target && link.target !== '_self') || reduced.matches) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !supportedPath(url.pathname)) return;
      const sameDocument = url.pathname === location.pathname && url.search === location.search;
      let target;
      if (sameDocument) {
        if (!url.hash || !link.closest('.cinema-menu-panel, .sticky-footer-wrapper')) return;
        try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
        if (!target) return;
      }
      event.preventDefault();
      if (leaving) return;
      leaving = true; const id = ++transitionId; root.classList.add('is-page-leaving');
      const main = document.querySelector('main');
      if (main) effects.push(main.animate([{filter:'blur(0px)'},{filter:'blur(6px)'}], {duration:480,easing:'ease',fill:'forwards'}));
      coverMotion = curtain.animate([{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}], {duration:480,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
      try { await coverMotion.finished; } catch { if (!leaving) return; }
      if (!leaving || id !== transitionId) return;
      if (sameDocument) {
        location.hash = url.hash;
        target.scrollIntoView({block:'start',behavior:'instant'});
        window.HevenMotion?.reset();
        await enter();
      } else {
        storage(url.href); location.assign(url.href);
      }
    });
    window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
    if (root.classList.contains('is-page-entering')) {
      leaving = true; root.classList.add('is-page-leaving'); curtain.style.transform = 'translate3d(0,0,0)';
      void enter(true);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true});
  else initialize();
})();
