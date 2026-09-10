import type { ReactNode } from "react";

/**
 * The capsule CTA from the reference: a light pill carrying the label, with a
 * dark circular badge holding an up-right arrow pinned to its trailing edge.
 *
 * Extracted rather than inlined because it appears in two places already (the
 * nav and the hero's brand moment) and the brief anticipates more — the arrow
 * badge in particular is fiddly enough (fixed square, centred, its own radius)
 * that a second hand-written copy would drift from the first.
 *
 * The badge is a span rather than an SVG-only child so the circle stays a
 * perfect circle regardless of the label's line-height, which is what breaks
 * first when this kind of button is rebuilt ad hoc.
 */
export default function PillButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex shrink-0 items-center gap-3 rounded-full bg-white3 py-1 pl-5 pr-1 text-ink transition-opacity duration-300 hover:opacity-85 ${className}`}
    >
      <span className="whitespace-nowrap text-[13px] font-thin leading-none">
        {children}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white3">
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.75M8.5 3.5v3.75" />
        </svg>
      </span>
    </a>
  );
}
