import { site } from "@/lib/site-config";
import ScrollRevealText from "./ScrollRevealText";

export default function Contact() {
  return (
    <section
      id="contact"
      className="grain border-t border-ink/10 bg-stone px-6 py-28 md:px-10 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        <p className="mb-8 text-[10px] uppercase tracking-wide2 text-ink/50">
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
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50">
              Email
            </p>
            <a
              href={`mailto:${site.contact.email}`}
              className="font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              {site.contact.email}
            </a>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50">
              WhatsApp
            </p>
            <a
              href={site.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              {site.contact.phone}
            </a>
          </div>

          <div>
            <p className="mb-3 text-[10px] uppercase tracking-wide2 text-ink/50">
              Instagram
            </p>
            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xl font-light text-ink/75 transition-colors hover:text-ink"
            >
              @vizzkraft
            </a>
          </div>
        </div>

        <footer className="mt-24 flex flex-col gap-4 border-t border-ink/10 pt-8 text-[10px] uppercase tracking-wide2 text-ink/50 md:flex-row md:items-center md:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {site.name}
          </span>
          <span>{site.tagline}</span>
        </footer>
      </div>
    </section>
  );
}
