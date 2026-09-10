"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site-config";

/**
 * Floating capsule nav, matched to the reference: one rounded bar inset from
 * every edge rather than a full-bleed strip: Work on the left, the wordmark
 * centred, Contact on the right. All three are plain text links at the same
 * size and colour — the bar carries no button, so it never competes with the
 * persistent CTA over the cinematic.
 *
 * Sentence case, not the uppercase micro-label treatment used elsewhere on the
 * site — the reference's nav is deliberately quieter than its section labels,
 * and matching it here is the whole point of the change.
 *
 * The capsule always carries its own translucent ground, so unlike the previous
 * transparent-to-solid nav there is no state where the text sits directly on
 * the page. What the scroll position still decides is how opaque that ground
 * is: over the cinematic the film supplies the contrast and the bar can stay
 * glassy, but over the light sections below a 25%-ink pill would leave off-white
 * text on near-white, so it firms up to near-solid.
 */
export default function Nav() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    /**
     * Measured off the first post-hero section rather than a viewport multiple.
     * A hardcoded constant here silently went wrong once already when the hero's
     * height changed; reading the real offset keeps the two in sync.
     */
    const threshold = () => {
      const work = document.getElementById("work");
      return work ? work.offsetTop - 80 : window.innerHeight * 9;
    };

    let limit = threshold();
    const onScroll = () => setPast(window.scrollY > limit);
    const onResize = () => {
      limit = threshold();
      onScroll();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-6 md:pt-5">
      <nav
        className={`relative mx-auto flex max-w-[1600px] items-center justify-between rounded-full border py-4 pl-5 pr-5 backdrop-blur-xl transition-colors duration-500 md:pl-7 md:pr-7 ${
          past
            ? "border-white3/10 bg-ink/90"
            : "border-white3/15 bg-ink/25"
        }`}
      >
        {/*
          Left — section links. Work only; Contact balances it on the right.
        */}
        <div className="flex items-center gap-6 md:gap-8">
          <a
            href="#work"
            className="text-[13px] text-stone/70 transition-colors hover:text-stone"
          >
            Work
          </a>
        </div>

        {/*
          Centre — absolutely positioned so it is centred on the BAR, not on
          whatever space the two flex neighbours happen to leave. Those sides
          have different widths (Work vs Contact), so a plain flex child would
          sit visibly off-centre.

          Hidden below sm: at phone width it would collide with the two links,
          and the giant wordmark in the hero already carries the brand.
        */}
        <a
          href="#top"
          className="absolute left-1/2 hidden -translate-x-1/2 text-[13px] font-thin tracking-wide2 text-stone transition-opacity hover:opacity-70 sm:block"
        >
          {site.name}
        </a>

        {/*
          Right — Contact, as a plain text link matching Work exactly (same
          size, colour and hover), not a pill.

          The nav now carries no button at all. That is deliberate: the
          persistent "Start a Project" pill over the cinematic is the page's
          single call to action, and a second pill up here competed with it
          for the same job. Leaving Contact as quiet text keeps one visual
          priority on screen.
        */}
        <a
          href="#contact"
          className="text-[13px] text-stone/70 transition-colors hover:text-stone"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
