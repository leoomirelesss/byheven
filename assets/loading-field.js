/* A small 2D halftone field: independent of the WebGL scene it introduces. */
(() => {
  const mount = (canvas, reduced) => {
    let context;
    try { context = canvas?.getContext('2d', {alpha: true}); } catch {}
    if (!context) return () => {};
    const abort = new AbortController();
    let width = 1, height = 1, columns = 1, rows = 1, frame = 0, previous = -Infinity, stopped = false;
    const colors = Array.from({length: 32}, (_, i) => `rgba(225,218,237,${(i / 31).toFixed(3)})`);
    const lights = new Float32Array(160), secondary = new Float32Array(160);
    function draw(time) {
      const phase = reduced ? .3 : time * .00016;
      context.clearRect(0, 0, width, height);
      const pitchX = width / columns, pitchY = height / rows;
      const size = Math.min(pitchX, pitchY) * .34;
      for (let x = 0; x < columns; x++) {
        const u = x / Math.max(1, columns - 1);
        lights[x] = .44 + .28 * Math.sin(u * 5.7 + phase);
        secondary[x] = .56 + .25 * Math.sin(u * 5.0 - phase * .72 + 2.5);
      }
      for (let y = 0; y < rows; y++) {
        const v = y / Math.max(1, rows - 1);
        for (let x = 0; x < columns; x++) {
          const u = x / Math.max(1, columns - 1);
          const ridge = Math.exp(-Math.pow((v - lights[x]) / .073, 2));
          const fold = Math.exp(-Math.pow((v - secondary[x]) / .12, 2));
          const middle = Math.exp(-Math.pow((u - .5) / .21, 2) - Math.pow((v - .5) / .26, 2));
          const light = Math.min(1, (.025 + ridge * .97 + fold * .69) * (1 - middle * .79));
          const intensity = Math.round(light * 31);
          if (!intensity) continue;
          context.fillStyle = colors[intensity];
          context.beginPath();
          context.arc((x + .5) * pitchX, (y + .5) * pitchY, size * (.3 + .7 * Math.sqrt(light)), 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    const schedule = () => {
      if (!stopped && !reduced && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    };
    function tick(time) {
      frame = 0;
      if (stopped || document.hidden) return;
      if (time - previous >= 1000 / 24) { draw(time); previous = time; }
      schedule();
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.min(160, Math.max(1, Math.ceil(width / 7)));
      rows = Math.min(104, Math.max(1, Math.ceil(height / 7)));
      draw(reduced ? 0 : performance.now());
      schedule();
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    }, {signal: abort.signal});
    resize();
    return () => { stopped = true; cancelAnimationFrame(frame); frame = 0; observer.disconnect(); abort.abort(); };
  };
  window.HevenLoadingField = {mount};
})();
