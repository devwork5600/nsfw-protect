// canvasui.dev's force-field-react registry entry imports "../rect-cache" but
// its /r/force-field-react.json payload never includes that file (confirmed:
// /r/rect-cache.json 404s). Reimplemented here from ForceField.tsx's usage:
// rectCache.current is read on every pointermove, so it must stay a cheap
// cached read rather than calling getBoundingClientRect() (forces layout) on
// each event; the cache is refreshed on resize/scroll instead.
export interface RectCache {
  readonly current: DOMRect;
  destroy(): void;
}

export function createRectCache(el: Element): RectCache {
  let rect = el.getBoundingClientRect();

  const refresh = () => {
    rect = el.getBoundingClientRect();
  };

  const resizeObserver = new ResizeObserver(refresh);
  resizeObserver.observe(el);
  window.addEventListener('scroll', refresh, { passive: true, capture: true });
  window.addEventListener('resize', refresh, { passive: true });

  return {
    get current() {
      return rect;
    },
    destroy() {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    },
  };
}
