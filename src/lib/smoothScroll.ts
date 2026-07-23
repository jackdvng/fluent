/**
 * Custom window scroll animation. Unlike the browser's `scrollIntoView`
 * ({ behavior: "smooth" }), the duration is controllable so the movement is
 * slow enough to follow.
 *
 * Respects `prefers-reduced-motion`: jumps instantly instead of animating.
 * Browser-only — safe no-op during SSR.
 */

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function animatedScrollTo(targetY: number, duration = 700): void {
  if (typeof window === "undefined") {
    return;
  }

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const maxY = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const clampedTarget = Math.max(0, Math.min(targetY, maxY));

  if (prefersReducedMotion || duration <= 0) {
    window.scrollTo(0, clampedTarget);
    return;
  }

  const startY = window.scrollY;
  const distance = clampedTarget - startY;

  if (distance === 0) {
    return;
  }

  const startTime = performance.now();

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    window.scrollTo(0, startY + distance * easeOutCubic(progress));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

/**
 * Animate the window scroll so `element` is near the top of the viewport.
 * `offset` leaves a gap above the element (px).
 */
export function animatedScrollToElement(
  element: HTMLElement,
  offset = 16,
  duration = 700,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
  animatedScrollTo(targetY, duration);
}
