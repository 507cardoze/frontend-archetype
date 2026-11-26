const RELOADED_AT_KEY = 'stale-chunk-reloaded-at';
const WINDOW_MS = 10_000;

/**
 * After a deploy, an open tab may request a chunk of the previous release: reload once to get the
 * new one. If the reloaded page fails again within a few seconds, the release itself is broken, so
 * the error is left to the route error page instead of reloading forever.
 */
export const reloadOnStaleChunk = (target: Window = window) => {
  target.addEventListener('vite:preloadError', () => {
    const lastReload = Number(target.sessionStorage.getItem(RELOADED_AT_KEY));
    if (Date.now() - lastReload < WINDOW_MS) return;
    target.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
    target.location.reload();
  });
};
