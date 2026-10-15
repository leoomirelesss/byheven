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

  const story = document.querySelector('[data-flow-story]');
  const scene = story?.querySelector('[data-flow-scene]');
  const device = scene?.querySelector('.flow-phone-position');
  if (!story || !scene || !device) return;
  const slides = [...scene.querySelectorAll('[data-phase]')];
  const phoneImage = scene.querySelector('.flow-screen-image');
  const screenNames = ['home', 'collection', 'product'];
  let active = -1, frame = 0, start = 0, step = 1;
  let pointerX = 0, pointerY = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const mix = (a,b,t) => a + (b-a) * t;
  const setScreen = index => {
    if (index === active) return;
    active = index;
    if (phoneImage) phoneImage.src = `assets/phone/screen-${screenNames[index]}.webp`;
  };
  const render = () => {
    frame = 0;
    if (motion.matches) return;
    const progress = clamp((window.scrollY - start) / (step * 2)) * 2;
    scene.style.setProperty('--asterisk-turn', `${(progress * 180).toFixed(3)}deg`);
    const segment = Math.min(1, Math.floor(progress));
    // Hold each readable front view; make one complete turn between chapters.
    const turn = smooth((progress - segment - .12) / .76);
    const index = segment + Number(turn >= .5);
    setScreen(index);
    slides.forEach((slide,i) => {
      // A single vertical document, with no crossfade or slide easing.
      const y = (i - progress) * step;
      const visible = y < scene.offsetHeight && y > -scene.offsetHeight;
      slide.style.setProperty('--slide-y', `${y}px`);
      slide.classList.toggle('is-active', visible);
      slide.inert = !visible;
      slide.setAttribute('aria-hidden', String(!visible));
    });
    const mobile = scene.clientWidth <= 700;
    const keys = mobile ? [
      {left:42, top:32, ry:-24, rz:14, rx:0, scale:1},
      {left:28, top:32, ry:360, rz:0, rx:0, scale:1},
      {left:28, top:33, ry:720, rz:0, rx:0, scale:.96}
    ] : [
      {left:scene.clientWidth <= 1100 ? 44 : 43, top:33, ry:-24, rz:15, rx:0, scale:1},
      {left:67, top:18, ry:360, rz:-3, rx:0, scale:.92},
      {left:17, top:19, ry:720, rz:-5, rx:0, scale:.84}
    ];
    const from = keys[segment], to = keys[segment + 1];
    const arc = turn > 0 && turn < 1 ? Math.sin(Math.PI * turn) : 0;
    const pose = {index, progress, px:pointerX, py:pointerY};
    for (const key of ['left','top','ry','rz','rx','scale']) {
      let value = mix(from[key],to[key],turn);
      if (key === 'rx') value += arc * 10;
      if (key === 'rz') value -= arc * 14;
      if (key === 'top') value -= arc * 5;
      if (key === 'scale') value -= arc * .08;
      pose[key] = value;
      scene.style.setProperty(`--phone-${key}`, `${value}${['left','top'].includes(key) ? '%' : ['ry','rz','rx'].includes(key) ? 'deg' : ''}`);
    }
    device.style.setProperty('--scene-x', `${pointerX}px`);
    device.style.setProperty('--scene-y', `${pointerY}px`);
    scene.dataset.storyProgress = progress.toFixed(4);
    scene.dataset.phoneTurn = pose.ry.toFixed(2);
    scene.dataset.storyScreen = String(index);
    window.dispatchEvent(new CustomEvent('flow:pose', {detail:pose}));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const measure = () => {
    story.toggleAttribute('data-scroll-ready', !motion.matches);
    start = story.getBoundingClientRect().top + window.scrollY;
    step = Math.max(1, scene.offsetHeight * 1.32);
    if (motion.matches) {
      slides.forEach(slide => { slide.inert = false; slide.removeAttribute('aria-hidden'); slide.style.removeProperty('--slide-y'); });
      for (const key of ['left','top','ry','rz','rx','scale']) scene.style.removeProperty(`--phone-${key}`);
      pointerX = pointerY = 0;
      device.style.setProperty('--scene-x','0px'); device.style.setProperty('--scene-y','0px');
      setScreen(0);
      window.dispatchEvent(new CustomEvent('flow:pose', {detail:{index:0,progress:0,left:scene.clientWidth<=700 ? 51 : 43,top:33,rx:0,ry:-24,rz:15,scale:1,px:0,py:0}}));
    } else schedule();
  };
  scene.addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches) return;
    const rect = scene.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 18;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 12;
    schedule();
  }, {passive:true});
  scene.addEventListener('pointerleave', () => { pointerX = pointerY = 0; schedule(); });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', measure, {passive:true});
  motion.addEventListener('change', measure);
  window.addEventListener('flow:ready', measure);
  measure();
})();

