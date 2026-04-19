(function () {
  const route = (window.location.pathname || '/').replace(/index\.html$/, '');
  const current = route.includes('/payment/') ? 'payment' : route.includes('/toc/') ? 'toc' : 'home';
  const links = Array.from(document.querySelectorAll('[data-suite-link]'));

  links.forEach((link) => {
    const target = link.getAttribute('data-suite-target');
    if (target && target === current) {
      link.setAttribute('aria-current', 'page');
    }
  });

  const topButton = document.createElement('button');
  topButton.type = 'button';
  topButton.className = 'suite-back-to-top';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.textContent = '↑';
  document.body.appendChild(topButton);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    topButton.classList.toggle('is-visible', window.scrollY > 360);
  };

  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
