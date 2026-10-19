/* Native document transitions retain normal navigation, history and link behavior.
   The fallback is limited to the home/projects routes which load these assets. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('CSSViewTransitionRule' in window && 'onpageswap' in window && 'onpagereveal' in window) return;
  const root = document.documentElement;
  const storageKey = 'heven:page-entry';
  const storage = (value) => { try {
    if (value === undefined) { const saved = sessionStorage.getItem(storageKey); sessionStorage.removeItem(storageKey); return saved; }
    sessionStorage.setItem(storageKey, value);
  } catch {} };
  const entering = storage();
  if (entering && !reduced.matches) root.classList.add('is-page-entering');
  document.body.addEventListener('animationend', event => {
    if (event.animationName === 'heven-fallback-in') root.classList.remove('is-page-entering');
  });
  let leaving = false, departure;
  const supportedPath = path => path === '/' || /^\/case-studies\/(?:[a-z0-9-]+\/)?$/.test(path);
  document.addEventListener('click', async event => {
    const link = event.target?.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self') || reduced.matches || !document.body.animate) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !supportedPath(url.pathname) ||
        (url.pathname === location.pathname && url.search === location.search)) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    departure = document.body.animate([{filter:'blur(0px)',opacity:1},{filter:'blur(6px)',opacity:.7}], {duration:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    try { await departure.finished; } catch { if (!leaving) return; }
    storage('1'); location.assign(url.href);
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    leaving = false; departure?.cancel(); root.classList.remove('is-page-entering');
  });
})();
