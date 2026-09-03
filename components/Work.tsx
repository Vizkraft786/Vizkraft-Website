"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/lib/site-config";
import { scatter } from "@/lib/scatter";

gsap.registerPlugin(ScrollTrigger);

/**
 * The archive — nine drawers standing side by side, seen face-on.
 *
 * Hover widens a drawer and pushes its neighbours aside; clicking one spills
 * its renders across the screen over a blurred backdrop. There is no dragging:
 * all nine are visible at once, so nothing is hidden behind a gesture.
 *
 * PLACEHOLDER — plates are blank. Real renders replace them later; the counts
 * in site-config are already the intended density so the scatter can be judged
 * now rather than after imagery lands.
 */
export default function Work() {
  const ref = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  /* ------------------------------------------------- drawers reveal ----- */
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-drawer]", {
          yPercent: 8,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.05,
          scrollTrigger: { trigger: railRef.current, start: "top 80%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-drawer]", {
          opacity: 0,
          duration: 0.4,
          stagger: 0.03,
          scrollTrigger: { trigger: railRef.current, start: "top 80%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  /* --------------------------------------------------- overlay open ----- */
  useEffect(() => {
    if (open === null) return;

    // Lock the page behind the overlay, and restore the exact scrollbar gutter
    // so the layout doesn't jump as it opens and closes.
    const prevOverflow = document.body.style.overflow;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.from("[data-plate]", {
        opacity: 0,
        scale: reduce ? 1 : 0.92,
        // Plates rise out of the drawer rather than appearing in place.
        y: reduce ? 0 : 26,
        duration: reduce ? 0.25 : 0.55,
        ease: "power3.out",
        stagger: reduce ? 0.02 : 0.045,
      });
    }, overlayRef);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = "";
      ctx.revert();
    };
  }, [open]);

  const active = open === null ? null : site.projects[open];

  return (
    <section ref={ref} id="work" className="bg-white3 px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 flex items-end justify-between gap-6 border-b border-ink/10 pb-8">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-wide2 text-ink/50">
              Archive
            </p>
            <h2 className="font-display text-5xl font-light leading-none text-ink md:text-7xl">
              Selected Work
            </h2>
          </div>
          <span className="hidden shrink-0 text-[10px] uppercase tracking-wide2 text-ink/50 md:block">
            Open a drawer
          </span>
        </div>

        {/* The drawers */}
        <div
          ref={railRef}
          className="drawer-rail flex h-[58vh] min-h-[380px] w-full gap-[3px] overflow-hidden md:h-[68vh]"
        >
          {site.projects.map((p, i) => (
            <button
              key={p.id}
              data-drawer
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open ${p.title} — ${p.renders} renders`}
              className="drawer group relative"
              style={{ ["--tab-top" as string]: `${8 + ((i * 7) % 34)}%` }}
            >
              {/* Card face */}
              <span className="drawer__face grain" />

              {/* Cut tab, staggered down the row like real dividers */}
              <span className="drawer__tab grain" />

              {/* Vertical label on the tab */}
              <span className="drawer__label">
                <span className="text-[10px] uppercase tracking-wide2 text-ink/45">
                  {String(i + 1).padStart(3, "0")} //
                </span>
                <span className="ml-2 text-[11px] font-medium uppercase tracking-wide2 text-ink/85">
                  {p.title}
                </span>
              </span>

              {/* Footer detail, only legible once the drawer widens */}
              <span className="drawer__meta">
                <span className="block text-[9px] uppercase tracking-wide2 text-ink/40">
                  {p.category}
                </span>
                <span className="mt-1 block text-[9px] uppercase tracking-wide2 text-ink/30">
                  {p.renders} Renders · {p.year}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ scatter overlay -- */}
      {active && open !== null && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} renders`}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 cursor-zoom-out bg-ink/70 backdrop-blur-2xl"
        >
          {/* Heading sits above the plates but must not swallow the click */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] flex items-start justify-between px-6 py-6 md:px-10 md:py-8">
            <div>
              <p className="text-[10px] uppercase tracking-wide2 text-bone/50">
                {active.category} · {active.year}
              </p>
              <h3 className="mt-2 font-display text-3xl font-light text-bone md:text-5xl">
                {active.title}
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wide2 text-bone/50">
              Click anywhere to close
            </span>
          </div>

          {scatter(open, active.renders).map((pl, i) => (
            <figure
              key={i}
              data-plate
              className="absolute rounded-[3px] bg-sheet shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-black/5"
              style={{
                left: `${pl.x}%`,
                top: `${pl.y}%`,
                width: `${pl.w}vw`,
                zIndex: pl.z,
                transform: `translate(-50%, -50%) rotate(${pl.rotate}deg)`,
                aspectRatio:
                  pl.ratio === "landscape"
                    ? "4 / 3"
                    : pl.ratio === "portrait"
                      ? "3 / 4"
                      : "1 / 1",
              }}
            >
              <span className="grain absolute inset-0 rounded-[3px]" />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
