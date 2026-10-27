import assert from "node:assert/strict";
import test from "node:test";

import {
  getHomeHeroRevealObserverOptions,
  HOME_HERO_MOTION,
  isHomeHeroRoute,
} from "./home-hero-motion";

test("enables premium Hero motion only on the public home route", () => {
  assert.equal(isHomeHeroRoute("/"), true);
  assert.equal(isHomeHeroRoute("/curso"), false);
  assert.equal(isHomeHeroRoute("/aula"), false);
});

test("keeps a long deterministic range for progressive scroll reveal", () => {
  assert.equal(HOME_HERO_MOTION.scrollReveal.start, 8);
  assert.equal(HOME_HERO_MOTION.scrollReveal.end, 46);
  assert.ok(HOME_HERO_MOTION.scrollReveal.end > HOME_HERO_MOTION.scrollReveal.start);
  assert.ok(HOME_HERO_MOTION.mobileDistance < HOME_HERO_MOTION.distance);
});

test("declares all six premium Hero motion layers", () => {
  assert.deepEqual(HOME_HERO_MOTION.effects, [
    "hover",
    "loader",
    "depth",
    "entrance",
    "micro",
    "parallax",
  ]);
});

test("respects reduced motion preferences while keeping the Home content available", () => {
  assert.equal(HOME_HERO_MOTION.ignoreReducedMotionPreference, false);
});

test("uses a browser-compatible observer threshold for the scroll reveal fallback", () => {
  assert.deepEqual(getHomeHeroRevealObserverOptions(), {
    root: null,
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16,
  });
});

test("keeps premium home motion timing centralized", () => {
  assert.equal(HOME_HERO_MOTION.reveal.durationMs, 920);
  assert.equal(HOME_HERO_MOTION.reveal.staggerMs, 90);
  assert.equal(HOME_HERO_MOTION.testimonials.autoplayMs, 3600);
});
