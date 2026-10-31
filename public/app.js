(function () {
  'use strict';

  const MAX_TITLE_LENGTH = 100;
  const LIST_KEY = 'tally.listId';

  const state = {
    listId: null,
    todos: [],
    filter: 'all',
    rev: 0,
    pendingSaves: 0,
  };

  const els = {
    form: document.getElementById('new-todo-form'),
    input: document.getElementById('new-todo'),
    error: document.getElementById('form-error'),
    list: document.getElementById('todo-list'),
    footer: document.getElementById('list-footer'),
    count: document.getElementById('todo-count'),
    clear: document.getElementById('clear-completed'),
    status: document.getElementById('save-status'),
    share: document.getElementById('share-link'),
  };

  function newId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function resolveListId() {
    const fromUrl = new URLSearchParams(location.search).get('list');
    if (fromUrl && /^[a-z0-9-]{1,64}$/.test(fromUrl)) {
      return fromUrl;
    }
    let id = localStorage.getItem(LIST_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(LIST_KEY, id);
    }
    return id;
  }

  function normaliseTitle(raw) {
    return raw.replace(/\s+/g, ' ').trim();
  }

  function formatCount(n) {
    return `${n} ${n > 1 ? 'items' : 'item'} left`;
  }

  function visibleTodos() {
    if (state.filter === 'active') return state.todos.filter((t) => !t.completed);
    if (state.filter === 'completed') return state.todos.filter((t) => t.completed);
    return state.todos;
  }

  // ---- persistence -------------------------------------------------------

  async function load() {
    els.list.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(`/api/lists/${state.listId}`);
      const data = await res.json();
      state.todos = Array.isArray(data.todos) ? data.todos : [];
      state.rev = data.rev || 0;
    } catch {
      setStatus("Couldn't load this list");
    } finally {
      els.list.removeAttribute('aria-busy');
      render();
    }
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  async function save() {
    state.rev += 1;
    state.pendingSaves += 1;
    setStatus('Saving…');
    try {
      const res = await fetch(`/api/lists/${state.listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rev: state.rev, todos: state.todos }),
      });
      if (!res.ok) throw new Error(String(res.status));
      state.pendingSaves -= 1;
      if (state.pendingSaves === 0) setStatus('Saved');
    } catch {
      state.pendingSaves -= 1;
      setStatus("Couldn't save. Your changes are kept in this tab.");
    }
  }

  // ---- actions -----------------------------------------------------------

  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = !message;
  }

  function addTodo(raw) {
    const title = normaliseTitle(raw).slice(0, MAX_TITLE_LENGTH);
    if (!title) {
      showError('Type something first.');
      return false;
    }
    showError('');
    state.todos.push({ id: newId(), title, completed: false });
    render();
    save();
    return true;
  }

  function toggleTodo(id) {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    render();
    save();
  }

  function deleteTodo(id) {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    state.todos = state.todos.filter((t) => t.id !== id);
    render();
    save();
  }

  function updateTitle(id, raw) {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;
    const title = normaliseTitle(raw);
    if (!title) {
      state.todos = state.todos.filter((t) => t.id !== id);
    } else {
      todo.title = title;
    }
    render();
    save();
  }

  function clearCompleted() {
    const done = state.todos.filter((t) => t.completed);
    if (done.length === 0) return;
    if (done.length > 1 && !window.confirm(`Remove ${done.length} completed items?`)) return;
    state.todos = state.todos.filter((t) => !t.completed);
    render();
    save();
  }

  // ---- rendering ---------------------------------------------------------

  function startEditing(li, todo) {
    if (li.querySelector('.edit')) return;
    const input = document.createElement('input');
    input.className = 'edit';
    input.value = todo.title;
    input.setAttribute('aria-label', `Edit ${todo.title}`);
    li.querySelector('.title').replaceWith(input);
    li.classList.add('editing');
    input.focus();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      updateTitle(todo.id, input.value);
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        finish();
      }
    });
    input.addEventListener('blur', finish);
  }

  function renderItem(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'toggle';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Mark ${todo.title} as done`);
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = todo.title;
    title.addEventListener('dblclick', () => startEditing(li, todo));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.textContent = 'Delete';
    del.setAttribute('aria-label', `Delete ${todo.title}`);
    del.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, title, del);
    return li;
  }

  function render() {
    els.list.replaceChildren(...visibleTodos().map(renderItem));

    const remaining = state.todos.filter((t) => !t.completed).length;
    const completed = state.todos.length - remaining;
    els.footer.hidden = state.todos.length === 0;
    els.count.textContent = formatCount(remaining);
    els.clear.hidden = completed === 0;

    for (const link of document.querySelectorAll('.filters a')) {
      link.classList.toggle('selected', link.dataset.filter === state.filter);
    }
  }

  function applyRoute() {
    const route = location.hash.replace(/^#\/?/, '');
    state.filter = route === 'active' || route === 'completed' ? route : 'all';
    render();
  }

  // ---- wiring ------------------------------------------------------------

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (addTodo(els.input.value)) {
      els.input.value = '';
    }
  });

  els.input.addEventListener('input', () => showError(''));
  els.clear.addEventListener('click', clearCompleted);
  window.addEventListener('hashchange', applyRoute);

  state.listId = resolveListId();
  const shareUrl = `${location.origin}/?list=${state.listId}`;
  els.share.href = shareUrl;
  els.share.textContent = shareUrl;

  window.tally = { formatCount, MAX_TITLE_LENGTH };

  applyRoute();
  load();
})();
