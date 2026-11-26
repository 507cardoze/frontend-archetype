import { afterEach, describe, expect, it, vi } from 'vitest';

import { reloadOnStaleChunk } from './stale-chunk-reload';

/** A fresh page load sharing the tab's sessionStorage. */
const loadPage = (storage: () => Storage = () => window.sessionStorage) => {
  const target = new EventTarget() as Window;
  Object.defineProperty(target, 'sessionStorage', { get: storage });
  Object.assign(target, { location: { reload: vi.fn() } });
  reloadOnStaleChunk(target);
  return target;
};

const preloadError = (target: Window) => {
  const event = new Event('vite:preloadError', { cancelable: true });
  target.dispatchEvent(event);
  return event;
};

describe('reloadOnStaleChunk', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('reloads once, then shows the error if the new page fails right away', () => {
    vi.useFakeTimers();

    const stale = loadPage();
    expect(preloadError(stale).defaultPrevented).toBe(true);
    expect(stale.location.reload).toHaveBeenCalledTimes(1);

    const broken = loadPage();
    expect(preloadError(broken).defaultPrevented).toBe(false);
    expect(broken.location.reload).not.toHaveBeenCalled();
  });

  it('counts from page load, so a slow reload does not restart the cycle', () => {
    vi.useFakeTimers();
    preloadError(loadPage());
    vi.advanceTimersByTime(60_000); // the reload itself took a minute

    const broken = loadPage();
    preloadError(broken);

    expect(broken.location.reload).not.toHaveBeenCalled();
  });

  it('reloads again for a later deploy', () => {
    vi.useFakeTimers();
    preloadError(loadPage());

    const page = loadPage();
    vi.advanceTimersByTime(60_000);
    preloadError(page);

    expect(page.location.reload).toHaveBeenCalledTimes(1);
  });

  it('shows the error when sessionStorage is blocked', () => {
    const page = loadPage(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(preloadError(page).defaultPrevented).toBe(false);
    expect(page.location.reload).not.toHaveBeenCalled();
  });
});
