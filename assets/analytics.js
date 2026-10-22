/* BY HEVEN: production-only measurement. No form text or outbound URLs. */
(() => {
  const measurementId = 'G-X9LYLZSKQF';
  if (!['www.byheven.com', 'byheven.com'].includes(location.hostname)
    || navigator.globalPrivacyControl === true
    || navigator.doNotTrack === '1' || window.doNotTrack === '1'
    || window.HevenAnalytics) return;

  const projects = new Set(['emyasa', 'stone-kuche', 'parsomen', 'dor', 'dor-os', 'academic-quest']);
  const projectFrom = path => {
    const slug = path.match(/^\/case-studies\/([^/]+)\/?$/)?.[1];
    return projects.has(slug) ? slug : '';
  };
  const cleanPage = location.origin + location.pathname;
  const referrer = (() => {
    try {
      const url = new URL(document.referrer);
      return url.origin + (url.origin === location.origin ? url.pathname : '/');
    } catch { return ''; }
  })();
  window.dataLayer = window.dataLayer || [];
  const gtag = function () { window.dataLayer.push(arguments); };
  // A local queue keeps navigation independent of Google's availability.
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('js', new Date());
  const config = {
    page_location: cleanPage, page_referrer: referrer, page_title: document.title,
    allow_google_signals: false, allow_ad_personalization_signals: false,
    cookie_flags: 'SameSite=Lax;Secure', transport_type: 'beacon'
  };
  // Keep campaign attribution without forwarding arbitrary URL parameters.
  const query = new URLSearchParams(location.search);
  for (const key of ['source', 'medium', 'campaign', 'content', 'term']) {
    const value = query.get('utm_' + key);
    if (value && value.length <= 80 && /[a-z]/i.test(value)
      && /^[a-z0-9_. -]+$/i.test(value)) {
      config[key === 'campaign' ? 'campaign_name' : 'campaign_' + key] = value;
    }
  }
  gtag('config', measurementId, config);
  const allowed = {
    view_case_study: {project: [...projects]},
    select_project: {project: [...projects]},
    click_whatsapp: {placement: ['menu', 'hero', 'services', 'contact', 'footer', 'case']},
    booking_open: {placement: ['contact']},
    contact_email: {placement: ['contact']},
    consultation_start: {},
    consultation_request: {service_type: ['shopify', 'web', 'automation', 'guidance']}
  };
  const track = (name, parameters = {}) => {
    if (!Object.hasOwn(allowed, name)) return;
    const safe = {send_to: measurementId, transport_type: 'beacon', page_location: cleanPage};
    for (const [key, values] of Object.entries(allowed[name])) {
      if (values.includes(parameters[key])) safe[key] = parameters[key];
    }
    gtag('event', name, safe);
  };
  window.HevenAnalytics = Object.freeze({track});
  const currentProject = projectFrom(location.pathname);
  if (currentProject) track('view_case_study', {project: currentProject});

  const placement = anchor => anchor.closest('footer') ? 'footer'
    : anchor.closest('.cinema-nav,.mobile-menu-panel') ? 'menu'
    : anchor.closest('.flow-scene') ? 'hero'
    : anchor.closest('#services') ? 'services'
    : anchor.closest('#contact') ? 'contact' : 'case';
  const onLink = event => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    if (url.hostname === 'wa.me') track('click_whatsapp', {placement: placement(anchor)});
    else if (anchor.id === 'consultation-booking' && url.hostname === 'calendar.google.com') {
      track('booking_open', {placement: 'contact'});
    } else if (url.protocol === 'mailto:') track('contact_email', {placement: 'contact'});
    else if (url.origin === location.origin) {
      const project = projectFrom(url.pathname);
      if (project) track('select_project', {project});
    }
  };
  document.addEventListener('click', onLink, {capture: true});
  document.addEventListener('auxclick', onLink, {capture: true});
  document.getElementById('contact-form')?.addEventListener('focusin', () => {
    track('consultation_start');
  }, {once: true});

  // Let the first view and the 3D loader settle before fetching the third party.
  let started = false;
  const loadTag = () => {
    if (started) return;
    started = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  };
  const scheduleTag = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadTag, {timeout: 1500});
    else setTimeout(loadTag, 0);
  };
  if (document.documentElement.hasAttribute('data-site-loading')) {
    const observer = new MutationObserver(() => {
      if (document.documentElement.hasAttribute('data-site-loading')) return;
      observer.disconnect();
      scheduleTag();
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-site-loading']});
  } else scheduleTag();
})();
