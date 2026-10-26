/* Input feedback shares the site's clock; native touch scrolling stays OS-owned. */
(() => {
  const clock = window.HevenMotion;
  if (!clock) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settings = Object.freeze({pressDelay: 0, pressScale: .98, damping: .8, frequency: 20, overshoot: .01516, momentumRate: .998, glide: 1000, pull: 200, stretch: 86});
  const decay = -Math.log(settings.momentumRate);
  const controls = 'a[href],button,summary,[role="button"]';
  const tracks = '.case-track,.case-device-display';
  const presses = new Map(), held = new Map(), motions = new Map();
  let drag = null, suppressClick = false, unsubscribe;
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  // Exact damped oscillator: .8 damping yields a 1.516% step overshoot.
  function spring(state, dt) {
    const w = settings.frequency, z = settings.damping, wd = w * Math.sqrt(1 - z * z);
    const t = dt / 1000, a = state.value - state.target, b = (state.velocity + z * w * a) / wd;
    const e = Math.exp(-z * w * t), c = Math.cos(wd * t), s = Math.sin(wd * t);
    state.value = state.target + e * (a * c + b * s);
    state.velocity = e * ((-z * w * a + wd * b) * c + (-z * w * b - wd * a) * s);
  }
  const momentum = (velocity, dt) => {
    const retain = Math.pow(settings.momentumRate, dt);
    return {distance: velocity * (1 - retain) / decay, velocity: velocity * retain};
  };
  // Smooth saturation; a 200px pull maps to 86px, without a hard clamp/corner.
  const rubber = pull => 100 * Math.tanh(Math.atanh(settings.stretch / 100) * pull / settings.pull);
  const restore = (track, state) => {
    track.style.scrollSnapType = state.snap;
    track.style.scrollBehavior = state.behavior;
    track.style.translate = state.translate;
  };
  const stop = track => {
    const state = motions.get(track);
    if (!state) return;
    motions.delete(track); restore(track, state);
  };
  const prepare = track => {
    let state = motions.get(track);
    if (!state) {
      state = {mode: 'spring', value: track.scrollLeft, target: track.scrollLeft, velocity: 0,
        snap: track.style.scrollSnapType, behavior: track.style.scrollBehavior, translate: track.style.translate};
      motions.set(track, state);
      track.style.scrollSnapType = 'none'; track.style.scrollBehavior = 'auto';
    }
    state.maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    return state;
  };
  const scrollTo = (track, destination) => {
    const state = prepare(track);
    state.target = clamp(destination, 0, state.maximum);
    if (reduced.matches) {
      track.scrollLeft = state.target; stop(track); return;
    }
    if (state.mode !== 'spring') { state.value = track.scrollLeft; state.velocity = 0; }
    state.mode = 'spring'; clock.wake();
  };
  const press = (node, key) => {
    if (!node || node.matches(':disabled,[aria-disabled="true"]') || node.closest('[inert]') || reduced.matches) return;
    held.set(key, node);
    const state = presses.get(node) || {value: 1, velocity: 0, target: 1};
    state.value = state.target = settings.pressScale; state.velocity = 0;
    presses.set(node, state);
    // Synchronous pointerdown write: no timeout, transition or next-frame wait.
    node.style.setProperty('--feel-scale', String(state.value));
  };
  const release = key => {
    const node = held.get(key); held.delete(key);
    if (!node || [...held.values()].includes(node)) return;
    const state = presses.get(node);
    if (state) { state.target = 1; clock.wake(); }
  };
  const edge = (track, state, pull) => {
    state.mode = 'edge'; state.value = rubber(pull); state.velocity = 0; state.target = 0;
    track.style.translate = `${state.value}px 0`; clock.wake();
  };
  const render = ({dt}) => {
    presses.forEach((state, node) => {
      if (state.target !== 1) return;
      spring(state, dt);
      if (Math.abs(state.value - 1) < .00001 && Math.abs(state.velocity) < .0001) {
        node.style.removeProperty('--feel-scale'); presses.delete(node);
      } else node.style.setProperty('--feel-scale', String(state.value));
    });
    motions.forEach((state, track) => {
      if (state.mode === 'drag') return;
      if (state.mode === 'glide') {
        const step = momentum(state.velocity, dt);
        state.value += step.distance; state.velocity = step.velocity;
        const bounded = clamp(state.value, 0, state.maximum);
        track.scrollLeft = bounded;
        if (bounded !== state.value) { edge(track, state, bounded - state.value); return; }
        if (Math.abs(state.velocity) < .002) stop(track);
      } else {
        spring(state, dt);
        if (state.mode === 'edge') track.style.translate = `${state.value}px 0`;
        else track.scrollLeft = clamp(state.value, 0, state.maximum);
        if (Math.abs(state.value - state.target) < .05 && Math.abs(state.velocity) < .1) {
          if (state.mode === 'spring') track.scrollLeft = state.target;
          stop(track);
        }
      }
    });
    return [...presses.values()].some(state => state.target === 1) || [...motions.values()].some(state => state.mode !== 'drag');
  };
  const reset = () => {
    presses.forEach((_, node) => node.style.removeProperty('--feel-scale'));
    presses.clear(); held.clear();
    motions.forEach((state, track) => restore(track, state)); motions.clear();
    const current = drag; drag = null;
    if (current?.accepted) { try { current.track.releasePointerCapture(current.id); } catch {} }
    suppressClick = false;
  };
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    suppressClick = false;
    press(event.target.closest?.(controls), event.pointerId);
    const track = event.target.closest?.(tracks);
    if (!track) return;
    stop(track);
    if (reduced.matches || event.pointerType !== 'mouse' || track.closest('.case-story.is-pinned') || track.scrollWidth <= track.clientWidth + 1) return;
    drag = {track, id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, time: event.timeStamp, position: track.scrollLeft, velocity: 0, accepted: false};
  }, {capture: true, passive: true});
  document.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.accepted) {
      if (Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.accepted = true; release(event.pointerId);
      drag.state = prepare(drag.track); drag.state.mode = 'drag';
      drag.track.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const state = drag.state, next = drag.position - dx;
    drag.track.scrollLeft = clamp(next, 0, state.maximum);
    drag.track.style.translate = `${rubber(drag.track.scrollLeft - next)}px 0`;
    const elapsed = Math.max(1, event.timeStamp - drag.time);
    drag.velocity = .65 * drag.velocity + .35 * (drag.lastX - event.clientX) / elapsed;
    drag.lastX = event.clientX; drag.time = event.timeStamp;
  }, {capture: true, passive: false});
  const endDrag = event => {
    release(event.pointerId);
    if (!drag || drag.id !== event.pointerId) return;
    const current = drag; drag = null;
    if (!current.accepted) return;
    suppressClick = true;
    try { current.track.releasePointerCapture(event.pointerId); } catch {}
    const state = current.state, offset = parseFloat(current.track.style.translate) || 0;
    if (Math.abs(offset) > .01 || event.type !== 'pointerup') edge(current.track, state, offset ? Math.atanh(clamp(offset / 100, -.999, .999)) * settings.pull / Math.atanh(settings.stretch / 100) : 0);
    else {
      state.mode = 'glide'; state.value = current.track.scrollLeft;
      state.velocity = event.timeStamp - current.time > 80 ? 0 : clamp(current.velocity, -settings.glide * decay, settings.glide * decay);
      clock.wake();
    }
  };
  document.addEventListener('pointerup', endDrag, {capture: true, passive: true});
  document.addEventListener('pointercancel', endDrag, {capture: true, passive: true});
  document.addEventListener('lostpointercapture', event => { if (drag?.id === event.pointerId) endDrag(event); }, {capture: true, passive: true});
  document.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); }
  }, {capture: true});
  document.addEventListener('dragstart', event => { if (drag) event.preventDefault(); });
  document.addEventListener('wheel', event => { const track = event.target.closest?.(tracks); if (track) stop(track); }, {capture: true, passive: true});
  document.addEventListener('keydown', event => {
    const track = event.target.closest?.(tracks); if (track) stop(track);
    if (!event.repeat && [' ', 'Enter'].includes(event.key)) press(event.target.closest?.(controls), `key:${event.key}`);
    if (event.key === 'Escape') reset();
  }, {capture: true});
  document.addEventListener('keyup', event => release(`key:${event.key}`), {capture: true});
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset, {passive: true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  reduced.addEventListener('change', reset);
  const mount = () => { if (!unsubscribe) unsubscribe = clock.subscribe({render}); };
  window.addEventListener('pagehide', () => { reset(); unsubscribe?.(); unsubscribe = null; });
  window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
  window.HevenFeel = {settings, spring, momentum, rubber, scrollTo, stop, isScrolling: track => motions.has(track)};
  document.documentElement.setAttribute('data-heven-feel', '');
  mount();
})();
