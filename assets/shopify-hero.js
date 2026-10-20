(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const nav = document.querySelector('.cinema-nav');
  const logo = nav?.querySelector('.cinema-nav-mark');
  const menu = document.getElementById('mobile-menu-panel');
  if (nav && logo) {
    const expand = value => {
      nav.classList.toggle('is-expanded', value);
      logo.setAttribute('aria-expanded', String(value));
      logo.setAttribute('aria-label', value ? 'Contraer navegación' : 'Expandir navegación');
    };
    nav.addEventListener('pointerenter', () => { if (finePointer.matches) expand(true); });
    nav.addEventListener('pointerleave', () => {
      if (finePointer.matches && !document.body.classList.contains('mobile-menu-open') && (!nav.contains(document.activeElement) || !document.activeElement.matches(':focus-visible'))) expand(false);
    });
    nav.addEventListener('focusin', event => { if (event.target.matches(':focus-visible')) expand(true); });
    nav.addEventListener('focusout', () => queueMicrotask(() => {
      if (!nav.contains(document.activeElement) && !nav.matches(':hover') && !document.body.classList.contains('mobile-menu-open')) expand(false);
    }));
    logo.addEventListener('click', event => expand(finePointer.matches && event.detail > 0 ? true : !nav.classList.contains('is-expanded')));
    document.addEventListener('pointerdown', event => {
      if (!nav.contains(event.target) && !document.body.classList.contains('mobile-menu-open')) expand(false);
    });
    menu?.addEventListener('click', event => { if (event.target.closest('a')) expand(false); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !document.body.classList.contains('mobile-menu-open')) return;
      const controls = [...nav.querySelectorAll('button,a'), ...menu.querySelectorAll('a')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  const clock = window.HevenMotion;
  const story = document.querySelector('[data-flow-story]');
  const scene = story?.querySelector('[data-flow-scene]');
  const device = scene?.querySelector('.flow-phone-position');
  if (!story || !scene || !device || !clock) return;
  const slides = [...scene.querySelectorAll('[data-phase]')];
  const phoneImage = scene.querySelector('.flow-screen-image');
  const screenNames = ['home', 'collection', 'product'];
  let active = -1, start = 0, step = 1, width = 1, height = 1, keys;
  let progress = 0, lastProgress = -1, pointerX = 0, pointerY = 0, px = 0, py = 0;
  let force = true, scrollStarted = false, staticMobile = false;
  const visibility = new Map();
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const mix = (a,b,t) => a + (b-a) * t;
  // Decode the CSS fallback's next screens before a turn needs them.
  screenNames.slice(1).forEach(name => { const image = new Image(); image.src = `assets/phone/screen-${name}.webp`; image.decode?.().catch(() => {}); });
  const setScreen = index => {
    if (index === active) return;
    active = index;
    if (phoneImage) phoneImage.src = `assets/phone/screen-${screenNames[index]}.webp`;
  };
  const measure = () => {
    staticMobile = window.innerWidth < 900 && window.innerHeight < 600;
    story.toggleAttribute('data-scroll-ready', !motion.matches && !staticMobile);
    start = story.getBoundingClientRect().top + window.scrollY;
    height = scene.offsetHeight; width = scene.clientWidth;
    step = Math.max(1, height * 1.32);
    keys = width < 900 ? [
      {left:34, top:32, ry:-24, rz:14, rx:0, scale:1},
      {left:34, top:32, ry:360, rz:0, rx:0, scale:1},
      {left:34, top:33, ry:720, rz:0, rx:0, scale:.96}
    ] : [
      {left:width <= 1100 ? 44 : 43, top:33, ry:-24, rz:15, rx:0, scale:1},
      {left:67, top:18, ry:360, rz:-3, rx:0, scale:.92},
      {left:17, top:19, ry:720, rz:-5, rx:0, scale:.84}
    ];
    force = true; visibility.clear();
    if (motion.matches || staticMobile) {
      slides.forEach(slide => { slide.inert = false; slide.removeAttribute('aria-hidden'); slide.style.removeProperty('--slide-y'); slide.classList.add('is-active'); });
      for (const key of ['left','top','ry','rz','rx','scale','x','y']) scene.style.removeProperty(`--phone-${key}`);
      scene.style.removeProperty('--asterisk-turn');
      pointerX = pointerY = px = py = 0;
      device.style.setProperty('--scene-x','0px'); device.style.setProperty('--scene-y','0px');
      setScreen(0);
      window.dispatchEvent(new CustomEvent('flow:pose', {detail:{index:0,progress:0,left:width<=700 ? 51 : 43,top:33,rx:0,ry:-24,rz:15,scale:1,px:0,py:0}}));
    }
  };
  const render = state => {
    if (!scrollStarted && state.y > start + 1) {
      scrollStarted = true;
      scene.classList.add('has-started-scrolling');
    }
    if (motion.matches || staticMobile) return false;
    const target = clamp((state.y - start) / (step * 2)) * 2;
    const exact = state.immediate || state.y <= start || state.y >= start + step * 2;
    progress = clock.approach(progress, target, state.dt, exact);
    const oldX = px, oldY = py;
    px = clock.approach(px, pointerX, state.dt, state.immediate, .01);
    py = clock.approach(py, pointerY, state.dt, state.immediate, .01);
    const moving = progress !== target || px !== pointerX || py !== pointerY;
    if (!force && progress === lastProgress && px === oldX && py === oldY) return moving;
    const segment = Math.min(1, Math.floor(progress));
    const turn = smooth((progress - segment - .12) / .76);
    const index = segment + Number(turn >= .5);
    setScreen(index);
    if (force || progress !== lastProgress) {
      scene.style.setProperty('--asterisk-turn', `${(progress * 180).toFixed(3)}deg`);
      slides.forEach((slide,i) => {
        // Adjacent screens: slower scroll pacing no longer creates gaps between text chapters.
        const y = (i - progress) * height;
        const visible = y < height && y > -height;
        slide.style.setProperty('--slide-y', `${y}px`);
        if (visibility.get(slide) !== visible) {
          visibility.set(slide, visible);
          slide.classList.toggle('is-active', visible);
          slide.inert = !visible;
          slide.setAttribute('aria-hidden', String(!visible));
        }
      });
    }
    const from = keys[segment], to = keys[segment + 1];
    const arc = turn > 0 && turn < 1 ? Math.sin(Math.PI * turn) : 0;
    const pose = {index, progress, px, py};
    for (const key of ['left','top','ry','rz','rx','scale']) {
      let value = mix(from[key],to[key],turn);
      if (key === 'rx') value += arc * 10;
      if (key === 'rz') value -= arc * 14;
      if (key === 'top') value -= arc * 5;
      if (key === 'scale') value -= arc * .08;
      pose[key] = value;
      if (!['left','top'].includes(key)) scene.style.setProperty(`--phone-${key}`, `${value}${['ry','rz','rx'].includes(key) ? 'deg' : ''}`);
    }
    scene.style.setProperty('--phone-x', `${width * pose.left / 100}px`);
    scene.style.setProperty('--phone-y', `${height * pose.top / 100}px`);
    device.style.setProperty('--scene-x', `${px}px`);
    device.style.setProperty('--scene-y', `${py}px`);
    scene.dataset.storyProgress = progress.toFixed(4);
    scene.dataset.phoneTurn = pose.ry.toFixed(2);
    scene.dataset.storyScreen = String(index);
    lastProgress = progress; force = false;
    // The WebGL consumer draws synchronously in this same frame.
    window.dispatchEvent(new CustomEvent('flow:pose', {detail:pose}));
    return moving;
  };
  scene.addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / width - .5) * 18;
    pointerY = ((event.clientY - rect.top) / height - .5) * 12;
    clock.wake();
  }, {passive:true});
  scene.addEventListener('pointerleave', () => { pointerX = pointerY = 0; clock.wake(); });
  scene.addEventListener('pointercancel', () => { pointerX = pointerY = 0; clock.wake(); });
  motion.addEventListener('change', clock.reset);
  window.addEventListener('flow:ready', () => { force = true; clock.reset(); });
  clock.subscribe({measure, render});
})();
