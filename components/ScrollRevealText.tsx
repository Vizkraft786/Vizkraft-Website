"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-linked word cascade.
 *
 * Each word carries its own position in the reveal rather than the block
 * fading in as one unit, so at any moment the line reads dark -> grey ->
 * near-invisible, and the gradient travels as you scroll. This is the move the
 * MYDNA reference uses on its mission statement and its "CONTACT US" heading.
 *
 * Words stay in the DOM as real text — only opacity animates — so the heading
 * remains selectable and readable to screen readers.
 */
export default function ScrollRevealText({
  children,
  className = "",
  as: Tag = "p",
  /** Dimmest a word gets before its turn. Never 0 — the shape of the line
   *  should stay legible ahead of the reveal, which is what makes the
   *  cascade read as lighting up rather than appearing from nothing. */
  from = 0.14,
}: {
  children: string;
  className?: string;
  as?: "p" | "h1" | "h2" | "h3";
  from?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const words = children.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-word]",
          { opacity: from },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.4,
            scrollTrigger: {
              trigger: el,
              // Starts as the line enters the lower half and completes before
              // it leaves the upper third, so the cascade happens while the
              // text is comfortably in view rather than at the screen edges.
              start: "top 85%",
              end: "bottom 45%",
              scrub: 0.6,
            },
          }
        );
      }, ref);
      return () => ctx.revert();
    });

    // Reduced motion: no travelling gradient, just the finished line.
    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        gsap.set("[data-word]", { opacity: 1 });
      }, ref);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [from, children]);

  return (
    <Tag ref={ref as never} className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} data-word className="inline-block">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
