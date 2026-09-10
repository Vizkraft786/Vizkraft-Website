import { site } from "@/lib/site-config";
import PillButton from "./PillButton";

/**
 * The team section.
 *
 * Layout: a small counted eyebrow and a two-line display heading, then one row
 * split in half — two portrait cards on the left, the supporting paragraph on
 * the right. The paragraph used to sit beside the heading with four cards
 * underneath; with the team cut to two, it moved down into the space the two
 * dropped cards left, so the row stays balanced instead of ending half empty.
 *
 * Inverted against the rest of the page: ink ground, off-white type. Every
 * other static section sits on a light ground, so this one reads as a distinct
 * chapter between the archive and the closing frame.
 *
 * Names, roles and portraits all come from `site.team`; changing the team
 * needs no change here, only in site-config. A member without a photo shows
 * the blank white plate.
 */
export default function Team() {
  return (
    <section
      id="team"
      className="relative bg-ink px-6 py-28 md:px-10 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        {/*
          Eyebrow carries the count as a superscript. Read from the array rather
          than typed, so it cannot fall out of step with the number of cards.
        */}
        <p className="mb-6 text-[10px] uppercase tracking-wide2 text-stone/50 max-md:text-[11px] max-md:text-stone/65">
          Our Team
          <sup className="ml-1 text-[8px] max-md:text-[9px]">({site.team.length})</sup>
        </p>

        <h2 className="max-w-xl font-display text-4xl font-light leading-[1.1] text-white3 md:text-6xl">
          The people behind the renders
        </h2>

        {/*
          A four-column grid, same as the old four-card row: the cards take the
          left two columns and the paragraph the right two. Keeping the four
          columns means each card is exactly the width it was before, rather
          than two cards stretching to fill the whole row.

          The paragraph starts on column three, where the third card used to
          begin, so its left edge sits on the grid instead of floating, and it
          is centred vertically against the cards so it reads as their
          counterpart. Below lg it simply follows the cards.
        */}
        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 md:mt-24 lg:grid-cols-4">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-2">
            {site.team.map((member) => (
              <li key={member.id}>
                {/*
                  Portrait plate, fixed at 3:4 so a photo drops in without the
                  row reflowing. With a photo it fills the plate: object-cover
                  crops any difference in proportion, anchored to the top so a
                  face is never the part cut off. Without one, the plate stays
                  blank white.
                */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[3px] bg-white3">
                  {member.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo}
                      alt={`${member.name}, ${member.role}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  )}
                </div>

                <p className="mt-5 text-[10px] uppercase tracking-wide2 text-stone/50 max-md:text-[11px] max-md:text-stone/65">
                  {member.role}
                </p>
                <p className="mt-2 font-display text-2xl font-light leading-tight text-white3">
                  {member.name}
                </p>

                {/*
                  Points at the contact section rather than a per-person
                  address: no individual contact details exist yet.
                */}
                <PillButton href="#contact" className="mt-5">
                  Talk With Us
                </PillButton>
              </li>
            ))}
          </ul>

          <p className="max-w-md text-sm leading-relaxed text-stone/70 lg:col-span-2 lg:self-center">
            {site.discipline} is a craft of light, material and patience. Our
            team brings architectural training and cinematic technique to every
            frame, so a drawing becomes a place long before it is built.
          </p>
        </div>
      </div>
    </section>
  );
}
