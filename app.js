(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#onderwerpen');
  const navLinks = [...document.querySelectorAll('#onderwerpen .nav-link[href^="#"]')];
  const sections = [...document.querySelectorAll('.guide-section')];
  const setupSelect = document.querySelector('[data-configuration]');
  const printerSelect = document.querySelector('[data-printer-selection]');
  const scoped = [...document.querySelectorAll('[data-setups]')];
  const validSetup = id => setupSelect && [...setupSelect.options].some(option => option.value === id);
  const readHash = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } };
  const defaultSetup = setupSelect?.dataset.default;

  function closeMenu() {
    nav?.classList.remove('is-open');
    menu?.setAttribute('aria-expanded', 'false');
  }
  function setSetup(id, updateURL = false) {
    if (!setupSelect) return;
    setupSelect.value = validSetup(id) ? id : defaultSetup;
    for (const element of scoped) element.hidden = !element.dataset.setups.split(' ').includes(setupSelect.value);
    for (const group of document.querySelectorAll('.faq-group')) {
      group.hidden = [...group.querySelectorAll('details')].every(detail => detail.hidden);
    }
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('setup', setupSelect.value);
      history.replaceState(null, '', url);
    }
  }
  function revealHash({ scroll = true } = {}) {
    const target = document.getElementById(readHash());
    if (!target) return;
    const restriction = target.closest('[data-setups]');
    if (restriction?.hidden) setSetup(restriction.dataset.setups.split(' ')[0], true);
    let current = target;
    while (current) {
      if (current.tagName === 'DETAILS') current.open = true;
      current = current.parentElement;
    }
    if (scroll) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  }
  let pending = false;
  function updateCurrentSection() {
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= 160) current = section;
    for (const link of navLinks) {
      const active = link.hash === `#${current?.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    pending = false;
  }

  setSetup(new URL(location.href).searchParams.get('setup'));
  menu?.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', String(nav.classList.toggle('is-open')));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); menu.focus(); }
  });
  setupSelect?.addEventListener('change', () => {
    setSetup(setupSelect.value, true);
    // A case from the previous setup must not leave the URL pointing at hidden content.
    const target = document.getElementById(readHash());
    if (target?.closest('[hidden]')) {
      const url = new URL(location.href); url.hash = 'storingen'; history.replaceState(null,'',url);
    }
    updateCurrentSection();
  });
  printerSelect?.addEventListener('change', () => {
    const url = new URL(printerSelect.value, location.href);
    // Carry a topic to the other printer, never a printer-specific error code or setup.
    const target = document.getElementById(readHash());
    const topic = target?.closest('.guide-section')?.id;
    if (topic) url.hash = topic;
    location.assign(url);
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    if (link.closest('#onderwerpen')) closeMenu();
    const target = document.getElementById(link.hash.slice(1));
    if (target?.tagName === 'DETAILS') target.open = true;
    if (location.hash === link.hash) revealHash();
  }));
  window.addEventListener('hashchange', () => revealHash());
  window.addEventListener('popstate', () => {
    setSetup(new URL(location.href).searchParams.get('setup'));
    revealHash();
  });
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(updateCurrentSection); }
  }, {passive:true});
  let printState;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = [...document.querySelectorAll('details')].map(detail => [detail, detail.open]);
    for (const [detail] of printState) if (!detail.closest('[hidden]')) detail.open = true;
  });
  window.addEventListener('afterprint', () => {
    for (const [detail, open] of printState ?? []) detail.open = open;
    printState = undefined;
  });
  // Apply enhancement only after the native links and setup controls are ready.
  document.documentElement.classList.add('js');
  revealHash();
  updateCurrentSection();
})();
