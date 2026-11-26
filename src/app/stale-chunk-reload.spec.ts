import { afterEach, describe, expect, it, vi } from 'vitest';

import { reloadOnStaleChunk } from './stale-chunk-reload';

const fakeWindow = () => {
  const target = new EventTarget() as Window;
  Object.assign(target, { location: { reload: vi.fn() }, sessionStorage: window.sessionStorage });
  reloadOnStaleChunk(target);
  return target;
};

describe('reloadOnStaleChunk', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('reloads once, then lets a repeated failure through instead of looping', () => {
    vi.useFakeTimers();
    const target = fakeWindow();

    target.dispatchEvent(new Event('vite:preloadError'));
    target.dispatchEvent(new Event('vite:preloadError'));

    expect(target.location.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again for a later deploy', () => {
    vi.useFakeTimers();
    const target = fakeWindow();

    target.dispatchEvent(new Event('vite:preloadError'));
    vi.advanceTimersByTime(60_000);
    target.dispatchEvent(new Event('vite:preloadError'));

    expect(target.location.reload).toHaveBeenCalledTimes(2);
  });
});
