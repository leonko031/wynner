/**
 * Inline script that runs before paint so we never flash the wrong theme.
 * Reads `wynner.themeMode` from localStorage, falls back to system preference,
 * and sets `data-theme="light" | "dark"` on <html>.
 *
 * Mounted as a non-async <script> inside <head>. React 19 emits a console
 * warning about inline <script> nodes in components, which is accepted here —
 * the FOIT trade-off is worse than the warning.
 */
export function ThemeScript() {
  const code = `(function(){try{var k='wynner.themeMode';var m=localStorage.getItem(k)||'system';var mq=window.matchMedia('(prefers-color-scheme: dark)');var resolved=m==='system'?(mq.matches?'dark':'light'):m;document.documentElement.dataset.theme=resolved;if(m==='system'){mq.addEventListener('change',function(e){if(localStorage.getItem(k)!=='system')return;document.documentElement.dataset.theme=e.matches?'dark':'light';});}}catch(e){document.documentElement.dataset.theme='light';}})();`;
  return (
    <script
      // dangerouslySetInnerHTML keeps the script tag from being interpreted
      // as a React component (the inline-script warning only fires for the
      // jsx `<script>{code}</script>` form).
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
