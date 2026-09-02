import SmoothScroll from "@/components/SmoothScroll";
import ScrollRevealText from "@/components/ScrollRevealText";
import FramedCinematic from "@/components/v2/FramedCinematic";
import ProjectsV2 from "@/components/v2/ProjectsV2";
import { site } from "@/lib/site-config";

/**
 * v2 — the light editorial direction.
 *
 * Same content and same frame sequence as v1; the difference is presentation.
 * Where v1 is a dark, full-bleed, immersive cinematic, this frames the render
 * in an inset card on a light ground, keeps copy outside the image, and uses
 * pill controls and a lavender accent. Built as a route rather than a branch so
 * both can be opened side by side.
 */
export const metadata = {
  title: `${site.name} — ${site.discipline} (v2)`,
};

export default function V2() {
  return (
    <main className="min-h-screen bg-paper text-graphite">
      <SmoothScroll />

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40">
        <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <a
            href="#top"
            className="rounded-full bg-card/80 px-4 py-2 text-[11px] uppercase tracking-brand text-graphite backdrop-blur"
          >
            {site.name}
          </a>
          <div className="flex items-center gap-2">
            <a
              href="#work"
              className="rounded-full bg-card/80 px-4 py-2 text-[10px] uppercase tracking-wide2 text-graphite backdrop-blur transition-colors hover:bg-card"
            >
              Work
            </a>
            <a
              href="#contact"
              className="rounded-full bg-graphite px-4 py-2 text-[10px] uppercase tracking-wide2 text-card transition-opacity hover:opacity-85"
            >
              Get in touch
            </a>
          </div>
        </nav>
      </header>

      {/* Hero — type first, on the page ground rather than over an image */}
      <section id="top" className="px-6 pb-16 pt-32 md:px-10 md:pb-24 md:pt-40">
        <div className="mx-auto max-w-[1500px]">
          <p className="mb-6 text-[10px] uppercase tracking-wide2 text-mist">
            {site.beats.hero.eyebrow}
          </p>
          <h1 className="max-w-5xl font-display text-[13vw] font-light leading-[0.92] tracking-tight text-graphite md:text-[7.5vw]">
            {site.tagline}
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            {site.positioning.map((p) => (
              <span
                key={p}
                className="rounded-full border border-graphite/15 px-4 py-2 text-[10px] uppercase tracking-wide2 text-graphite"
              >
                {p}
              </span>
            ))}
            <span className="rounded-full bg-lilacSoft px-4 py-2 text-[10px] uppercase tracking-wide2 text-graphite">
              {site.location}
            </span>
          </div>
        </div>
      </section>

      <FramedCinematic />

      {/* Services — oversized numerals, editorial rows */}
      <section className="px-4 py-24 md:px-8 md:py-36">
        <div className="mx-auto max-w-[1500px] rounded-[22px] bg-card p-6 md:rounded-[28px] md:p-12">
          <h2 className="mb-12 font-display text-4xl font-light text-graphite md:text-6xl">
            What we do
          </h2>
          <ul className="divide-y divide-graphite/10">
            {site.services.map((s) => (
              <li
                key={s.index}
                className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[7rem_1fr_1.2fr] md:gap-10"
              >
                <span className="font-display text-4xl font-light leading-none text-lilac md:text-6xl">
                  {s.index}
                </span>
                <h3 className="font-display text-2xl font-light leading-tight text-graphite md:text-3xl">
                  {s.title}
                </h3>
                <p className="max-w-xl text-sm font-light leading-relaxed text-mist md:text-base">
                  {s.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProjectsV2 />

      {/* Contact */}
      <section id="contact" className="px-4 pb-24 md:px-8 md:pb-36">
        <div className="mx-auto max-w-[1500px] rounded-[22px] bg-graphite p-8 md:rounded-[28px] md:p-16">
          <ScrollRevealText
            as="h2"
            className="max-w-4xl font-display text-4xl font-light leading-[1.05] text-card md:text-7xl"
          >
            Let’s visualize your next project.
          </ScrollRevealText>

          <div className="mt-14 grid gap-10 border-t border-card/15 pt-10 md:grid-cols-3">
            {[
              { label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
              { label: "WhatsApp", value: site.contact.phone, href: site.contact.whatsapp },
              { label: "Instagram", value: "@vizzkraft", href: site.contact.instagram },
            ].map((c) => (
              <div key={c.label}>
                <p className="mb-3 text-[10px] uppercase tracking-wide2 text-mist">
                  {c.label}
                </p>
                <a
                  href={c.href}
                  className="font-display text-xl font-light text-card transition-colors hover:text-lilac md:text-2xl"
                >
                  {c.value}
                </a>
              </div>
            ))}
          </div>

          <footer className="mt-20 flex flex-col gap-3 border-t border-card/15 pt-8 text-[10px] uppercase tracking-wide2 text-mist md:flex-row md:justify-between">
            <span>
              &copy; {new Date().getFullYear()} {site.name}
            </span>
            <span>{site.tagline}</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
