/* WhatsApp is an alternative to the separate Google Calendar booking link.
   Sending this request alone does not reserve a meeting. */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const field = name => form.elements.namedItem(name);
  const value = name => field(name)?.value.trim() || '';
  const service = field('service');
  const budget = field('budget');
  const budgetLabel = document.getElementById('contact-budget-label');
  const required = [...form.querySelectorAll('[required]')];
  const mode = () => value('service') === 'Administración de Shopify' ? 'monthly'
    : ['Diseño y desarrollo web', 'Automatización e IA'].includes(value('service')) ? 'project' : 'unspecified';
  let previousMode = mode();

  const syncBudget = (reset = false) => {
    const currentMode = mode();
    // Monthly and one-off amounts are different commitments: don't silently carry
    // an old selection into another period. Restore bfcache/form state as-is.
    if (reset && currentMode !== previousMode) budget.value = '';
    previousMode = currentMode;
    budget.disabled = !value('service');
    budgetLabel.textContent = currentMode === 'monthly' ? 'Presupuesto mensual estimado'
      : currentMode === 'project' ? 'Presupuesto estimado del proyecto' : 'Presupuesto estimado';
  };
  service.addEventListener('change', () => syncBudget(true));
  window.addEventListener('pageshow', () => syncBudget());
  form.addEventListener('reset', () => queueMicrotask(() => syncBudget()));
  syncBudget();

  required.forEach(input => {
    const clearError = () => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); };
    input.addEventListener('input', clearError);
    input.addEventListener('change', clearError);
    input.addEventListener('invalid', () => input.setAttribute('aria-invalid', 'true'));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    required.forEach(input => input.setCustomValidity(input.value.trim() ? ''
      : input === service ? 'Selecciona un servicio o elige que necesitas orientación.' : 'Completa este campo para continuar.'));
    if (!form.reportValidity()) return;
    const selectedBudget = budget.selectedOptions[0]?.textContent.trim();
    const period = mode() === 'monthly' ? ' al mes' : mode() === 'project' ? ' por proyecto' : ' (periodicidad por definir)';
    const message = [
      'Hola by ˈHevən, me gustaría solicitar una consulta gratuita de 25 minutos.',
      '',
      `Nombre: ${value('name')}`,
      ...(value('business') ? [`Negocio o sitio: ${value('business')}`] : []),
      `Me interesa: ${value('service')}`,
      `Presupuesto estimado: ${value('budget') !== 'unspecified' ? selectedBudget + period : 'Sin presupuesto establecido aún'}`,
      `Me gustaría empezar: ${field('start').selectedOptions[0]?.textContent.trim() || 'Sin fecha definida'}`,
      '',
      ...(value('text') ? [value('text'), ''] : []),
      '¿Qué horarios tienes disponibles para una videollamada?'
    ].join('\n');
    const url = new URL(form.action);
    url.searchParams.set('text', message);
    window.location.assign(url.href);
  });
})();
