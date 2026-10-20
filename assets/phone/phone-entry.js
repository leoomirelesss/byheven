/* The existing lightweight CSS phone keeps its scroll story on small screens.
   Desktop still imports the exact approved model/renderer without modification. */
const desktop = window.matchMedia('(min-width: 900px)');
let started = false;
const load = () => {
  if (!desktop.matches || started) return;
  started = true;
  import('./phone-scene.js').catch(() => {
    document.querySelector('.flow-scene')?.classList.remove('has-phone-3d');
  });
};
desktop.addEventListener('change', load);
load();
