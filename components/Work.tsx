"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * The archive — nine drawers standing side by side, seen face-on.
 *
 * Hover widens a drawer and pushes its neighbours aside; clicking one opens
 * its renders over a blurred backdrop. There is no dragging: all nine are
 * visible at once, so nothing is hidden behind a gesture.
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
  // Sum of the open project's width/height ratios: the total width of its row
  // per unit of height, which is what sizes the row to fit the screen.
  const ratioSum = active
    ? active.images.reduce((sum, img) => sum + img.width / img.height, 0)
    : 0;

  return (
    <section ref={ref} id="work" className="bg-white3 px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 flex items-end justify-between gap-6 border-b border-ink/10 pb-8">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-wide2 text-ink/50 max-md:text-[11px] max-md:text-ink/65">
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
          className="drawer-rail flex h-[58vh] min-h-[380px] w-full gap-[3px] overflow-hidden md:h-[68vh] max-md:h-auto max-md:min-h-0 max-md:flex-col max-md:gap-1.5"
        >
          {site.projects.map((p, i) => (
            <button
              key={p.id}
              data-drawer
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open ${p.title}, ${p.images.length} renders`}
              className="drawer group relative"
              style={{ ["--tab-top" as string]: `${8 + ((i * 7) % 34)}%` }}
            >
              {/* Card face */}
              <span className="drawer__face grain" />

              {/* Cut tab, staggered down the row like real dividers */}
              <span className="drawer__tab grain" />

              {/* Vertical label on the tab */}
              <span className="drawer__label">
                <span className="text-[10px] uppercase tracking-wide2 text-ink/45 max-md:text-[11px] max-md:text-ink/60">
                  {String(i + 1).padStart(3, "0")} //
                </span>
                <span className="ml-2 text-[11px] font-thin uppercase tracking-wide2 text-ink/85 max-md:text-[13px]">
                  {p.title}
                </span>
              </span>

              {/* Footer detail, only legible once the drawer widens */}
              <span className="drawer__meta">
                <span className="block text-[9px] uppercase tracking-wide2 text-ink/40 max-md:text-[10px] max-md:text-ink/60">
                  {p.images.length} Renders
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ overlay ----- */}
      {active && open !== null && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} renders`}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 cursor-zoom-out overflow-y-auto bg-ink/80 backdrop-blur-2xl md:overflow-hidden md:[container-type:size] max-md:overscroll-contain"
          style={{
            // Fixed header band, so the plates can be placed against it exactly.
            ["--header-h" as string]: "9rem",
            // Row height: as tall as the width allows, but never taller than
            // the screen minus the header and a bottom margin. cqw/cqh are the
            // overlay's own size (it is the container), resolved where used.
            ["--plate-h" as string]: `min(100cqh - var(--header-h) - 2.5rem, (min(100cqw - 5rem, 1520px) - ${active.images.length - 1} * 1.5rem) / ${ratioSum})`,
            // Centred on the screen, unless that would slide it under the header.
            ["--row-top" as string]: "max(var(--header-h), (100cqh - var(--plate-h)) / 2)",
          }}
        >
          {/*
            Sticky on small screens, where the plates stack and the overlay
            scrolls: the project's name stays with you down its renders, on a
            near-solid band so it stays legible over the render passing under
            it. From md up nothing scrolls, so it simply holds the top band.
          */}
          <div className="pointer-events-none sticky top-0 z-[100] flex items-start justify-between px-6 py-6 md:h-[var(--header-h)] md:px-10 md:py-8 max-md:bg-ink/85">
            <div>
              <p className="text-[10px] uppercase tracking-wide2 text-bone/50">
                {active.images.length} Renders
              </p>
              <h3 className="mt-2 font-display text-3xl font-light text-bone md:text-5xl">
                {active.title}
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wide2 text-bone/50">
              Click anywhere to close
            </span>
          </div>

          {/*
            An equal-height row, sized by each render's own aspect ratio, that
            always fits on one screen.

            From md up every plate is exactly --plate-h tall and --plate-h
            times its own ratio wide, so heights match and each plate is the
            render's true shape: nothing is cropped, portrait or landscape.
            --plate-h is the smaller of two limits — the height at which the
            row fills the available width, and the height left on screen — so
            a pair of portraits shrinks to fit the screen's height instead of
            running off the bottom, and a pair of landscapes still spans the
            width. The row is then centred vertically on the screen.

            Below md the plates stack at full width, still at their own
            proportions, and the overlay scrolls.

            object-cover stays on regardless. With matched ratios it is a
            no-op today, but if a render is ever swapped for one of a different
            shape without its dimensions being updated in site-config, it
            crops from the centre instead of distorting.
          */}
          <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 pb-24 pt-4 md:absolute md:inset-x-0 md:top-[var(--row-top)] md:max-w-none md:flex-row md:justify-center md:gap-6 md:p-0">
            {active.images.map((img, i) => (
              <figure
                key={img.src}
                data-plate
                className="relative w-full overflow-hidden rounded-[3px] bg-sheet shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-black/5 md:h-[var(--plate-h)] md:w-[calc(var(--plate-h)*var(--ratio))] md:flex-none"
                style={{
                  ["--ratio" as string]: img.width / img.height,
                  aspectRatio: `${img.width} / ${img.height}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`${active.title}, render ${i + 1} of ${active.images.length}`}
                  width={img.width}
                  height={img.height}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
