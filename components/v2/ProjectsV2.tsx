"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * v2 archive — a card row where the focused card lifts and tilts out of the
 * line, the way the reference site's team carousel behaves. The deliberate
 * contrast with v1: v1 uses physical manila folders, this uses flat editorial
 * cards with one tilted accent card.
 *
 * PLACEHOLDER — no project imagery yet.
 */
export default function ProjectsV2() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-card]", {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: "[data-cards]", start: "top 80%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-card]", {
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          scrollTrigger: { trigger: "[data-cards]", start: "top 80%" },
        });
      }, ref);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="work" className="bg-paper px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1500px] rounded-[22px] bg-card p-6 md:rounded-[28px] md:p-12">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-mist">
              Archive
            </p>
            <h2 className="font-display text-4xl font-light leading-none text-graphite md:text-6xl">
              Selected Work
            </h2>
          </div>
          <span className="hidden shrink-0 rounded-full border border-graphite/15 px-4 py-2 text-[10px] uppercase tracking-wide2 text-mist md:block">
            {site.projects.length} Projects
          </span>
        </div>

        <div
          data-cards
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {site.projects.map((p, i) => {
            const isActive = i === active;
            return (
              <article
                key={p.id}
                data-card
                tabIndex={0}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-label={`${p.title} — ${p.category}, ${p.year}`}
                className={[
                  "group relative cursor-pointer rounded-[18px] p-5 outline-none",
                  "transition-[transform,background-color,box-shadow] duration-300",
                  "[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                  "motion-reduce:transition-none",
                  isActive
                    ? "bg-lilac text-card shadow-[0_20px_50px_-25px_rgba(0,0,0,0.45)] md:-rotate-[1.4deg] md:-translate-y-1.5 motion-reduce:rotate-0 motion-reduce:translate-y-0"
                    : "bg-paper text-graphite",
                ].join(" ")}
              >
                {/* Placeholder plate for the project cover */}
                <div
                  className={[
                    "mb-5 flex aspect-[4/3] items-center justify-center rounded-[12px] transition-colors duration-300",
                    isActive ? "bg-card/25" : "bg-card",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-[9px] uppercase tracking-brand",
                      isActive ? "text-card/70" : "text-mist/60",
                    ].join(" ")}
                  >
                    Image
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-light leading-tight">
                      {p.title}
                    </h3>
                    <p
                      className={[
                        "mt-1 text-[10px] uppercase tracking-wide2",
                        isActive ? "text-card/75" : "text-mist",
                      ].join(" ")}
                    >
                      {p.category}
                    </p>
                  </div>

                  {/* Oversized numeral, clipped by the card edge — the graphic
                      device the reference uses on its advantage cards. */}
                  <span
                    aria-hidden
                    className={[
                      "-mb-6 -mr-1 shrink-0 overflow-hidden font-display text-5xl font-light leading-[0.8] tracking-tight",
                      isActive ? "text-card/35" : "text-graphite/10",
                    ].join(" ")}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
