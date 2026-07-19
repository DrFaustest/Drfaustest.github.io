const menuButton = document.querySelector('[data-menu-button]');
const siteNav = document.querySelector('[data-site-nav]');

function closeMenu() {
  if (!menuButton || !siteNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  siteNav.dataset.open = 'false';
}

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    siteNav.dataset.open = String(!open);
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.focus();
    }
  });
}

document.querySelectorAll('[data-current-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const filters = document.querySelectorAll('[data-project-filter]');
const projectCards = document.querySelectorAll('[data-project-status]');

filters.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.projectFilter;
    filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    projectCards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.projectStatus === filter;
      card.hidden = !visible;
    });
  });
});

const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  const status = contactForm.querySelector('[data-form-status]');
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    status.textContent = 'Sending your message…';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm)
      });
      if (!response.ok) throw new Error(`Form service returned ${response.status}`);
      contactForm.reset();
      status.textContent = 'Message sent. Thank you — I will follow up by email.';
    } catch (error) {
      console.error('[contact]', error);
      status.textContent = 'The form could not send right now. Please use GitHub or LinkedIn instead.';
    } finally {
      submitButton.disabled = false;
    }
  });
}
