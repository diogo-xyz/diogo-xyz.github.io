// Entry point. Everything here is progressive enhancement: the pages are
// fully rendered by Jekyll and stay readable without JavaScript.

import { initModal } from './modal.js';
import { initFilters } from './filters.js';
import { initTimeline } from './timeline.js';

initNavigation();
initEmail();
initCopyButtons();
initNotFound();
initModal();
initFilters();
initTimeline();

// Mobile navigation (hamburger menu).
function initNavigation() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// The email address is never in the HTML as plain text: it is assembled here.
function initEmail() {
  document.querySelectorAll('[data-email-user][data-email-domain]').forEach((el) => {
    const address = `${el.dataset.emailUser}@${el.dataset.emailDomain}`;
    const link = document.createElement('a');
    link.href = `mailto:${address}`;
    link.textContent = address;
    el.replaceChildren(link);
  });
}

// "Copy" button on every highlighted code block.
function initCopyButtons() {
  document.querySelectorAll('.prose div.highlighter-rouge').forEach((block) => {
    const code = block.querySelector('pre');
    if (!code || !navigator.clipboard) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ''));
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    });
    block.append(button);
  });
}

// 404 page: show the path that was actually requested.
function initNotFound() {
  document.querySelectorAll('[data-requested-path]').forEach((el) => {
    el.textContent = location.pathname;
  });
}
