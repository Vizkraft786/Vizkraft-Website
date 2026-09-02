"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * Selected work, presented as a horizontal rail of physical folders.
 *
 * PLACEHOLDER — folders carry no project imagery yet. Real covers, titles and
 * case-study links get wired in later; what's established here is the layout,
 * the folder object itself and the hover behaviour.
 *
 * Built by hand rather than pulled from Magic UI / SmoothUI / Unlumen: none of
 * them ships a physical-folder component (their "File Tree" is a sidebar tree,
 * not this), and all three are Motion-based — a second animation runtime is not
 * worth it on a page already carrying 120 sequence frames and GSAP.
 */
export default function Work() {
  const ref = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  /* --------------------------------------------------- reveal on scroll --- */
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-folder]", {
          opacity: 0,
          y: 26,
          rotate: -1.5,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: railRef.current, start: "top 82%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-folder]", {
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          scrollTrigger: { trigger: railRef.current, start: "top 82%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  /* ------------------------------------------------------ drag to scroll --- */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      // Ignore secondary buttons so right-click doesn't start a drag.
      if (e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = rail.scrollLeft;
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        moved = true;
        rail.setPointerCapture?.(e.pointerId);
      }
      rail.scrollLeft = startLeft - dx;
    };

    const onUp = () => {
      down = false;
      // Suppress the click that follows a drag so a folder isn't "opened"
      // just because the user flicked the rail.
      if (moved) {
        const swallow = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        rail.addEventListener("click", swallow, { capture: true, once: true });
      }
    };

    /**
     * Axis-aware wheel handling.
     *
     * `data-lenis-prevent` was the obvious way to let this element scroll, but
     * it hands Lenis the entire gesture: a normal downward wheel with the
     * cursor over the rail then scrolls neither the rail (no vertical overflow)
     * nor the page, and the visitor is stuck. So only horizontally-dominant
     * gestures — trackpad swipes, shift+wheel — are claimed here, and anything
     * vertical is left alone to scroll the page as usual.
     */
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      if (!horizontal) return;

      const delta = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      const atStart = rail.scrollLeft <= 0 && delta < 0;
      const atEnd =
        rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1 && delta > 0;

      // Let the gesture bubble at the ends so it doesn't feel trapped.
      if (atStart || atEnd) return;

      e.preventDefault();
      rail.scrollLeft += delta;
    };

    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <section ref={ref} id="work" className="bg-ink px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex items-end justify-between gap-6 border-b border-bone/10 pb-8">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-wide2 text-stone">
              Archive
            </p>
            <h2 className="font-display text-5xl font-light leading-none text-bone md:text-7xl">
              Selected Work
            </h2>
          </div>
          <span className="hidden shrink-0 text-[10px] uppercase tracking-wide2 text-stone md:block">
            Drag to browse
          </span>
        </div>
      </div>

      {/* Full-bleed rail so folders run past both edges of the page. */}
      <div className="folder-rail-mask -mx-6 mt-14 md:-mx-10">
        <div
          ref={railRef}
          className="folder-rail no-scrollbar flex cursor-grab gap-14 overflow-x-auto px-6 pb-24 pt-6 active:cursor-grabbing md:gap-16 md:px-10"
          style={{ scrollSnapType: "x proximity" }}
        >
          {site.projects.map((p) => (
            <article
              key={p.id}
              data-folder
              tabIndex={0}
              aria-label={`${p.title} — ${p.category}, ${p.year}`}
              className="folder group outline-none"
              style={{ scrollSnapAlign: "center" }}
            >
              <div className="folder__back" />
              <div className="folder__tab" />

              {/* The sheet doubles as the slot for a future project cover. */}
              <div className="folder__sheet flex items-center justify-center">
                <span className="text-[9px] uppercase tracking-brand text-stone/50">
                  Image
                </span>
              </div>

              <div className="folder__front" />

              {/* Index card on the tab — reads as a filing label. */}
              <span className="pointer-events-none absolute left-4 top-[0.62rem] z-10 text-[8px] uppercase tracking-wide2 text-ink/55">
                {p.year}
              </span>

              <div className="folder__label text-center">
                <h3 className="font-display text-xl font-light text-bone">
                  {p.title}
                </h3>
                <p className="mt-1 text-[9px] uppercase tracking-wide2 text-ember">
                  {p.category}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
