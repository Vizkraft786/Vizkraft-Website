"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, sequence } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger);

const FRAME_END = 0.74;

/**
 * v2 cinematic: the same 120-frame camera move, but presented inside a rounded
 * card floating on a light ground rather than filling the viewport.
 *
 * That framing is the whole point of this direction — the reference site puts
 * its media in an inset card and lets the page colour breathe around it, which
 * reads editorial rather than immersive. Copy sits outside the frame instead of
 * over the image, so the render is never obscured by text.
 *
 * Shares public/frames with v1 — no asset duplication.
 */
export default function FramedCinematic() {
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

    const draw = () => {
      const frames = imagesRef.current;
      const usable = (im?: HTMLImageElement) =>
        !!im && im.complete && im.naturalWidth > 0;

      let img = frames[frameRef.current.i];
      if (!usable(img)) {
        for (let d = 1; d < frames.length; d++) {
          if (usable(frames[frameRef.current.i - d])) {
            img = frames[frameRef.current.i - d];
            break;
          }
          if (usable(frames[frameRef.current.i + d])) {
            img = frames[frameRef.current.i + d];
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

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    // Canvas is sized to its container here, not the viewport — it lives
    // inside the card, so it must track the card's box.
    let resizeTimer: number | undefined;
    const applySize = () => {
      const box = canvas.parentElement?.getBoundingClientRect();
      if (!box) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;
      draw();
      requestAnimationFrame(draw);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(applySize, 120);
      draw();
    };

    applySize();
    window.addEventListener("resize", onResize);

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
      window.removeEventListener("resize", onResize);
      st.kill();
    };
  }, [ready]);

  /* ------------------------------------------------------- caption ------ */
  useEffect(() => {
    if (!ready) return;

    const mm = gsap.matchMedia();
    const beats = [
      { sel: "[data-cap='0']", start: 0.06, end: 0.3 },
      { sel: "[data-cap='1']", start: 0.32, end: 0.56 },
      { sel: "[data-cap='2']", start: 0.58, end: 0.84 },
    ];

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, () => {
      const ctx = gsap.context(() => {
        const timelines = beats.map(({ sel, start, end }) => {
          gsap.set(sel, { opacity: 0, y: 16 });
          const tl = gsap.timeline({ paused: true });
          tl.to(sel, { opacity: 1, y: 0, duration: 1, ease: "power4.out" })
            .to(sel, { opacity: 1, duration: 1.5 })
            .to(sel, { opacity: 0, y: -10, duration: 1, ease: "power2.out" });
          return { tl, start, end };
        });

        // Same single-controller pattern as v1 — explicit progress rather than
        // per-beat scrub triggers, so captions can never overlap.
        ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            for (const { tl, start, end } of timelines) {
              const local = gsap.utils.clamp(
                0,
                1,
                (self.progress - start) / (end - start)
              );
              if (tl.progress() !== local) tl.progress(local);
            }
          },
        });
      }, rootRef);
      return () => ctx.revert();
    });

    mm.add({ motion: "(prefers-reduced-motion: reduce)" }, () => {
      const ctx = gsap.context(() => {
        gsap.set("[data-cap]", { opacity: 1, y: 0 });
      }, rootRef);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [ready]);

  const captions = [
    "Every project begins as a study model.",
    "We resolve it — light, material, proportion.",
    "Until it becomes a space you can walk through.",
  ];

  return (
    <div ref={rootRef} className="relative h-[620vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center px-4 md:px-8">
        {/* The inset frame */}
        <div className="relative mx-auto w-full max-w-[1500px] overflow-hidden rounded-[22px] bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:rounded-[28px]">
          <div className="relative aspect-[16/9] w-full">
            <canvas ref={canvasRef} className="absolute inset-0 block" />

            {/* Loading state, inside the frame rather than over the page */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-card transition-opacity duration-700"
              style={{
                opacity: ready ? 0 : 1,
                pointerEvents: ready ? "none" : "auto",
              }}
            >
              <span className="font-display text-6xl font-light text-graphite/80">
                {Math.round(progress * 100)}
              </span>
            </div>

            {/* Floating pill controls, as in the reference */}
            <div className="pointer-events-none absolute right-4 top-4 flex gap-2 md:right-6 md:top-6">
              <span className="rounded-full bg-card/90 px-4 py-2 text-[10px] uppercase tracking-wide2 text-graphite backdrop-blur">
                {site.location}
              </span>
              <span className="rounded-full bg-graphite px-4 py-2 text-[10px] uppercase tracking-wide2 text-card">
                Scroll
              </span>
            </div>
          </div>
        </div>

        {/* Captions sit below the frame — the render is never covered. */}
        <div className="relative mx-auto mt-8 h-16 w-full max-w-[1500px] md:mt-10">
          {captions.map((c, i) => (
            <p
              key={c}
              data-cap={i}
              className="absolute inset-x-0 text-center font-display text-xl font-light text-graphite md:text-3xl"
            >
              {c}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
