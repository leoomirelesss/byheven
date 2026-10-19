/** Scroll-scrubbed adaptation of the supplied VaporizeTextCycle reference.
 * No timers, random per-frame physics or perpetual animation loop. */
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export const vaporProgress = (scrollY: number, start: number, distance: number) => clamp01((scrollY - start) / Math.max(1, distance));
export type VaporParticle = { x: number; y: number; alpha: number; seed: number };
export function vaporPose(particle: VaporParticle, progress: number, width: number) {
  const front = progress * 1.48 - .16;
  const age = clamp01((front - particle.x / Math.max(1, width)) / .32);
  const drift = ease(age);
  return {
    x: particle.x + drift * (36 + particle.seed * 100),
    y: particle.y + Math.sin(particle.seed * 91) * drift * 58 - drift * drift * 64,
    alpha: particle.alpha * Math.pow(1 - age, 2),
    released: front >= particle.x / Math.max(1, width),
  };
}

export function createVapourRenderer(title: HTMLElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', {alpha: true});
  const raster = document.createElement('canvas');
  const ink = raster.getContext('2d', {willReadFrequently: true});
  let particles: VaporParticle[] = [], width = 0, height = 0, pad = 0, dpr = 1;
  let color = '#ceced7', last = -1, signature = '';
  if (!context || !ink) return null;
  const measure = (force = false) => {
    const rect = title.getBoundingClientRect(), style = getComputedStyle(title);
    const next = [rect.width, rect.height, style.fontSize, style.fontFamily, style.fontWeight, style.letterSpacing, window.devicePixelRatio].join('|');
    if (!force && next === signature) return;
    signature = next; width = rect.width; height = rect.height;
    if (!width || !height) return;
    pad = Math.min(100, Math.max(36, width * .07));
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    color = style.color;
    canvas.width = raster.width = Math.ceil((width + pad * 2) * dpr);
    canvas.height = raster.height = Math.ceil((height + pad * 2) * dpr);
    canvas.style.width = `${width + pad * 2}px`; canvas.style.height = `${height + pad * 2}px`;
    canvas.style.left = canvas.style.top = `${-pad}px`;
    ink.setTransform(dpr, 0, 0, dpr, 0, 0);
    ink.clearRect(0, 0, width + pad * 2, height + pad * 2);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.fillStyle = color; ink.textBaseline = 'alphabetic';
    ink.letterSpacing = style.letterSpacing;
    // Match each word's browser layout, including the mobile line break.
    title.querySelectorAll<HTMLElement>('[data-vapour-word]').forEach(word => {
      const box = word.getBoundingClientRect();
      const metrics = ink.measureText(word.textContent || '');
      const ascent = metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * .8;
      const descent = metrics.fontBoundingBoxDescent || parseFloat(style.fontSize) * .2;
      const baseline = box.top - rect.top + (box.height - ascent - descent) / 2 + ascent;
      ink.fillText(word.textContent || '', box.left - rect.left + pad, baseline + pad);
    });
    const data = ink.getImageData(0, 0, raster.width, raster.height).data;
    particles = [];
    const stride = Math.max(2.5, Math.sqrt(width * height / 22000));
    for (let y = pad; y < height + pad; y += stride) {
      for (let x = pad; x < width + pad; x += stride) {
        const index = (Math.floor(y * dpr) * raster.width + Math.floor(x * dpr)) * 4;
        if (data[index + 3] < 48) continue;
        const seed = ((Math.imul(Math.floor(x), 374761393) ^ Math.imul(Math.floor(y), 668265263)) >>> 0) / 4294967295;
        particles.push({x: x - pad, y: y - pad, alpha: data[index + 3] / 255, seed});
      }
    }
    last = -1;
  };
  const render = (value: number) => {
    const progress = clamp01(value);
    if (progress === last) return;
    last = progress;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    // Use the real HTML title at both settled endpoints; preserve semantic text throughout.
    if (!progress || progress === 1) {
      title.classList.toggle('is-vaporizing', progress === 1);
      canvas.style.opacity = '0'; return;
    }
    const front = (progress * 1.48 - .16) * width;
    context.save();
    context.beginPath();
    context.rect(Math.max(0, front + pad), 0, width + pad * 2, height + pad * 2);
    context.clip();
    context.drawImage(raster, 0, 0, canvas.width / dpr, canvas.height / dpr);
    context.restore();
    context.fillStyle = color;
    particles.forEach(particle => {
      const pose = vaporPose(particle, progress, width);
      if (!pose.released || pose.alpha < .01) return;
      context.globalAlpha = pose.alpha;
      context.fillRect(pose.x + pad, pose.y + pad, 1.4 + particle.seed * .7, 1.4 + particle.seed * .7);
    });
    context.globalAlpha = 1;
    canvas.style.opacity = '1';
    title.classList.add('is-vaporizing');
  };
  return {measure, render, destroy() { particles = []; title.classList.remove('is-vaporizing'); canvas.style.opacity = '0'; canvas.width = canvas.height = 0; }};
}
