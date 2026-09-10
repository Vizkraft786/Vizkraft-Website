import { site } from "@/lib/site-config";

/**
 * Footer, built to the supplied reference: a mark, a two-line statement set
 * against link columns, and an oversized wordmark bleeding off the bottom edge
 * with a © badge on its right.
 *
 * The wordmark is plain Gotham Thin (weight 100) with no outline. Bold was the
 * original ask, but only the Thin cut was supplied. A text-stroke was tried as
 * a stand-in and removed on request, so the word now shows the real
 * letterforms unaltered. Once the full Gotham family is licensed, register
 * Bold in layout.tsx and set font-bold here; do not reintroduce the stroke.
 */

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink px-6 pt-24 md:px-10 md:pt-32">
      <div className="mx-auto max-w-[1600px]">
        {/* Mark — the four-dot glyph the reference sets above its statement. */}
        <div
          aria-hidden="true"
          className="mb-8 grid w-3 grid-cols-2 gap-[3px] opacity-60"
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-1 w-1 rounded-full bg-stone" />
          ))}
        </div>

        {/*
          Statement left, link columns right — the reference sets them on one
          band rather than stacking, which is what keeps the columns reading as
          navigation instead of as a continuation of the sentence.
        */}
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <p className="max-w-sm text-lg leading-snug text-white3 md:text-xl">
            Vizkraft is where your building
            <br />
            is seen before it is built.
          </p>

          {/*
            Three columns, every destination real.

            The reference's LEGAL column (Privacy Policy, Terms & Conditions)
            is deliberately not reproduced: those pages do not exist, and links
            that 404 are worse than an absent column. Add it back alongside the
            pages themselves.
          */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:justify-items-end">
            <div>
              <p className="mb-4 text-[9px] uppercase tracking-wide2 text-stone/40 max-md:text-[10px] max-md:text-stone/60">
                Studio
              </p>
              <ul className="space-y-2 text-xs text-stone/70 max-md:space-y-3 max-md:text-[13px]">
                <li>
                  <a href="#work" className="transition-colors hover:text-white3">
                    Work
                  </a>
                </li>
                <li>
                  <a href="#team" className="transition-colors hover:text-white3">
                    Team
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[9px] uppercase tracking-wide2 text-stone/40 max-md:text-[10px] max-md:text-stone/60">
                Contact
              </p>
              <ul className="space-y-2 text-xs text-stone/70 max-md:space-y-3 max-md:text-[13px]">
                <li>
                  <a
                    href={site.contact.gmailCompose}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white3"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href={site.contact.phoneHref}
                    className="transition-colors hover:text-white3"
                  >
                    Call
                  </a>
                </li>
                <li>
                  <a
                    href={site.contact.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white3"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[9px] uppercase tracking-wide2 text-stone/40 max-md:text-[10px] max-md:text-stone/60">
                Follow
              </p>
              <ul className="space-y-2 text-xs text-stone/70 max-md:space-y-3 max-md:text-[13px]">
                <li>
                  <a
                    href={site.contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white3"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/*
          The oversized wordmark, bled off the bottom edge as the reference
          does. leading-[0.72] plus the section's overflow-hidden is what clips
          it: the line box is shorter than the glyphs, so the baseline sits
          below the section's edge and the letters are cut rather than scaled.

          Muted rather than white — at this size full-strength white would
          outweigh everything above it and stop reading as a footer mark.
        */}
        <div className="relative mt-20 flex items-end justify-between gap-4 md:mt-28">
          <h2
            className="mb-[-0.1em] select-none font-sans text-[clamp(3.5rem,19vw,20rem)] leading-[0.72] tracking-[-0.03em] text-stone/30 max-md:text-[14.5vw]"
          >
            {site.name}
          </h2>

          {/* © badge, sat on the wordmark's right as in the reference. */}
          {/*
            Below md the wordmark drops from 19vw to 14.5vw: at 19vw the word
            alone filled a phone's width and pushed this badge off the right
            edge. 14.5vw leaves room for it down to a 320px screen.
          */}
          <span className="mb-[3vw] flex h-[4vw] max-h-14 min-h-8 w-[4vw] min-w-8 max-w-14 shrink-0 items-center justify-center rounded-full border border-stone/30 text-[1.4vw] text-stone/50 max-md:text-xs">
            ©
          </span>
        </div>

        <p className="sr-only">
          &copy; {new Date().getFullYear()} {site.name}. {site.tagline}.
        </p>
      </div>
    </footer>
  );
}
