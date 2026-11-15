// Shared modal. Content is rendered by Liquid into <template id="modal-<id>">
// elements; this module clones the right template into the <dialog>.
//
// Triggers: any element with data-modal="modal-<id>" (links, buttons, or the
// rows of the timeline graph). Deep links: opening a URL that ends in
// #modal-<id> opens that modal.

const PREFIX = 'modal-';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

let dialog;
let body;
let trigger = null;

export function initModal() {
  dialog = document.getElementById('modal');
  body = dialog?.querySelector('[data-modal-body]');
  if (!dialog || !body || typeof dialog.showModal !== 'function') return;

  // Server-rendered triggers start disabled so they are inert without JavaScript.
  document.querySelectorAll('button[data-modal][disabled]').forEach((button) => {
    button.disabled = false;
  });

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('keydown', trapFocus);
  dialog.addEventListener('close', onClose);
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
}

function onDocumentClick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const source = event.target instanceof Element ? event.target.closest('[data-modal]') : null;
  if (source && open(source.dataset.modal, source)) event.preventDefault();
}

// Elements that are not native buttons or links (the SVG rows) need Enter / Space.
function onDocumentKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const source = event.target;
  if (!(source instanceof Element) || !source.matches('[data-modal][role="button"]')) return;
  if (open(source.dataset.modal, source)) event.preventDefault();
}

function onDialogClick(event) {
  // A click on the dialog element itself is a click on the backdrop.
  if (event.target === dialog || event.target.closest('[data-modal-close]')) dialog.close();
}

function open(id, source) {
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement)) return false;

  body.replaceChildren(template.content.cloneNode(true));
  resolveRelativeUrls(body, template.dataset.base);
  body.querySelector('h2')?.setAttribute('id', 'modal-title');

  // Keep the original trigger when one modal opens another.
  if (!dialog.open) {
    trigger = source ?? document.activeElement;
    dialog.showModal();
  }
  dialog.querySelector('.modal__panel')?.scrollTo(0, 0);
  dialog.querySelector('[data-modal-close]')?.focus();

  if (location.hash !== `#${id}`) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
  }
  return true;
}

function onClose() {
  body.replaceChildren();
  if (location.hash.startsWith(`#${PREFIX}`)) {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }
  // Give the focus back to whatever opened the modal. The timeline graph may
  // have been redrawn meanwhile, so look the trigger up again if it is gone.
  let target = trigger;
  if (target && !target.isConnected && target.dataset?.modal) {
    target = document.querySelector(`[data-modal="${CSS.escape(target.dataset.modal)}"]`);
  }
  if (target?.isConnected && typeof target.focus === 'function') target.focus();
  trigger = null;
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id.startsWith(PREFIX)) {
    open(id, null);
  } else if (dialog.open) {
    dialog.close();
  }
}

function trapFocus(event) {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

// Project bodies are written with paths relative to their own folder
// (![Shot](shot.png)). Inside a modal on another page those paths have to be
// resolved against the project's URL, which the template carries in data-base.
function resolveRelativeUrls(root, base) {
  if (!base) return;
  const baseUrl = new URL(base, location.href);
  for (const [selector, attribute] of [['img[src]', 'src'], ['a[href]', 'href'], ['source[src]', 'src']]) {
    root.querySelectorAll(selector).forEach((el) => {
      const value = el.getAttribute(attribute);
      if (!value || /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return;
      el.setAttribute(attribute, new URL(value, baseUrl).pathname);
    });
  }
}
