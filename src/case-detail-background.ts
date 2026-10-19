import {createStaticAuroraVeil} from '../lib/aurora-veil';

const canvas = document.querySelector<HTMLCanvasElement>('.case-detail-atmosphere canvas');
if (canvas) {
  const release = createStaticAuroraVeil(canvas);
  window.addEventListener('pagehide', event => { if (!event.persisted) release?.(); });
}
