"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
 *
 * Also resyncs both once web fonts finish loading. next/font ships with
 * display:"swap" — the page paints in a fallback font first and swaps to the
 * real webfont slightly after mount. Lenis and ScrollTrigger both cache
 * scroll-range measurements at init; if that font swap shifts layout after
 * those caches are taken, both go stale until something forces a
 * recalculation. That's this exact bug: the hero looks shifted/cropped on
 * first load, and a manual scroll "fixes" it only because a scroll event
 * happens to force ScrollTrigger to recheck — the fix is to force that
 * recheck proactively instead of relying on the visitor doing it by accident.
 */
export default function SmoothScroll() {
  useEffect(() => {
    /**
     * The actual cause of "the hero looks shifted/cropped until I scroll
     * once": the browser's native scroll restoration (on by default) snaps
     * a fresh load to whatever scroll position it last remembers for this
     * URL, rather than starting at the top — confirmed by testing in a
     * brand-new tab, not just a reused one, so it isn't dev-session
     * navigation history alone causing it. A single-page cinematic that must
     * always open on its opening frame can't tolerate that; it needs to
     * always start at 0. This has to run, and scrollTo(0,0) has to happen,
     * BEFORE Lenis/ScrollTrigger initialise below, so their very first
     * measurement is taken from the correct starting position rather than
     * whatever the browser restored.
     */
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });

    let raf: ((time: number) => void) | null = null;
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const resync = () => {
      lenis?.resize();
      ScrollTrigger.refresh();
    };
    document.fonts.ready.then(resync);
    // Belt-and-braces: CinematicScroll's own ScrollTriggers are created only
    // once its first 12 frames decode, which may land after fonts.ready
    // resolves — this second pass catches that ordering gap.
    const settleTimer = window.setTimeout(resync, 500);

    return () => {
      window.clearTimeout(settleTimer);
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}
