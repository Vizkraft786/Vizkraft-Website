"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site-config";

/**
 * Minimal persistent nav. Deliberately understated during the cinematic so it
 * never competes with the render, then gains a backdrop once past it.
 *
 * Text is ink at all times, transparent or solid — the cinematic beneath it
 * now carries dark text over a light wash rather than the other way round, so
 * a light-nav/dark-nav split by scroll position isn't needed any more; ink
 * reads correctly against both states.
 */
export default function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 6.4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        solid ? "grain bg-stone/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-6 md:px-10">
        <a
          href="#top"
          className="text-[11px] uppercase tracking-brand text-ink/90 transition-opacity hover:opacity-70"
        >
          {site.name}
        </a>

        <div className="flex items-center gap-8">
          <a
            href="#work"
            className="hidden text-[10px] uppercase tracking-wide2 text-ink/60 transition-colors hover:text-ink md:block"
          >
            Work
          </a>
          <a
            href="#contact"
            className="text-[10px] uppercase tracking-wide2 text-ink/60 transition-colors hover:text-ink"
          >
            Contact
          </a>
        </div>
      </nav>
    </header>
  );
}
