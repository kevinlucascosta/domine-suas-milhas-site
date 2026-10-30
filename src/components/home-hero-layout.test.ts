import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const componentSource = readFileSync(
  join(process.cwd(), "src", "components", "learning-site.tsx"),
  "utf8",
);

const globalStyles = readFileSync(
  join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

test("keeps only real learning and level cards in the Hero copy area", () => {
  assert.doesNotMatch(componentSource, /className="float-card float-points"/);
  assert.doesNotMatch(componentSource, /className="float-card float-badge"/);
  assert.match(componentSource, /className="hero-learning-cards"/);
});

test("keeps the requested Home Hero entrance active even when reduced motion is preferred", () => {
  assert.doesNotMatch(
    globalStyles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-entrance/,
  );
});

test("keeps traveler testimonials under manual navigation without autoplay controls", () => {
  assert.doesNotMatch(componentSource, /autoplayMs/);
  assert.doesNotMatch(componentSource, /traveler-carousel-pause/);
  assert.match(componentSource, /onTouchEnd=\{handleTestimonialTouchEnd\}/);
  assert.match(componentSource, /aria-label="Depoimento anterior"/);
  assert.match(componentSource, /aria-label="Próximo depoimento"/);
});

test("keeps traveler testimonial screenshots free of decorative quotation marks", () => {
  assert.doesNotMatch(componentSource, /traveler-testimonial-quote/);
});

test("keeps the home page scrollable without showing a browser scrollbar", () => {
  assert.match(globalStyles, /scrollbar-width:\s*none/);
  assert.match(globalStyles, /html::-webkit-scrollbar, body::-webkit-scrollbar\s*\{[\s\S]*?width:\s*0[\s\S]*?height:\s*0/);
});

test("uses a Home-only smoother scroll reveal that respects reduced motion", () => {
  const homeMotionPath = join(
    process.cwd(),
    "src",
    "components",
    "home-motion.module.css",
  );
  assert.ok(existsSync(homeMotionPath));
  const homeMotionStyles = readFileSync(homeMotionPath, "utf8");

  assert.match(componentSource, /homeMotionStyles\.flow/);
  assert.match(homeMotionStyles, /620ms/);
  assert.match(homeMotionStyles, /cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(homeMotionStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(homeMotionStyles, /animation:\s*none/);
  assert.match(homeMotionStyles, /opacity:\s*1/);
  assert.match(homeMotionStyles, /transform:\s*none/);
});

test("keeps testimonial navigation stable during rapid manual changes", () => {
  assert.doesNotMatch(componentSource, /key=\{testimonial\.image\}/);
  assert.match(componentSource, /testimonialTransitionLock/);
  assert.match(componentSource, /preloadTestimonialImages/);
  assert.match(componentSource, /\.decode\(\)/);
});

test("reserves each testimonial image before its pixels finish decoding", () => {
  assert.match(componentSource, /width=\{testimonial\.width\}/);
  assert.match(componentSource, /height=\{testimonial\.height\}/);
});

test("constrains the stamp card only at the mobile breakpoint", () => {
  const homeMotionStyles = readFileSync(
    join(process.cwd(), "src", "components", "home-motion.module.css"),
    "utf8",
  );

  assert.match(homeMotionStyles, /@media \(max-width: 620px\)/);
  assert.match(homeMotionStyles, /travel-memory-next-card/);
  assert.match(homeMotionStyles, /max-height:\s*262px/);
});

test("hides the scrollbar only while the Home route is mounted", () => {
  const homeMotionStyles = readFileSync(
    join(process.cwd(), "src", "components", "home-motion.module.css"),
    "utf8",
  );

  assert.match(componentSource, /classList\.add\("home-scrollbar-hidden"\)/);
  assert.match(
    componentSource,
    /classList\.remove\("home-scrollbar-hidden"\)/,
  );
  assert.match(homeMotionStyles, /html\.home-scrollbar-hidden/);
  assert.match(homeMotionStyles, /scrollbar-width:\s*none/);
  assert.match(homeMotionStyles, /::-webkit-scrollbar/);
});

test("offers a Home-only control to return smoothly to the top after scrolling", () => {
  assert.match(componentSource, /slide === 0 && showScrollToTop/);
  assert.match(componentSource, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
  assert.match(componentSource, /className="home-scroll-to-top"/);
  assert.match(globalStyles, /\.home-scroll-to-top/);
});

test("links the Sky Tech signature from the footer and the fixed shortcut", () => {
  assert.match(componentSource, /href="https:\/\/skytechbr\.vercel\.app\/#inicio"/);
  assert.match(componentSource, /src="\/sky-tech-logo\.png"/);
  assert.match(componentSource, /src="\/sky-tech-icon\.png"/);
  assert.match(componentSource, /className="site-footer-sky-tech"/);
  assert.match(componentSource, /className="social-shortcut social-sky-tech"/);
  assert.match(globalStyles, /\.site-footer-sky-tech/);
  assert.match(globalStyles, /\.social-sky-tech/);
  assert.match(globalStyles, /\.site-footer:has\(\.site-footer-sky-tech\)/);
  assert.match(globalStyles, /flex-basis:\s*100%/);
  const footerLogoRule = globalStyles.match(/\.site-footer-sky-tech img\s*\{([^}]*)\}/)?.[1];
  assert.match(footerLogoRule ?? "", /width:\s*360px/);
});
