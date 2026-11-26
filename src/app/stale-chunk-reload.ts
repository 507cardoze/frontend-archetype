const RELOADED_KEY = 'stale-chunk-reloaded';
const WINDOW_MS = 10_000;

/**
 * After a deploy, an open tab may request a chunk of the previous release: reload once to get the
 * new one. If the page that reload produced fails again within a few seconds of loading, the
 * release itself is broken, so the error is left to the route error page instead of reloading
 * forever. Without sessionStorage there is no way to know, so the error is shown too.
 */
export const reloadOnStaleChunk = (target: Window = window) => {
  const loadedAt = Date.now();
  let cameFromReload = false;
  try {
    cameFromReload = target.sessionStorage.getItem(RELOADED_KEY) !== null;
    target.sessionStorage.removeItem(RELOADED_KEY);
  } catch {
    // Storage blocked: cameFromReload stays false and the listener below gives up.
  }

  target.addEventListener('vite:preloadError', (event) => {
    if (cameFromReload && Date.now() - loadedAt < WINDOW_MS) return;
    try {
      target.sessionStorage.setItem(RELOADED_KEY, '1');
    } catch {
      return;
    }
    // Keeps Vite from throwing, so the error page does not flash before the reload.
    event.preventDefault();
    target.location.reload();
  });
};
