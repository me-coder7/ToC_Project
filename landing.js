
const links = Array.from(document.querySelectorAll('.project-link'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

for (const link of links) {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || prefersReducedMotion) return;
    event.preventDefault();
    document.body.classList.add('is-transitioning');
    window.setTimeout(() => {
      window.location.assign(href);
    }, 170);
  });
}
