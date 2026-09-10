import { site } from "@/lib/site-config";
import ScrollRevealText from "./ScrollRevealText";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative grain border-t border-ink/10 bg-stone px-6 py-28 md:px-10 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-8 text-[10px] uppercase tracking-wide2 text-ink/50 max-md:text-[11px] max-md:text-ink/65">
          {site.location}
        </p>

        <ScrollRevealText
          as="h2"
          className="max-w-4xl font-display text-5xl font-light leading-[1.05] text-ink md:text-8xl"
        >
          Let’s visualize your next project.
        </ScrollRevealText>

        <div className="mt-16 grid gap-12 border-t border-ink/10 pt-12 md:grid-cols-3">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50 max-md:text-[11px] max-md:text-ink/65">
              Email
            </p>
            {/*
              Opens a Gmail compose window with the draft already written (see
              gmailCompose in site-config for why it is not mailto:).
              break-all lets the long address wrap on a phone instead of
              pushing the column wider than the screen.
            */}
            <a
              href={site.contact.gmailCompose}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              {site.contact.email}
            </a>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50 max-md:text-[11px] max-md:text-ink/65">
              Phone
            </p>
            <a
              href={site.contact.phoneHref}
              className="font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              {site.contact.phone}
            </a>
            <a
              href={site.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-xs text-ink/50 transition-colors hover:text-ink max-md:text-[13px] max-md:text-ink/65"
            >
              Message on WhatsApp
            </a>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50 max-md:text-[11px] max-md:text-ink/65">
              Instagram
            </p>
            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              {site.contact.instagramHandle}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
