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

/**
 * How many frames must decode before the hero is shown.
 *
 * This used to wait for all 120 (~9MB), which held a loading counter on screen
 * for ~26 seconds on a cold cache — long enough to be indistinguishable from a
 * broken page. Only the opening frames are needed to paint frame 0; the rest
 * stream in while the visitor is reading the hero, and draw() already falls
 * back to the nearest decoded neighbour if scrolling outruns the download.
 */
const FRAMES_BEFORE_READY = 12;

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
        if (loaded >= FRAMES_BEFORE_READY) setReady(true);
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

      ctx.fillStyle = "#FFFFF7";
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
           * The liquid-glass panel wrapping each beat's text. A distinct
           * attribute rather than reusing data-anim, so its animation is
           * fully additive — nothing about the existing display/plain
           * treatment changes, this just also fades/offsets the glass panel
           * in sync with them.
           */
          const glass = (b: string) => `[data-beat='${b}'] [data-glass]`;

          /**
           * Rest state for a beat's contents.
           *
           * Display type is masked rather than translated far: large type
           * covering distance reads as bouncy, so it rises 6px behind a
           * bottom-up clip wipe while the smaller supporting lines carry the
           * actual travel. That difference in treatment is what separates an
           * editorial reveal from a uniform fade-up of the whole block.
           *
           * `x` is new: services enter from the side they're anchored to
           * (left services drift in from -30px, right from +30px) instead of
           * rising from below, so the alternating placement reads as lateral
           * movement rather than the same vertical entrance repeated on
           * alternating sides of the screen.
           */
          const arm = (b: string, x = 0) => {
            gsap.set(display(b), {
              opacity: 0,
              y: 6,
              x,
              clipPath: "inset(100% 0% 0% 0%)",
            });
            gsap.set(plain(b), { opacity: 0, y: 14, x });
            // Glass arrives from the same side as its text, on a shorter
            // vertical rise — a panel materialising reads better as a subtle
            // settle than a full 14px slide.
            gsap.set(glass(b), { opacity: 0, y: 10, x });
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

          /**
           * `x` drives the lateral entrance for alternating service placement;
           * every other beat omits it and gets the original vertical-only
           * treatment. Exit continues a few px further in the same horizontal
           * direction it entered from (not back toward centre), so a
           * left-placed beat keeps drifting left as it fades — reinforcing
           * which side it belongs to rather than snapping back through centre.
           */
          const beat = (b: string, start: number, end: number, x = 0) => {
            arm(b, x);

            const tl = gsap.timeline({ paused: true });
            timelines.push({ tl, start, end });

            const exitX = x === 0 ? 0 : x > 0 ? 14 : -14;

            tl.to(
              glass(b),
              { opacity: 1, y: 0, x: 0, duration: 0.9, ease: "power3.out" },
              0
            )
              .to(
                display(b),
                {
                  opacity: 1,
                  y: 0,
                  x: 0,
                  clipPath: "inset(0% 0% 0% 0%)",
                  duration: 1,
                  ease: "power4.out",
                },
                0
              )
              .to(
                plain(b),
                {
                  opacity: 1,
                  y: 0,
                  x: 0,
                  duration: 0.9,
                  ease: "power4.out",
                  stagger: 0.12,
                },
                0.08
              )
              .to(lines(b), { opacity: 1, duration: 1.3 })
              // Leaves the way the camera is travelling — upward and past,
              // plus a small continuation of x for services (0 for everything
              // else, so this is a no-op there). Glass exits in lockstep,
              // "<" pinning it to the same start as the text's own exit.
              .to(lines(b), {
                opacity: 0,
                y: -12,
                x: exitX,
                duration: 0.9,
                ease: "power2.out",
                stagger: 0.06,
              })
              .to(
                glass(b),
                { opacity: 0, y: -8, x: exitX, duration: 0.9, ease: "power2.out" },
                "<"
              );
          };

          /**
           * The brand moment (wordmark + eyebrow) is the exception: it must
           * be legible the instant the loader clears, so it arrives on a real
           * (time-based) timeline rather than waiting for scroll. Its scroll
           * trigger is created afterwards and only handles the exit — every
           * other moment, including the tagline right after it, is a normal
           * scroll-driven beat().
           */
          arm("brand");

          const brandExit = gsap.timeline({ paused: true });
          brandExit
            .to(lines("brand"), { opacity: 1, duration: 1.2 })
            .to(lines("brand"), {
              opacity: 0,
              y: -12,
              duration: 1,
              ease: "power2.out",
              stagger: 0.06,
            })
            .to(glass("brand"), { opacity: 0, y: -8, duration: 1, ease: "power2.out" }, "<");

          gsap
            .timeline({
              onComplete: () => {
                timelines.push({ tl: brandExit, start: 0, end: 0.06 });
              },
            })
            .to(glass("brand"), { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0)
            .to(
              display("brand"),
              {
                opacity: 1,
                y: 0,
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.1,
                ease: "power4.out",
              },
              0
            )
            .to(
              plain("brand"),
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power4.out",
                stagger: 0.09,
              },
              0.15
            );

          /**
           * Opening sequence: brand (above) -> tagline -> purpose, each its
           * own moment rather than one stacked block. Only the tagline stays
           * centred with the brand mark — purpose and everything after moves
           * to the left third, which is the default this whole sequence
           * otherwise follows.
           */
          beat("tagline", 0.06, 0.13);
          beat("purpose", 0.13, 0.2);

          beat("reveal", 0.2, 0.4);
          beat("interior", 0.42, 0.6);

          /**
           * Services alternate left/right by index parity — even indices sit
           * left third, odd sit right third — entering with the matching
           * lateral motion above (-30 for left, +30 for right).
           */
          const serviceSpan = 0.3 / site.services.length;
          site.services.forEach((_, i) => {
            const start = 0.62 + i * serviceSpan;
            beat(`service-${i}`, start, start + serviceSpan, i % 2 === 0 ? -30 : 30);
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
     * and clip reveal is dropped — including the services' horizontal
     * entrance, which is motion the same way the vertical entrance is.
     */
    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        const fade = (b: string, start: number, end: number, lead = false) => {
          // Glass panels fold into the same selector — reduced motion means
          // a simpler opacity-only fade for everything in the beat, glass
          // included, rather than glass getting its own separate treatment.
          const sel = `[data-beat='${b}'] [data-anim], [data-beat='${b}'] [data-glass]`;
          gsap.set(sel, { opacity: lead ? 1 : 0, y: 0, x: 0, clipPath: "none" });

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

        fade("brand", 0, 0.06, true);
        fade("tagline", 0.06, 0.13);
        fade("purpose", 0.13, 0.2);
        fade("reveal", 0.2, 0.4);
        fade("interior", 0.42, 0.6);

        const serviceSpan = 0.3 / site.services.length;
        site.services.forEach((_, i) => {
          const start = 0.62 + i * serviceSpan;
          fade(`service-${i}`, start, start + serviceSpan);
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
        className="grain fixed inset-0 z-50 flex items-center justify-center bg-stone transition-opacity duration-1000"
        style={{
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : "auto",
        }}
      >
        <div className="text-center">
          <div className="font-display text-[13vw] leading-none text-ink/90 md:text-[7vw]">
            {Math.round(progress * 100)}
          </div>
          <div className="mt-6 text-[10px] uppercase tracking-brand text-ink/50">
            {site.name}
          </div>
        </div>
      </div>

      {/* Pinned stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {/*
          Legibility wash — light, not dark, because the beat text is now ink
          (dark) rather than white. A dark text needs a LIGHT cushion under it,
          same as the old white text needed a dark one; the mechanism is
          identical, just inverted. The renders are naturally light-toned
          (clay model, bright interiors) so this also does far less work than
          the old dark version did, which is exactly the point — less black
          wash across the page's largest section.
        */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white3/40 via-transparent to-white3/50" />

        {/*
          ---- Moment 1: brand ----
          The one deliberately centred title-card moment — a brand-mark
          reveal earns it the way the tagline right after earns its own
          exception. Everything from here on defaults to the left third.
        */}
        <div
          data-beat="brand"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-6 text-center"
        >
          <div
            data-glass
            className="liquid-glass liquid-glass--primary flex flex-col items-center"
          >
            <p
              data-anim
              className="mb-6 max-w-full text-[9px] uppercase tracking-wide2 text-ink/70 md:text-[11px]"
            >
              {site.beats.hero.eyebrow}
            </p>
            {/*
              Anton is a condensed, already-heavy face — wide luxury tracking
              (the old 0.28em) fights that density instead of complementing
              it, so this drops to a near-normal value that lets the
              condensed letterforms read as themselves rather than being
              stretched apart. The old -mr optical-centring hack is gone too;
              it only existed to compensate for that wide spacing's trailing
              gap, which no longer exists at this value.

              This is the ONLY text on the page allowed at this scale — every
              other headline-tier element (tagline, service titles) sits well
              below it, so the wordmark stays the singular large moment.
            */}
            <h1
              data-anim="display"
              className="max-w-full font-display text-[clamp(2.75rem,11vw,9.5rem)] font-normal leading-[0.92] tracking-[0.02em] text-ink"
            >
              {site.beats.hero.title}
            </h1>
            <div
              data-anim
              className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-wide2 text-ink/55"
            >
              {site.positioning.map((p, i) => (
                <span key={p} className="flex items-center gap-3">
                  {i > 0 && <span className="h-px w-6 bg-ink/30" />}
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/*
          ---- Moment 2: tagline ----
          Still centred (the brief's explicit exception for "the major
          conceptual tagline"), but its own moment rather than sharing the
          brand mark's block — it gets to breathe instead of being squeezed
          underneath VIZKRAFT.
        */}
        <div
          data-beat="tagline"
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <div data-glass className="liquid-glass liquid-glass--primary">
            <p
              data-anim="display"
              className="max-w-2xl font-display text-2xl font-light italic leading-snug text-ink md:text-4xl"
            >
              {site.beats.hero.subtitle}
            </p>
          </div>
        </div>

        {/*
          ---- Moment 3: purpose ----
          First left-third moment. A sentence, not a headline — restrained
          on purpose so it supports the architecture rather than competing
          with it, and positioned clear of the render's centre-right subject
          matter (the model/building itself) rather than over it.
        */}
        <div
          data-beat="purpose"
          className="pointer-events-none absolute inset-0 flex items-center justify-start px-6 md:pl-[8vw] md:pr-[14vw]"
        >
          <div data-glass className="liquid-glass liquid-glass--quiet">
            <p
              data-anim="display"
              className="max-w-sm text-left font-display text-lg font-light leading-relaxed text-ink md:max-w-md md:text-2xl"
            >
              {site.beats.purpose.line}
            </p>
          </div>
        </div>

        {/* ---- Moment 4: the reveal — left third, same restrained tier as purpose ---- */}
        <div
          data-beat="reveal"
          className="pointer-events-none absolute inset-0 flex items-center justify-start px-6 md:pl-[8vw] md:pr-[14vw]"
        >
          <div data-glass className="liquid-glass liquid-glass--quiet">
            <p
              data-anim="display"
              className="max-w-sm text-left font-display text-lg font-light leading-relaxed text-ink md:max-w-md md:text-2xl"
            >
              {site.beats.reveal.line}
            </p>
          </div>
        </div>

        {/* ---- Moment 5: into the space — same tier, same left third ---- */}
        <div
          data-beat="interior"
          className="pointer-events-none absolute inset-0 flex items-center justify-start px-6 md:pl-[8vw] md:pr-[14vw]"
        >
          <div data-glass className="liquid-glass liquid-glass--quiet">
            <p
              data-anim="display"
              className="max-w-sm text-left font-display text-lg font-light leading-relaxed text-ink md:max-w-md md:text-2xl"
            >
              {site.beats.interior.line}
            </p>
          </div>
        </div>

        {/*
          ---- Moments 6+: services, alternating left/right by index ----
          Titles sit at the tagline's tier (noticeable, not headline-scale);
          the alternation itself is what creates rhythm here, not size.
        */}
        {site.services.map((s, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={s.index}
              data-beat={`service-${i}`}
              className={`pointer-events-none absolute inset-0 flex items-center px-6 ${
                isLeft
                  ? "justify-start md:pl-[8vw] md:pr-[14vw]"
                  : "justify-end md:pl-[14vw] md:pr-[8vw]"
              }`}
            >
              <div
                data-glass
                className="liquid-glass liquid-glass--service max-w-sm text-left md:max-w-md"
              >
                <span data-anim className="font-display text-sm text-ink/60">
                  {s.index}
                </span>
                <h2
                  data-anim="display"
                  className="mt-3 font-display text-2xl font-light leading-tight text-ink md:text-4xl"
                >
                  {s.title}
                </h2>
                <p
                  data-anim
                  className="mt-4 max-w-xs text-sm font-light leading-relaxed text-ink/75 md:text-base"
                >
                  {s.body}
                </p>
              </div>
            </div>
          );
        })}

        {/* Scroll hint — only while the brand moment is on screen */}
        <div
          data-beat="brand"
          className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <span
            data-anim
            className="text-[9px] uppercase tracking-brand text-ink/50"
          >
            Scroll
          </span>
        </div>
      </div>
    </div>
  );
}
