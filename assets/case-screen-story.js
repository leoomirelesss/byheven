/* Case devices share the home's clock: a fixed Mac display or two staggered iPhones. */
(() => {
  const story = document.querySelector('[data-case-screen-story], [data-case-phone-story]');
  const clock = window.HevenMotion;
  if (!story || !clock) return;
  const isPhone = story.hasAttribute('data-case-phone-story');
  const stage = story.querySelector(isPhone ? '.case-phone-stage' : '.case-device');
  const frame = story.querySelector(isPhone ? '.case-phone-pair' : '.case-device-frame');
  const pin = isPhone ? story.querySelector('.case-phone-pin') : null;
  const phones = isPhone ? [...story.querySelectorAll('.case-app-phone')] : [];
  const chapter = story.parentElement;
  const overview = chapter.querySelector('.case-editorial');
  const text = [...overview.querySelectorAll('.case-editorial-label span, .case-editorial-summary, .case-editorial-row > h3, .case-editorial-copy > p, .case-editorial-facts dt, .case-editorial-facts dd')].map(element => ({element, lines: [], last: ''}));
  const range = document.createRange();
  const display = story.querySelector('.case-device-display');
  const views = [...story.querySelectorAll('.case-device-view')];
  const shell = story.querySelector('.case-device-shell');
  const pictures = isPhone ? phones.map(phone => phone.querySelector('img')) : views;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ready = pictures.map(image => image.complete && image.naturalWidth > 0);
  const failed = pictures.map(() => false);
  const cleanups = [];
  const catchup = pictures.map(() => false);
  let displayed = views.map((_, index) => index === 0 ? 1 : 0);
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * value * (value * (value * 6 - 15) + 10);
  let enabled = false, start = 0, hold = 1, blend = 1, travel = 1, readingLead = 0;
  let position = 0, active = 0, last = '', warmed = false, alive = true;
  let lift = false, center = 0, overlap = false, fadeDistance = 1, lastY = '', frameHeight = 0;
  let phoneStart = 0, phoneRise = 1, phoneDelay = 0, phoneHeight = 1, phoneBases = [];
  const phoneProgress = phones.map(() => 0), phoneShifts = phones.map(() => null);
  const fadeText = y => text.forEach(block => {
    if (!overlap || !block.lines.length) {
      if (block.last) block.element.style.removeProperty('--case-line-mask');
      block.last = ''; return;
    }
    let from = 0;
    const stops = block.lines.map(line => {
      const opacity = (1 - ease(clamp((y - line.end + fadeDistance) / fadeDistance))).toFixed(4);
      const stop = `rgba(0,0,0,${opacity}) ${from}px, rgba(0,0,0,${opacity}) ${line.to}px`;
      from = line.to; return stop;
    });
    const mask = `linear-gradient(to bottom, ${stops.join(', ')})`;
    if (mask === block.last) return;
    block.element.style.setProperty('--case-line-mask', mask); block.last = mask;
  });
  const paint = (value, state) => {
    const base = failed[0] ? ready.findIndex(Boolean) : 0;
    const targets = views.map((_, index) => index === base ? 1 : index > base && ready[index] ? ease(clamp((value - (index * hold + (index - 1) * blend + readingLead)) / blend)) : 0);
    const opacities = targets.map((target, index) => catchup[index] && !reduced.matches ? clock.approach(displayed[index], target, state.dt, false) : target);
    const moving = opacities.some((value, index) => value !== targets[index]);
    catchup.forEach((_, index) => { if (opacities[index] === targets[index]) catchup[index] = false; });
    displayed = opacities;
    const signature = opacities.join(':');
    if (last === signature) return moving;
    let selected = 0;
    views.forEach((image, index) => {
      image.style.opacity = String(opacities[index]);
      if (opacities[index] >= .5) selected = index;
    });
    if (active !== selected || last === '') {
      active = selected;
      display.setAttribute('aria-label', `${story.dataset.screenProject}: ${views[active].dataset.screenLabel}, pantalla ${active + 1} de 4`);
    }
    last = signature;
    return moving;
  };
  const warm = () => {
    if (warmed) return;
    warmed = true;
    [...pictures, ...(!isPhone && shell ? [shell] : [])].forEach((image, index) => {
      image.loading = 'eager';
      const loaded = () => {
        if (!alive) return;
        if (index < pictures.length && image.naturalWidth > 0) {
          const recovering = failed[index];
          catchup[index] ||= !ready[index] && (isPhone || index > 0) && !reduced.matches;
          ready[index] = true; failed[index] = false;
          if (recovering) {
            story.hidden = false;
            if (isPhone) phones[index].hidden = false;
            clock.invalidate();
          }
        }
        last = ''; clock.wake();
      };
      const unavailable = () => {
        if (!alive || index >= pictures.length) return;
        ready[index] = false; failed[index] = true;
        if (isPhone) phones[index].hidden = true;
        // Failed media must never leave an empty pinned chapter or a broken phone
        // drifting over the following content. The project information stays intact.
        story.hidden = failed.every(Boolean);
        last = ''; clock.invalidate();
      };
      // A responsive source change can reject decode(). Keep its load listener alive.
      image.addEventListener('load', loaded);
      image.addEventListener('error', unavailable);
      cleanups.push(() => { image.removeEventListener('load', loaded); image.removeEventListener('error', unavailable); });
      if (image.decode) image.decode().then(loaded).catch(() => {
        if (image.complete) { if (image.naturalWidth) loaded(); else unavailable(); }
      });
      else if (image.complete) { if (image.naturalWidth) loaded(); else unavailable(); }
    });
  };
  const unsubscribe = clock.subscribe({
    measure() {
      enabled = !story.hidden && !reduced.matches && window.innerHeight >= 640 && window.innerWidth >= 900;
      story.toggleAttribute(isPhone ? 'data-phone-ready' : 'data-screen-ready', enabled);
      const height = stage.offsetHeight;
      frameHeight = frame.offsetHeight;
      // Keep the photo's width. Its base peeks below the fold, then lifts into view.
      lift = enabled && window.innerWidth >= 900 && frameHeight >= height * .72;
      center = (height - frameHeight) / 2;
      overlap = enabled && chapter.hasAttribute('data-showcase-ready');
      hold = Math.max(320, Math.min(600, height * .52));
      blend = Math.min(clock.settings.arrivalMax, Math.max(clock.settings.arrivalMin, height * clock.settings.arrivalDistance));
      travel = hold * 4 + blend * 3;
      // Redistribute the existing distance: the first screen settles before reading,
      // and the fourth releases sooner. No extra scroll is added.
      readingLead = Math.min(hold * .3, blend * .65);
      start = story.getBoundingClientRect().top + window.scrollY;
      if (isPhone) {
        phoneHeight = height;
        phoneRise = Math.max(360, Math.min(620, height * .58));
        phoneDelay = clock.settings.stagger;
        phoneStart = start - height * .75;
        travel = phoneRise * 2 + phoneDelay + hold - height * .75;
        phoneBases = phones.map(phone => frame.offsetTop + phone.offsetTop);
        if (enabled) {
          pin.style.height = `${height + travel}px`;
          // End the pin before the tail: native scrolling reveals both complete phones.
          story.style.paddingBottom = `${Math.max(0, frame.offsetTop + frameHeight - height) + 48}px`;
        } else { pin.style.removeProperty('height'); story.style.removeProperty('padding-bottom'); }
      } else {
        if (enabled) story.style.height = `${height + travel}px`;
        else story.style.removeProperty('height');
        display.setAttribute('role', enabled ? 'img' : 'region');
        if (enabled) {
          display.removeAttribute('tabindex'); display.removeAttribute('aria-roledescription');
          display.scrollLeft = 0;
        } else {
          display.setAttribute('tabindex', '0');
          display.setAttribute('aria-roledescription', 'carrusel');
          display.setAttribute('aria-label', `${story.dataset.screenProject}: cuatro vistas del sitio. Desliza horizontalmente o usa las flechas izquierda y derecha.`);
        }
        views.forEach(image => {
          image.setAttribute('aria-hidden', String(enabled));
          image.alt = enabled ? '' : image.dataset.screenLabel;
          if (!enabled) image.style.opacity = '1';
        });
      }
      if (overlap) {
        const overviewTop = overview.getBoundingClientRect().top;
        const stickyTop = Math.min(24, window.innerHeight - overview.offsetHeight - 24);
        fadeDistance = Math.max(clock.settings.arrivalMin, blend * .65);
        // Measure real wrapped lines without replacing text or changing the layout.
        text.forEach(block => {
          const bounds = block.element.getBoundingClientRect();
          const shift = parseFloat(block.element.closest('[data-arrival-item]')?.style.getPropertyValue('--arrival-y')) || 0;
          range.selectNodeContents(block.element);
          const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
          // Font ink can extend outside a tight line box. Keep accents and descenders
          // inside the mask's paint surface without adding layout padding or margins.
          const bleed = Math.ceil(Math.max(0, ...rects.map(rect => rect.height)) * .16) + 2;
          const paintTop = Math.min(bounds.top, ...rects.map(rect => rect.top)) - bleed;
          const paintBottom = Math.max(bounds.bottom, ...rects.map(rect => rect.bottom)) + bleed;
          const paintLeft = Math.min(bounds.left, ...rects.map(rect => rect.left)) - bleed;
          const paintRight = Math.max(bounds.right, ...rects.map(rect => rect.right)) + bleed;
          const boxes = [];
          rects.forEach(rect => {
            const previous = boxes.at(-1);
            if (previous && Math.abs(previous.top - rect.top) < 2) previous.bottom = Math.max(previous.bottom, rect.bottom);
            else boxes.push({top: rect.top, bottom: rect.bottom});
          });
          block.lines = boxes.map((box, index) => ({
            end: start - (stickyTop + box.bottom - overviewTop - shift),
            to: index === boxes.length - 1 ? paintBottom - paintTop : ((box.bottom + boxes[index + 1].top) / 2 - paintTop),
          }));
          block.element.style.setProperty('--case-line-mask-size', `${paintRight - paintLeft}px ${paintBottom - paintTop}px`);
          block.element.style.setProperty('--case-line-mask-position', `${paintLeft - bounds.left}px ${paintTop - bounds.top}px`);
          block.element.setAttribute('data-case-exit-lines', '');
          block.last = '';
        });
      }
      last = ''; lastY = '';
    },
    render(state) {
      if (isPhone) {
        let moving = false;
        phones.forEach((phone, index) => {
          const target = !enabled ? 1 : !ready[index] ? 0 : ease(clamp((state.y - phoneStart - index * (phoneRise + phoneDelay)) / phoneRise));
          // A late image catches up smoothly even during an already eased wheel frame.
          phoneProgress[index] = clock.approach(phoneProgress[index], target, state.dt, !enabled || (state.immediate && !catchup[index]));
          if (phoneProgress[index] === target) catchup[index] = false;
          moving ||= phoneProgress[index] !== target;
          const shift = enabled ? phoneHeight * (index ? 1.1 : .8) * (1 - phoneProgress[index]) : 0;
          if (shift !== phoneShifts[index]) { phone.style.setProperty('--case-phone-y', `${shift}px`); phoneShifts[index] = shift; }
        });
        const stageY = state.y < start ? start - state.y : Math.min(0, start + travel - state.y);
        const front = stageY + Math.min(...phoneBases.flatMap((base, index) => failed[index] ? [] : [base + phoneShifts[index]]));
        fadeText(start - front);
        return moving;
      }
      const target = Math.max(0, Math.min(travel, state.y - start));
      if (!enabled) {
        fadeText(0);
        if (lastY !== 0) { frame.style.setProperty('--case-device-y', '0px'); lastY = 0; }
        return false;
      }
      position = clock.approach(position, target, state.dt, state.immediate || target === 0 || target === travel);
      const y = lift ? center + 80 - 64 * ease(clamp(position / (hold * .55))) : 0;
      if (y !== lastY) { frame.style.setProperty('--case-device-y', `${y}px`); lastY = y; }
      // The same moving-front geometry as the phones, including settle and release.
      const stageY = state.y < start ? start - state.y : Math.min(0, start + travel - state.y);
      fadeText(start - (stageY + center + y + frameHeight * 71 / 1500));
      const blending = paint(position, state);
      return position !== target || blending;
    },
  });
  if (display) {
    const navigate = event => {
      if (enabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const width = display.clientWidth;
      const current = Math.round(display.scrollLeft / Math.max(1, width));
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : Math.max(0, Math.min(views.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
      display.scrollTo({left: width * next, behavior: 'instant'});
    };
    display.addEventListener('keydown', navigate);
    cleanups.push(() => display.removeEventListener('keydown', navigate));
  }
  const observer = new ResizeObserver(clock.invalidate); observer.observe(stage); observer.observe(frame);
  const proximity = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    warm(); proximity.disconnect();
  }, {rootMargin: '100% 0px'}) : null;
  if (proximity) proximity.observe(story); else warm();
  reduced.addEventListener('change', clock.invalidate);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    alive = false; unsubscribe(); observer.disconnect(); proximity?.disconnect();
    reduced.removeEventListener('change', clock.invalidate); cleanups.forEach(cleanup => cleanup());
  });
})();
