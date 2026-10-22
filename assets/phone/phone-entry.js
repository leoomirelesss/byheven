/* Mobile uses the approved render. Desktop reveals only the real GLB after its first draw. */
const desktop = window.matchMedia('(min-width: 900px)');
let started = false;
const load = () => {
  if (!desktop.matches || started) return;
  started = true;
  import('./phone-scene.js').catch(() => {
    const scene = document.querySelector('.flow-scene');
    if (scene) { scene.classList.remove('has-phone-3d'); scene.dataset.phoneState = 'failed'; }
  });
};
desktop.addEventListener('change', load);
load();
