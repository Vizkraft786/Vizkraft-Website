import { site } from "@/lib/site-config";

/**
 * Infinite horizontal ticker of capability words, separated by a small mark —
 * the band the MYDNA reference runs between sections.
 *
 * Driven by a CSS animation rather than GSAP on purpose: this is predetermined,
 * never-ending motion, and CSS animation runs off the main thread. That matters
 * here specifically, because this page decodes 120 sequence frames on load and
 * a JS-driven marquee would visibly stutter through it.
 *
 * The list is rendered twice and translated by exactly -50%, so the second copy
 * lands where the first began and the loop has no seam.
 */
export default function Marquee() {
  const items = [
    ...site.services.map((s) => s.title),
    ...site.positioning,
  ];

  const Row = ({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) => (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-16 md:pr-16"
    >
      {items.map((label, i) => (
        <li key={`${label}-${i}`} className="flex shrink-0 items-center gap-10 md:gap-16">
          <span className="whitespace-nowrap font-display text-2xl font-light uppercase tracking-wide2 text-bone/85 md:text-4xl">
            {label}
          </span>
          <span aria-hidden className="text-lg text-acid">
            &#8853;
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label="Capabilities"
      className="marquee overflow-hidden border-y border-bone/10 bg-ink py-7 md:py-9"
    >
      <div className="marquee__track flex w-max">
        <Row />
        <Row aria-hidden />
      </div>
    </section>
  );
}
