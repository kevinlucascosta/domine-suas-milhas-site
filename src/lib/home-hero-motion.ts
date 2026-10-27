/** Motion settings scoped to the public home Hero. */
export const HOME_HERO_MOTION = {
  // Pessoas que preferem menos movimento continuam vendo todo o conteúdo,
  // sem os efeitos decorativos contínuos da Home.
  ignoreReducedMotionPreference: false,
  effects: [
    "hover",
    "loader",
    "depth",
    "entrance",
    "micro",
    "parallax",
  ],
  distance: 24,
  mobileDistance: 12,
  reveal: {
    durationMs: 920,
    staggerMs: 90,
  },
  testimonials: {
    autoplayMs: 3600,
  },
  scrollReveal: {
    start: 8,
    end: 46,
  },
} as const;

/** Keeps premium Hero effects out of the course, account, and checkout routes. */
export function isHomeHeroRoute(route: string): boolean {
  return route === "/";
}

/**
 * Native observer settings keep the progressive reveal working when a browser
 * does not implement CSS scroll timelines yet.
 */
export function getHomeHeroRevealObserverOptions() {
  return {
    root: null,
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16,
  } as const;
}
