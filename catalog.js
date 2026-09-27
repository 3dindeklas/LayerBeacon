// All content remains readable without JavaScript; query parameters only select the setup.
const select = document.querySelector('[data-configuration]');
if (select) {
  const panels = [...document.querySelectorAll('[data-configuration-panel]')];
  function showConfiguration(id) {
    const valid = [...select.options].some(option => option.value === id);
    select.value = valid ? id : select.options[0].value;
    for (const panel of panels) panel.hidden = panel.dataset.configurationPanel !== select.value;
  }
  showConfiguration(new URL(location.href).searchParams.get('setup'));
  select.addEventListener('change', () => {
    showConfiguration(select.value);
    const url = new URL(location.href);
    url.searchParams.set('setup', select.value);
    history.replaceState(null, '', url);
  });
}
function revealTarget() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (target?.tagName === 'DETAILS') target.open = true;
}
revealTarget();
window.addEventListener('hashchange', revealTarget);
