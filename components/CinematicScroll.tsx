"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, sequence } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * The cinematic scroll sequence.
 *
 * A pinned full-viewport canvas plays a 240-frame camera move scrubbed by
 * scroll position: a clay study model resolves into a laptop screen, then the
 * camera pulls back to reveal the interior it sits in.
 *
 * Text beats are layered over the sequence and keyed to scroll progress.
 * Frames finish at FRAME_END so the final interior holds still beneath the
 * services copy instead of moving under it.
 */

const FRAME_END = 0.72;

export default function CinematicScroll() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef({ i: 0 });

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  /* ---------------------------------------------------------- preload --- */
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;

    const images: HTMLImageElement[] = new Array(sequence.frameCount);

    for (let i = 0; i < sequence.frameCount; i++) {
      const img = new Image();
      img.src = sequence.path(i);
      img.decoding = "async";
      img.onload = img.onerror = () => {
        if (cancelled) return;
        loaded++;
        setProgress(loaded / sequence.frameCount);
        if (loaded === sequence.frameCount) setReady(true);
      };
      images[i] = img;
    }

    imagesRef.current = images;
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------- draw --- */
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    /**
     * Cover-fit: fill the viewport, crop the overflow, never letterbox.
     *
     * Falls back to the nearest already-decoded neighbour rather than
     * returning early — bailing out would leave the canvas on whatever was
     * last painted, or blank right after a resize cleared it.
     */
    const draw = () => {
      const frames = imagesRef.current;
      const usable = (im?: HTMLImageElement) =>
        !!im && im.complete && im.naturalWidth > 0;

      let img = frames[frameRef.current.i];
      if (!usable(img)) {
        for (let d = 1; d < frames.length; d++) {
          const prev = frames[frameRef.current.i - d];
          const next = frames[frameRef.current.i + d];
          if (usable(prev)) {
            img = prev;
            break;
          }
          if (usable(next)) {
            img = next;
            break;
          }
        }
      }
      if (!usable(img)) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;

      ctx.fillStyle = "#131313";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    /**
     * Assigning canvas.width/height wipes the backing store, so every resize
     * must repaint or the canvas flashes black. Debounced because resize fires
     * in bursts, and repainted on the next frame as well as synchronously to
     * cover the case where the browser composites before our draw lands.
     */
    let resizeTimer: number | undefined;
    const applySize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      draw();
      requestAnimationFrame(draw);
    };

    const resize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(applySize, 120);
      // Repaint immediately at the old size too, so the gap before the
      // debounced resize lands never shows an empty canvas.
      draw();
    };

    applySize();
    window.addEventListener("resize", resize);

    // No `scrub` here: it only applies to a linked animation, and this trigger
    // drives a canvas draw by hand. Lenis already smooths the scroll position
    // this reads from, so the frame stepping inherits that easing.
    const st = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = Math.min(self.progress / FRAME_END, 1);
        const next = Math.round(p * (sequence.frameCount - 1));
        if (next !== frameRef.current.i) {
          frameRef.current.i = next;
          requestAnimationFrame(draw);
        }
      },
    });

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      st.kill();
    };
  }, [ready]);

  /* ------------------------------------------------------- text beats --- */
  useEffect(() => {
    if (!ready) return;

    const mm = gsap.matchMedia();

    /* ---- Full motion -------------------------------------------------- */
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)" },
      () => {
        const ctx = gsap.context(() => {
          const lines = (b: string) => `[data-beat='${b}'] [data-anim]`;
          const display = (b: string) => `[data-beat='${b}'] [data-anim='display']`;
          const plain = (b: string) =>
            `[data-beat='${b}'] [data-anim]:not([data-anim='display'])`;

          /**
           * Rest state for a beat's contents.
           *
           * Display type is masked rather than translated far: large type
           * covering distance reads as bouncy, so it rises 6px behind a
           * bottom-up clip wipe while the smaller supporting lines carry the
           * actual travel. That difference in treatment is what separates an
           * editorial reveal from a uniform fade-up of the whole block.
           */
          const arm = (b: string) => {
            gsap.set(display(b), {
              opacity: 0,
              y: 6,
              clipPath: "inset(100% 0% 0% 0%)",
            });
            gsap.set(plain(b), { opacity: 0, y: 14 });
          };

          /**
           * Every beat is a PAUSED timeline with no ScrollTrigger of its own,
           * driven by the single controller below.
           *
           * The previous design gave each beat its own scrubbed trigger, which
           * made correctness depend on per-beat callbacks firing in order. They
           * don't survive large jump-scrolls: beats froze mid-tween and stacked
           * on screen (three visible at once, and one lit ~850px before its
           * range began). Setting progress explicitly is total — a beat outside
           * its window is pinned to 0 or 1, so overlap cannot occur.
           */
          const timelines: { tl: gsap.core.Timeline; start: number; end: number }[] = [];

          const beat = (b: string, start: number, end: number) => {
            arm(b);

            const tl = gsap.timeline({ paused: true });
            timelines.push({ tl, start, end });

            tl.to(display(b), {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1,
              ease: "power4.out",
            })
              .to(
                plain(b),
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.9,
                  ease: "power4.out",
                  stagger: 0.12,
                },
                0.08
              )
              .to(lines(b), { opacity: 1, duration: 1.3 })
              // Leaves the way the camera is travelling — upward and past.
              // Shorter travel out than in, so it clears without lurching.
              .to(lines(b), {
                opacity: 0,
                y: -12,
                duration: 0.9,
                ease: "power2.out",
                stagger: 0.06,
              });
          };

          /**
           * The hero is the exception: it must be legible the moment the
           * loader clears, so it arrives on a real (time-based) timeline
           * rather than waiting for scroll. Its scroll trigger is created
           * afterwards and only handles the exit.
           */
          arm("hero");

          // Hero exit only — progress 0 is the fully-arrived state left by the
          // entrance below, so the controller can drive it like any other beat.
          const heroExit = gsap.timeline({ paused: true });
          heroExit
            .to(lines("hero"), { opacity: 1, duration: 1.2 })
            .to(lines("hero"), {
              opacity: 0,
              y: -12,
              duration: 1,
              ease: "power2.out",
              stagger: 0.06,
            });

          gsap
            .timeline({
              onComplete: () => {
                timelines.push({ tl: heroExit, start: 0, end: 0.2 });
              },
            })
            .to(display("hero"), {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: "power4.out",
            })
            .to(
              plain("hero"),
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power4.out",
                stagger: 0.09,
              },
              0.15
            );

          beat("reveal", 0.2, 0.42);
          beat("interior", 0.44, 0.62);

          site.services.forEach((_, i) => {
            const span = 0.36 / site.services.length;
            beat(`service-${i}`, 0.62 + i * span, 0.62 + (i + 1) * span);
          });

          /**
           * The single controller. Maps overall scroll progress onto each
           * beat's local progress and writes it directly, so state is a pure
           * function of scroll position rather than of tween history.
           */
          ScrollTrigger.create({
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
              const p = self.progress;
              for (const { tl, start, end } of timelines) {
                const local = gsap.utils.clamp(0, 1, (p - start) / (end - start));
                if (tl.progress() !== local) tl.progress(local);
              }
            },
          });
        }, rootRef);

        return () => ctx.revert();
      }
    );

    /* ---- Reduced motion ------------------------------------------------
     * Fewer and gentler, not none: the beats still need to swap or they'd
     * stack on top of each other, so opacity is kept and every transform
     * and clip reveal is dropped.
     */
    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        const fade = (b: string, start: number, end: number, lead = false) => {
          const sel = `[data-beat='${b}'] [data-anim]`;
          gsap.set(sel, { opacity: lead ? 1 : 0, y: 0, clipPath: "none" });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: rootRef.current,
              start: `${start * 100}% top`,
              end: `${end * 100}% top`,
              scrub: 0.8,
            },
          });

          if (!lead) tl.to(sel, { opacity: 1, duration: 1 });
          tl.to(sel, { opacity: 1, duration: 1.3 }).to(sel, {
            opacity: 0,
            duration: 1,
          });
        };

        fade("hero", 0, 0.2, true);
        fade("reveal", 0.2, 0.42);
        fade("interior", 0.44, 0.62);
        site.services.forEach((_, i) => {
          const span = 0.36 / site.services.length;
          fade(`service-${i}`, 0.62 + i * span, 0.62 + (i + 1) * span);
        });
      }, rootRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [ready]);

  return (
    <div ref={rootRef} className="relative h-[700vh]">
      {/* Loading veil */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink transition-opacity duration-1000"
        style={{
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : "auto",
        }}
      >
        <div className="text-center">
          <div className="font-display text-[13vw] leading-none text-bone/90 md:text-[7vw]">
            {Math.round(progress * 100)}
          </div>
          <div className="mt-6 text-[10px] uppercase tracking-brand text-stone">
            {site.name}
          </div>
        </div>
      </div>

      {/* Pinned stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {/* Legibility gradients — kept subtle so the render stays the hero */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/45 via-transparent to-ink/60" />

        {/* ---- Beat 1: hero ---- */}
        <div
          data-beat="hero"
          className="pointer-events-none absolute inset-0 flex w-full flex-col items-center justify-center overflow-hidden px-6 text-center"
        >
          <p
            data-anim
            className="mb-6 max-w-full text-[9px] uppercase tracking-wide2 text-bone/70 md:text-[11px]"
          >
            {site.beats.hero.eyebrow}
          </p>
          {/*
            Sized against the tracking, not independently of it: at 0.28em
            letter-spacing an 8-character word runs ~6.6x the font size, so
            anything past ~11vw pushes the wordmark wider than the viewport
            and drags the whole centred stack off-axis with it.
            The trailing -mr offsets the space after the final letter so the
            word sits optically centred rather than pulled left.
          */}
          <h1
            data-anim="display"
            className="-mr-[0.28em] max-w-full font-display text-[clamp(2.75rem,11vw,9.5rem)] font-light leading-[0.95] tracking-[0.28em] text-bone"
          >
            {site.beats.hero.title}
          </h1>
          <p
            data-anim
            className="mt-8 font-display text-2xl font-light italic text-bone/85 md:text-4xl"
          >
            {site.beats.hero.subtitle}
          </p>
          <div
            data-anim
            className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-wide2 text-bone/55"
          >
            {site.positioning.map((p, i) => (
              <span key={p} className="flex items-center gap-3">
                {i > 0 && <span className="h-px w-6 bg-bone/30" />}
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Beat 2: the reveal ---- */}
        <div
          data-beat="reveal"
          className="pointer-events-none absolute inset-0 flex items-end justify-center px-6 pb-[18vh]"
        >
          <p
            data-anim="display"
            className="max-w-2xl text-center font-display text-3xl font-light leading-snug text-bone md:text-5xl"
          >
            {site.beats.reveal.line}
          </p>
        </div>

        {/* ---- Beat 3: into the space ---- */}
        <div
          data-beat="interior"
          className="pointer-events-none absolute inset-0 flex items-end justify-center px-6 pb-[18vh]"
        >
          <p
            data-anim="display"
            className="max-w-3xl text-center font-display text-3xl font-light leading-snug text-bone md:text-5xl"
          >
            {site.beats.interior.line}
          </p>
        </div>

        {/* ---- Beats 4+: services ---- */}
        {site.services.map((s, i) => (
          <div
            key={s.index}
            data-beat={`service-${i}`}
            className="pointer-events-none absolute inset-0 flex items-center px-8 md:px-[10vw]"
          >
            <div className="max-w-xl">
              <span data-anim className="font-display text-sm text-ember">
                {s.index}
              </span>
              <h2
                data-anim="display"
                className="mt-3 font-display text-4xl font-light leading-tight text-bone md:text-6xl"
              >
                {s.title}
              </h2>
              <p
                data-anim
                className="mt-5 max-w-md text-sm font-light leading-relaxed text-bone/75 md:text-base"
              >
                {s.body}
              </p>
            </div>
          </div>
        ))}

        {/* Scroll hint — only while the hero beat is on screen */}
        <div
          data-beat="hero"
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <span
            data-anim
            className="text-[9px] uppercase tracking-brand text-bone/50"
          >
            Scroll
          </span>
        </div>
      </div>
    </div>
  );
}
