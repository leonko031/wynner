import Script from "next/script";

/**
 * Inline script that runs before paint so we never flash the wrong theme.
 * Reads `wynner.themeMode` from localStorage, falls back to system
 * preference, and sets `data-theme="light" | "dark"` on <html>.
 *
 * Implemented with `next/script` + `strategy="beforeInteractive"`. This is
 * the App Router-correct pattern — Next promotes the script into <head>
 * and executes it before any React hydration, eliminating FOUC. The eslint
 * "beforeInteractive outside _document" warning is stale guidance from the
 * old Pages Router era and doesn't apply here.
 */
export function ThemeScript() {
  const code = `(function(){try{var k='wynner.themeMode';var m=localStorage.getItem(k)||'system';var mq=window.matchMedia('(prefers-color-scheme: dark)');var resolved=m==='system'?(mq.matches?'dark':'light'):m;document.documentElement.dataset.theme=resolved;if(m==='system'){mq.addEventListener('change',function(e){if(localStorage.getItem(k)!=='system')return;document.documentElement.dataset.theme=e.matches?'dark':'light';});}}catch(e){document.documentElement.dataset.theme='light';}})();`;
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="wynner-theme" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
