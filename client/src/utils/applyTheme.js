/** Apply theme to DOM immediately (no React render wait). */
export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
  root.style.colorScheme = t;
  localStorage.setItem('theme', t);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', t === 'light' ? '#f0f4f8' : '#0c1018');
  }
}

// Run before React mounts (module load) so first paint matches saved preference
applyTheme(localStorage.getItem('theme') || 'dark');
