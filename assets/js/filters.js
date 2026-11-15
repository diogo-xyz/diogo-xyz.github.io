// Generic list filtering, driven entirely by data attributes so the projects
// and writeups pages share it:
//
//   [data-filter-root data-filter-target="#list"]   the filter bar
//     [data-filter-facet="category"]                a group of chip buttons (multi-select, OR)
//       button[data-value]                          one value; data-value="" is "All"
//     select[data-filter-facet="ctf"]               a single-select facet; value "" is "All"
//     [data-filter-search]                          free-text search
//     [data-filter-count]                           "Showing 2 of 5"
//   #list
//     [data-filter-item data-category="a b" data-ctf="x" data-search="..."]
//     [data-filter-section]                         hidden when all its items are hidden
//   [data-filter-empty]                             shown when nothing matches
//
// Facets combine with AND; values inside one facet combine with OR.
// The state is mirrored in the URL (?category=security,web&q=flask).

export function initFilters() {
  document.querySelectorAll('[data-filter-root]').forEach(setup);
}

function setup(root) {
  const list = document.querySelector(root.dataset.filterTarget);
  if (!list) return;

  const items = [...list.querySelectorAll('[data-filter-item]')];
  const sections = [...list.querySelectorAll('[data-filter-section]')];
  const search = root.querySelector('[data-filter-search]');
  const count = root.querySelector('[data-filter-count]');
  const empty = list.parentElement?.querySelector('[data-filter-empty]');
  const facets = [...root.querySelectorAll('[data-filter-facet]')].map(createFacet);

  readUrl();
  apply();

  facets.forEach((facet) => facet.onChange(() => { apply(); writeUrl(); }));
  search?.addEventListener('input', () => { apply(); writeUrl(); });

  function apply() {
    const words = (search?.value ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;

    for (const item of items) {
      const matchesFacets = facets.every((facet) => {
        if (facet.selected.size === 0) return true;
        const tokens = (item.dataset[facet.key] ?? '').split(/\s+/);
        return tokens.some((token) => facet.selected.has(token));
      });
      const haystack = item.dataset.search ?? '';
      const matchesSearch = words.every((word) => haystack.includes(word));
      const show = matchesFacets && matchesSearch;
      item.hidden = !show;
      if (show) visible += 1;
    }

    for (const section of sections) {
      section.hidden = !section.querySelector('[data-filter-item]:not([hidden])');
    }
    if (empty) empty.hidden = visible > 0;
    if (count) count.textContent = `Showing ${visible} of ${items.length}`;
    facets.forEach((facet) => facet.render());
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    for (const facet of facets) {
      const wanted = params.getAll(facet.key).flatMap((value) => value.split(','));
      facet.selected = new Set(wanted.filter((value) => facet.values.has(value)));
    }
    if (search) search.value = params.get('q') ?? '';
  }

  function writeUrl() {
    const parts = [];
    for (const facet of facets) {
      if (facet.selected.size > 0) {
        parts.push(`${facet.key}=${[...facet.selected].map(encodeURIComponent).join(',')}`);
      }
    }
    const query = search?.value.trim();
    if (query) parts.push(`q=${encodeURIComponent(query)}`);
    const url = `${location.pathname}${parts.length ? `?${parts.join('&')}` : ''}${location.hash}`;
    history.replaceState(null, '', url);
  }
}

function createFacet(el) {
  const key = el.dataset.filterFacet;

  if (el instanceof HTMLSelectElement) {
    return {
      key,
      selected: new Set(),
      values: new Set([...el.options].map((option) => option.value).filter(Boolean)),
      render() { el.value = [...this.selected][0] ?? ''; },
      onChange(callback) {
        el.addEventListener('change', () => {
          this.selected = new Set(el.value ? [el.value] : []);
          callback();
        });
      },
    };
  }

  const buttons = [...el.querySelectorAll('button[data-value]')];
  return {
    key,
    selected: new Set(),
    values: new Set(buttons.map((button) => button.dataset.value).filter(Boolean)),
    render() {
      for (const button of buttons) {
        const value = button.dataset.value;
        const pressed = value ? this.selected.has(value) : this.selected.size === 0;
        button.setAttribute('aria-pressed', String(pressed));
      }
    },
    onChange(callback) {
      el.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-value]');
        if (!button) return;
        const value = button.dataset.value;
        if (!value) {
          this.selected.clear();
        } else if (this.selected.has(value)) {
          this.selected.delete(value);
        } else {
          this.selected.add(value);
        }
        callback();
      });
    },
  };
}
