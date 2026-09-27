document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const topicNav = document.querySelector('#onderwerpen');
const navLinks = [...topicNav.querySelectorAll('.nav-link')];

function closeMenu() {
  topicNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const open = topicNav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && topicNav.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});

function openHashTarget() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); }
  catch { return; }
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  if (target.tagName === 'DETAILS') target.open = true;
  let parent = target.parentElement;
  while (parent) {
    if (parent.tagName === 'DETAILS') parent.open = true;
    parent = parent.parentElement;
  }
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    if (link.closest('#onderwerpen')) closeMenu();
    const target = document.getElementById(link.hash.slice(1));
    if (target?.tagName === 'DETAILS') target.open = true;
    if (location.hash === link.hash) openHashTarget();
  });
});
window.addEventListener('hashchange', openHashTarget);
if (location.hash) openHashTarget();

const sections = [...document.querySelectorAll('.guide-section')];
let pending = false;
function updateCurrentSection() {
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) current = section;
  }
  for (const link of navLinks) {
    const active = link.hash === `#${current.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  pending = false;
}
window.addEventListener('scroll', () => {
  if (!pending) {
    pending = true;
    requestAnimationFrame(updateCurrentSection);
  }
}, { passive: true });
updateCurrentSection();
