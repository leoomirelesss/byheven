/* Initial document readiness only. Lazy media and section links never reopen it. */
(() => {
  const root = document.documentElement;
  const desktop = window.matchMedia('(min-width: 900px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const restore = new Map();
  let finished = false, closing = false, mounted = false, observer, frame = 0, exitTimer;
  const listen = (node, type, handler) => node.addEventListener(type, handler, {signal: abort.signal});
  root.dataset.siteLoading = 'pending';
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(deadline); clearTimeout(exitTimer); cancelAnimationFrame(frame);
    observer?.disconnect(); abort.abort();
    restore.forEach((inert, node) => { node.inert = inert; });
    const loader = document.querySelector('.site-loader');
    const hadFocus = loader?.contains(document.activeElement);
    loader?.remove();
    document.querySelector('.site-loading-veil')?.remove();
    delete root.dataset.siteLoading;
    if (hadFocus) {
      const main = document.querySelector('main');
      if (main && !main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), {once: true});
      }
      main?.focus({preventScroll: true});
    }
    window.HevenMotion?.reset();
  };
  const reveal = () => {
    if (closing || finished) return;
    closing = true;
    restore.forEach((inert, node) => { node.inert = inert; });
    if (reduced.matches) { finish(); return; }
    root.dataset.siteLoading = 'leaving';
    exitTimer = setTimeout(finish, 760);
  };
  // A broken module, font or connection must never trap the visitor.
  const deadline = setTimeout(finish, 10000);
  listen(document, 'keydown', event => { if (event.key === 'Escape') finish(); });
  listen(window, 'pageshow', event => { if (event.persisted) finish(); });
  listen(window, 'pagehide', finish);

  const imageReady = image => new Promise(resolve => {
    if (!image) { resolve(); return; }
    let settled = false;
    const settle = failed => {
      if (settled) return;
      settled = true;
      if (failed) image.style.visibility = 'hidden';
      resolve();
    };
    const decode = () => {
      if (image.decode) image.decode().then(() => settle(false), () => settle(true));
      else settle(!image.naturalWidth);
    };
    listen(image, 'load', decode);
    listen(image, 'error', () => settle(true));
    if (image.complete && !image.currentSrc?.startsWith('data:')) {
      if (image.naturalWidth) decode(); else settle(true);
    }
  });

  const phoneReady = scene => new Promise(resolve => {
    const mobileImage = scene.querySelector('.flow-mobile-device img');
    let revision = 0;
    const check = () => {
      const current = ++revision;
      if (!desktop.matches) {
        imageReady(mobileImage).then(() => { if (revision === current) resolve(); });
      } else if (scene.classList.contains('has-phone-3d') || scene.dataset.phoneState === 'failed' || scene.dataset.phoneState === 'fallback') {
        resolve();
      }
    };
    observer = new MutationObserver(check);
    observer.observe(scene, {attributes: true, attributeFilter: ['class', 'data-phone-state']});
    listen(desktop, 'change', check);
    check();
  });

  const mount = () => {
    if (mounted || finished) return;
    mounted = true;
    for (const node of document.body.children) {
      if (node.matches('.site-loader, .site-loading-veil, script, style, link')) continue;
      restore.set(node, node.inert); node.inert = true;
    }
    const scene = document.querySelector('.flow-scene');
    const visual = scene ? phoneReady(scene) : imageReady(document.querySelector('.case-hero-media img'));
    // Wait for the visible composition, not window.load or below-the-fold images.
    Promise.allSettled([visual, document.fonts?.ready]).then(() => {
      if (finished || closing) return;
      observer?.disconnect();
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(reveal); });
    });
  };
  if (document.readyState === 'loading') listen(document, 'DOMContentLoaded', mount);
  else mount();
})();
