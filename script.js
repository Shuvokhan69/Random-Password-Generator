const INPUT = document.getElementById('input');
const BTN = document.getElementById('btn');
const CLEAR_ALL_BTN = document.getElementById('clear');
const OUTPUT = document.getElementById('output');
const STORAGE_KEY = 'passwords_v1';

let passwords = loadFromStorage();

renderList();

/* Utilities */
function generatePassword(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let pass = '';
  for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
  } catch (e) {
    console.error('Failed to save passwords to localStorage', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read passwords from localStorage', e);
    return [];
  }
}

function showNotice(text, timeout = 1600) {
  const n = document.createElement('div');
  n.className = 'empty-state notice';
  n.textContent = text;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), timeout);
}

/* Render */
function renderList() {
  OUTPUT.innerHTML = '';
  if (!passwords.length) {
    OUTPUT.innerHTML = '<div class="empty-state"><i>No saved passwords</i></div>';
    return;
  }
  passwords.forEach(item => {
    const el = document.createElement('div');
    el.className = 'output';
    el.dataset.id = item.id;
    el.innerHTML = `
      <div class="password-plain" title="${escapeHtml(item.password)}">${escapeHtml(item.password)}</div>
      <div class="password-actions">
        <button class="copy-btn" type="button">Copy</button>
        <button class="delete-btn" type="button" title="Delete">Delete</button>
      </div>
    `;
    OUTPUT.appendChild(el);
  });
}

/* Escape to avoid injection when rendering */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* Add new password (prepend) */
function addPassword(password) {
  const item = { id: Date.now().toString(), password, createdAt: new Date().toISOString() };
  passwords.unshift(item);
  saveToStorage();
  renderList();
}

/* Remove single password */
function removePassword(id) {
  passwords = passwords.filter(p => p.id !== id);
  saveToStorage();
  renderList();
}

/* Copy helper with fallback */
async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fall through to fallback
    }
  }
  // fallback: create textarea and select
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

/* Event handlers */
BTN.addEventListener('click', () => {
  const len = parseInt(INPUT.value, 10);
  if (!len || len <= 0) {
    showNotice('Please enter a valid password length.');
    INPUT.focus();
    return;
  }
  const pass = generatePassword(len);
  addPassword(pass);
  INPUT.select();
  INPUT.value = '';
});

CLEAR_ALL_BTN.addEventListener('click', () => {
  if (!passwords.length) {
    showNotice('Nothing to clear.');
    return;
  }
  if (!confirm('Clear all saved passwords?')) return;
  passwords = [];
  saveToStorage();
  renderList();
  showNotice('All passwords cleared.');
});

/* Delegate clicks inside output for copy/delete */
OUTPUT.addEventListener('click', async (ev) => {
  const target = ev.target;
  const itemEl = target.closest('.output');
  if (!itemEl) return;
  const id = itemEl.dataset.id;
  if (target.classList.contains('copy-btn')) {
    const pwItem = passwords.find(p => p.id === id);
    if (!pwItem) return;
    const ok = await copyToClipboard(pwItem.password);
    showNotice(ok ? 'Password copied.' : 'Copy failed. Select and copy manually.');
  } else if (target.classList.contains('delete-btn')) {
    if (confirm('Delete this password?')) {
      removePassword(id);
      showNotice('Password deleted.');
    }
  }
});