"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site, sequence } from "@/lib/site-config";
import PillButton from "./PillButton";

gsap.registerPlugin(ScrollTrigger);

/**
 * The cinematic scroll sequence.
 *
 * A pinned full-viewport canvas plays a continuous camera move scrubbed by
 * scroll position — an exterior approach to a lakeside house, through its
 * interior, and out to an aerial — with text beats layered over it and keyed
 * to the same scroll progress.
 */

/**
 * Scroll progress at which the frame sequence reaches its last frame, and the
 * point the beat schedule is anchored to.
 *
 * This is 1 deliberately: the footage and the copy have to run out together.
 * It was previously 0.72, which left the last ~28% of the scroll (nearly two
 * viewport heights) playing text beats over a frozen final frame — the camera
 * visibly stopped and then services kept arriving, which read as the sequence
 * having ended early rather than as a held shot.
 *
 * The services block below derives its span from this value rather than
 * hardcoding an end, so the last beat finishes exactly as the last frame
 * lands and the two cannot drift apart if this is ever retuned.
 */
const FRAME_END = 1;

/**
 * Where the services block starts — expressed as the frame it should begin
 * on (1-based) rather than as a bare progress number, because the services
 * copy is meant to start on a specific picture, not at an arbitrary fraction
 * of the page.
 *
 * 252 is the interior corridor shot. It was 370 (the exterior driveway) until
 * the `interior` statement was cut: with that statement gone, the services
 * were moved up to take the slot it had occupied, which roughly triples the
 * scroll they get — from ~13% of the sequence to ~41%, so each of the four
 * has real time on screen instead of flicking past. The trade is deliberate
 * and was asked for: they no longer begin on the driveway, they begin inside
 * the corridor and run out through the exterior to the closing aerial.
 *
 * CAUTION: this is a frame NUMBER, not a stable reference to a shot, so it
 * must be updated by hand whenever the sequence is re-exported at a different
 * sampling. That is exactly what broke once already — it was 124, correct for
 * the old decimated 143-frame export (every 3rd source frame), and when the
 * sequence was rebuilt as all 427 frames it silently pointed somewhere else
 * entirely, which also inverted the then-present interior range (start > end)
 * and pinned that beat at full opacity from scroll 0 over every earlier one.
 * Re-verify against the actual file in /public/frames after any re-export
 * rather than trusting the arithmetic.
 *
 * Shared by both the full-motion and reduced-motion branches so the two can't
 * be retimed independently by accident.
 */
const SERVICES_START_FRAME = 252;
const SERVICES_START =
  (SERVICES_START_FRAME - 1) / (sequence.frameCount - 1);

/**
 * How many frames must decode before the hero is shown.
 *
 * Only the opening frames are needed to paint frame 0; the rest stream in while
 * the visitor is reading the hero, and draw() falls back to the nearest resident
 * neighbour if scrolling outruns the decoder. Waiting for the whole sequence
 * would hold a loading counter on screen long enough to look like a broken page.
 */
const FRAMES_BEFORE_READY = 12;

/**
 * Frames kept decoded either side of the playhead.
 *
 * This is the memory dial. Each 1920x1080 bitmap is ~8.3 MB, so a window of 30
 * holds 61 frames ≈ 506 MB — below what the old full preload used (786 MB) even
 * though the sequence now has three times the frames at a higher resolution.
 *
 * It also sets how much runway the decoder has: 30 frames ahead is ~570px of
 * scroll, roughly half a second at a brisk scroll speed, which is comfortably
 * more than decoding needs to keep up.
 */
const DECODE_WINDOW = 30;

/**
 * Cap on frames being fetched/decoded at once. Without it a fast scroll queues
 * a request per frame crossed and the useful ones queue behind stale ones.
 */
const MAX_CONCURRENT_DECODES = 6;

/**
 * Fluted glass over the opening shot — the two dials for the effect.
 *
 * This is NOT an overlay. Earlier passes laid a texture on top (soft-light,
 * then overlay) and both were rejected: an overlay adds its own grain and its
 * own pattern, and no blend of a separate image reproduces glass. This pass
 * re-renders the frame itself, so every pixel on screen is the footage — no
 * texture file, no grain, nothing added.
 */
/**
 * How far the frame is smeared, as a fraction of viewport width. This is the
 * silhouette dial: at 0 the image is untouched, and the further it goes the
 * more horizontal detail averages away until only broad masses read.
 */
const SMEAR_SPREAD = 0.22;
/**
 * Copies drawn across that spread. Too few and the smear bands into visible
 * ghosts instead of blurring; 28 is past the point where they merge.
 */
const SMEAR_STEPS = 28;

/**
 * Widest screen aspect (width / height) that draws from the portrait frame set
 * instead of the full one.
 *
 * On a screen at or below it, cover-fit scales the frame to height
 * (s = vh / 1080) and shows only a centred band of it. The portrait set is
 * that band, 960x1080, cut from the same files, so both sets put identical
 * pixels in identical places — the crop just costs under half the download and
 * half the decoded memory.
 *
 * The bound includes the fluted smear, which draws copies shifted up to
 * SMEAR_SPREAD / 2 of the width either way: the crop's edges stay off screen
 * while 960 * s >= vw * (1 + SMEAR_SPREAD), i.e. vw / vh <= ~0.729. That covers
 * every phone held upright, browser bars included. Anything wider — landscape
 * phones, tablets, every desktop window — keeps the full 1920x1080 set.
 */
const PORTRAIT_MAX_ASPECT =
  sequence.portrait.width / (sequence.portrait.height * (1 + SMEAR_SPREAD));

/**
 * DECODE_WINDOW for touch devices. Phone browsers kill a tab long before a
 * desktop runs out of memory: 20 either side is 41 decoded frames, ~170 MB on
 * the portrait set, against ~506 MB for the desktop window.
 */
const DECODE_WINDOW_TOUCH = 20;

/** Phones and tablets. Only ever called inside effects, never during render. */
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/**
 * The source watermark rectangle, in FRAME coordinates (1920x1080).
 *
 * Measured, not guessed: found by diffing three widely separated frames and
 * keeping the pixels that never changed. It has since been erased from the
 * frames themselves, but the CTA is pinned to where it sat, so the numbers
 * still matter.
 *
 * Frame coordinates rather than viewport ones because the canvas cover-fits:
 * the frame is scaled and cropped to taste depending on the viewport aspect,
 * so this rectangle lands somewhere different on every screen. A fixed CSS
 * offset cannot follow it — at 1440x820 a bottom/right-anchored button was out
 * by 46px horizontally and 14px in height. It has to be computed.
 */
const WATERMARK = { x: 1705, y: 864, w: 215, h: 71 } as const;

/** Clear space kept between the CTA and the scrollbar edge, in px. */
const CTA_EDGE_GAP = 20;

/** Phones: clear space kept between the CTA and the wordmark block below it, in px. */
const CTA_BRAND_GAP = 16;

export default function CinematicScroll() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Frames currently decoded and resident, keyed by index. See DECODE_WINDOW. */
  const bitmapsRef = useRef<Map<number, ImageBitmap>>(new Map());
  /**
   * Encoded bytes for every frame fetched so far. Cheap to retain — the whole
   * sequence is ~79 MB encoded against ~3.5 GB decoded — and it turns scrolling
   * back past a frame into a re-decode rather than a re-download.
   */
  const blobsRef = useRef<Map<number, Blob>>(new Map());
  const pendingRef = useRef<Set<number>>(new Set());
  /** +1 scrolling down, -1 up — decides which side of the playhead fills first. */
  const dirRef = useRef(1);
  const frameRef = useRef({ i: 0 });
  const pumpRef = useRef<(() => void) | null>(null);
  const hazeRef = useRef<HTMLCanvasElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  /**
   * Mirrors the haze layer opacity for the draw loop. Read as a ref rather
   * than state so the fluted pass can be skipped without re-rendering, and so
   * GSAP stays the single owner of the actual opacity.
   */
  const hazeVisibleRef = useRef(1);
  /** The eyebrow + wordmark block, measured to keep the CTA clear of it on phones. */
  const brandRef = useRef<HTMLDivElement>(null);
  /** Decode window in force for the current device. See DECODE_WINDOW_TOUCH. */
  const windowRef = useRef(DECODE_WINDOW);
  /** True on touch devices, where the fluted pass renders at CSS-pixel resolution. */
  const touchRef = useRef(false);
  /** Schedules a repaint; null until the draw effect is live. */
  const drawRef = useRef<(() => void) | null>(null);

  const [decoded, setDecoded] = useState(0);
  /**
   * Latched: once the hero has been shown it stays shown. Switching frame sets
   * (a phone rotating, say) empties the decoded window and refills it, and
   * without the latch that dip would bring the loading veil back and tear down
   * every scroll timeline.
   */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (decoded >= FRAMES_BEFORE_READY) setReady(true);
  }, [decoded]);
  const progress = Math.min(decoded / FRAMES_BEFORE_READY, 1);
  /** Whether this screen draws from the portrait set; null until measured on the client. */
  const [portrait, setPortrait] = useState<boolean | null>(null);

  /* ------------------------------------------------------- CTA place --- */
  /**
   * Pins the CTA onto the watermark rectangle, running the identical cover-fit
   * transform the canvas draw uses so the two cannot disagree.
   *
   * Recomputed on resize because the mapping depends on viewport aspect: on a
   * screen narrower than 16:9 the frame is scaled to height and the sides are
   * cropped, which pushes this rectangle partly off the right edge — so the
   * button does the same, and the sticky stage clips it. That is correct: it
   * still covers every visible pixel of where the strip was.
   */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;

    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.max(vw / sequence.width, vh / sequence.height);
      const offX = (vw - sequence.width * s) / 2;
      const offY = (vh - sequence.height * s) / 2;

      const width = WATERMARK.w * s;
      const height = WATERMARK.h * s;

      /**
       * Clamped so the whole button stays on screen.
       *
       * The watermark ran to the frame edge, and on any viewport narrower than
       * 16:9 cover-fit crops that edge away — so the rectangle itself is partly
       * off screen, and following it exactly hid part of the button and pushed
       * it under the scrollbar. innerWidth includes the scrollbar gutter and
       * clientWidth does not, so the difference is its width; CTA_EDGE_GAP is
       * then clear space beyond it.
       *
       * The clamp only ever pulls left, so on a viewport wide enough to show
       * the full rectangle the button still sits exactly on it.
       */
      const gutter = vw - document.documentElement.clientWidth;
      const maxRight = vw - gutter - CTA_EDGE_GAP;
      const left = Math.min(offX + WATERMARK.x * s, maxRight - width);
      let top = offY + WATERMARK.y * s;

      /**
       * Phones only: lift the button clear of the wordmark block.
       *
       * On a portrait screen the clamp above drags the button a long way left,
       * into the same columns as the eyebrow and wordmark in the bottom-left
       * corner — at 375x812 it sat across the eyebrow. Below md, and only when
       * the two actually share columns, it rises to sit just above that block.
       * Offsets rather than getBoundingClientRect, so the beats' own entrance
       * transforms cannot move the target. Desktop never enters this branch.
       */
      const brand = brandRef.current;
      if (vw < 768 && brand && left < brand.offsetLeft + brand.offsetWidth) {
        top = Math.min(top, brand.offsetTop - CTA_BRAND_GAP - height);
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
    };

    place();
    window.addEventListener("resize", place);
    // The wordmark block's height depends on the webfont, which swaps in late.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) place();
    });
    return () => {
      live = false;
      window.removeEventListener("resize", place);
    };
  }, []);

  /* ------------------------------------------------------ frame set --- */
  /**
   * Picks the frame set for this screen, and re-picks on resize so a phone
   * turned to landscape moves to the full set (and back).
   */
  useEffect(() => {
    const pick = () =>
      setPortrait(window.innerWidth / window.innerHeight <= PORTRAIT_MAX_ASPECT);
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);

  /* ------------------------------------------------ frame streaming --- */
  /**
   * Frames stream into a sliding window instead of being preloaded whole.
   *
   * The previous version held every frame as a decoded <img> for the life of
   * the page. Decoded cost is width x height x 4 regardless of JPEG size, so
   * that caps the sequence hard: all 427 frames at 1920x1080 would be ~3.5 GB
   * resident. Capping it the other way instead — cutting to 143 frames — is
   * what made the scrub choppy, because 143 frames across 900vh is ~57px of
   * scroll per frame, so an ordinary ~1000px/s scroll only advances ~18 frames
   * a second however fast the drawing is. 427 frames is ~19px each, ~52/s.
   *
   * ImageBitmap is what makes the window possible: unlike an <img> its lifetime
   * is explicit (`close()`), so memory is genuinely returned rather than left
   * to the browser's cache heuristics. Only DECODE_WINDOW frames either side of
   * the playhead stay decoded; the rest are released and rebuilt from the
   * retained blob without touching the network.
   */
  useEffect(() => {
    if (portrait === null) return;
    let cancelled = false;
    const frames = portrait ? sequence.portrait : sequence;
    touchRef.current = isTouch();
    const win = touchRef.current ? DECODE_WINDOW_TOUCH : DECODE_WINDOW;
    windowRef.current = win;

    /**
     * Fresh collections for each frame set. A decode still in flight from the
     * previous set then settles into its own discarded maps, instead of
     * landing a frame from the wrong set in these or clearing a pending flag
     * this run has just set.
     */
    const bitmaps = new Map<number, ImageBitmap>();
    const blobs = new Map<number, Blob>();
    const pending = new Set<number>();
    bitmapsRef.current = bitmaps;
    blobsRef.current = blobs;
    pendingRef.current = pending;

    const acquire = async (i: number) => {
      if (cancelled || i < 0 || i >= sequence.frameCount) return;
      if (bitmaps.has(i) || pending.has(i)) return;
      pending.add(i);
      try {
        let blob = blobs.get(i);
        if (!blob) {
          const res = await fetch(frames.path(i));
          blob = await res.blob();
          blobs.set(i, blob);
        }
        const bmp = await createImageBitmap(blob);
        // Losing the race against unmount would leak the bitmap, which is
        // exactly what explicit lifetimes exist to prevent.
        if (cancelled) {
          bmp.close();
          return;
        }
        bitmaps.set(i, bmp);
        setDecoded(bitmaps.size);
        // The frame on screen may have been standing in for this one (or, just
        // after a frame-set switch, nothing may be on screen): repaint.
        if (i === frameRef.current.i) drawRef.current?.();
      } catch {
        /* a dropped frame is survivable — draw() falls back to a neighbour */
      } finally {
        pending.delete(i);
        if (!cancelled) pump();
      }
    };

    /**
     * Fill the window nearest-first, biased in the direction of travel, under a
     * concurrency cap so a fast scroll cannot open hundreds of requests at once.
     * Re-entered from acquire()'s finally so the window keeps topping itself up
     * after the user stops scrolling and no further onUpdate fires.
     */
    const pump = () => {
      if (cancelled) return;
      const centre = frameRef.current.i;
      const dir = dirRef.current;
      for (let d = 0; d <= win; d++) {
        const candidates = d === 0 ? [centre] : [centre + d * dir, centre - d * dir];
        for (const i of candidates) {
          if (pending.size >= MAX_CONCURRENT_DECODES) return;
          if (i < 0 || i >= sequence.frameCount) continue;
          if (bitmaps.has(i) || pending.has(i)) continue;
          void acquire(i);
        }
      }
    };

    pumpRef.current = pump;
    pump();

    return () => {
      cancelled = true;
      for (const bmp of bitmaps.values()) bmp.close();
      bitmaps.clear();
      blobs.clear();
      pending.clear();
      pumpRef.current = null;
    };
  }, [portrait]);

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
      const bitmaps = bitmapsRef.current;

      let img = bitmaps.get(frameRef.current.i);
      if (!img) {
        for (let d = 1; d <= windowRef.current * 2; d++) {
          img =
            bitmaps.get(frameRef.current.i - d) ??
            bitmaps.get(frameRef.current.i + d);
          if (img) break;
        }
      }
      if (!img) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.width, ch / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      // Ink, not near-white: the matte only shows for a frame during a resize,
      // and a white flash between two dark film frames is far more visible than
      // a dark one.
      ctx.fillStyle = "#1D1D1B";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);

      drawFluted(img, cw, ch, scale);
    };

    /**
     * The fluted-glass pass — the frame smeared along one axis until only its
     * silhouette survives.
     *
     * Not an overlay and not a texture: it re-renders the footage itself, so
     * nothing is composited on top and no grain is introduced. Every pixel
     * here comes from the frame.
     *
     * The smear is an accumulation blur — the frame drawn SMEAR_STEPS times
     * across a spread of the viewport, each at 1/steps alpha. That averages
     * detail away along the smear axis while leaving structure across it
     * intact, which is precisely why a silhouette reads through: broad masses
     * survive, everything finer dissolves.
     *
     * This replaced a rib/sliver version that stretched a narrow slice across
     * each rib. Optically that is what reeded glass does, but on this footage
     * it magnified ~7 source pixels over ~26 and read as a coarse mosaic
     * rather than glass. An accumulation blur has no blocks to show.
     */
    const drawFluted = (
      img: ImageBitmap,
      cw: number,
      ch: number,
      scale: number
    ) => {
      const hz = hazeRef.current;
      const hctx = hz?.getContext("2d");
      if (!hz || !hctx) return;
      // Nothing visible once the brand moment has passed, so skip the work.
      if (hazeVisibleRef.current <= 0.01) return;

      /**
       * Touch devices render this layer at CSS-pixel resolution rather than
       * device-pixel: SMEAR_STEPS full-screen draws per frame is the heaviest
       * thing on the page, and a 2x phone does a quarter of the fill work at
       * 1x. The layer is a blur, so the lost resolution has nothing to show.
       * Everywhere else k is 1 and the pass is exactly as before.
       */
      const k = touchRef.current
        ? 1 / Math.min(window.devicePixelRatio || 1, 2)
        : 1;
      const tw = Math.round(cw * k);
      const th = Math.round(ch * k);
      if (hz.width !== tw || hz.height !== th) {
        hz.width = tw;
        hz.height = th;
      }
      hctx.setTransform(k, 0, 0, k, 0, 0);

      const w = img.width * scale;
      const h = img.height * scale;
      const offX = (cw - w) / 2;
      const offY = (ch - h) / 2;

      hctx.globalAlpha = 1;
      hctx.fillStyle = "#1D1D1B";
      hctx.fillRect(0, 0, cw, ch);

      const spread = SMEAR_SPREAD * cw;
      hctx.globalAlpha = 1 / SMEAR_STEPS;
      for (let i = 0; i < SMEAR_STEPS; i++) {
        const t = i / (SMEAR_STEPS - 1) - 0.5;
        hctx.drawImage(img, offX + t * spread, offY, w, h);
      }
      hctx.globalAlpha = 1;
      hctx.setTransform(1, 0, 0, 1, 0, 0);
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
    drawRef.current = () => requestAnimationFrame(draw);

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
          dirRef.current = next > frameRef.current.i ? 1 : -1;
          frameRef.current.i = next;
          requestAnimationFrame(draw);

          /**
           * Recentre the window, releasing whatever fell out of range. Done
           * here rather than inside pump() so release is tied to movement,
           * which is the only time the window's centre actually changes.
           */
          const bitmaps = bitmapsRef.current;
          for (const [k, bmp] of bitmaps) {
            if (Math.abs(k - next) > windowRef.current) {
              bmp.close();
              bitmaps.delete(k);
            }
          }
          pumpRef.current?.();
        }
      },
    });

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      drawRef.current = null;
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
          const lines = (b: string) =>
            `[data-beat='${b}'] [data-anim], [data-beat='${b}'] [data-word]`;
          const display = (b: string) => `[data-beat='${b}'] [data-anim='display']`;
          const plain = (b: string) =>
            `[data-beat='${b}'] [data-anim]:not([data-anim='display'])`;
          /**
           * Individually-animated words, for copy that reads in one word at a
           * time rather than as a block. Kept separate from data-anim because
           * the treatment is deliberately different: a pure opacity fade with
           * no travel and a long stagger, so the line assembles left to right
           * as you scroll instead of arriving all at once. Any beat without
           * [data-word] elements simply gets no-op tweens here.
           */
          const words = (b: string) => `[data-beat='${b}'] [data-word]`;
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
            // No y/x on words: the whole effect is the fade and its ordering.
            gsap.set(words(b), { opacity: 0 });
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
              /**
               * Word-by-word fade, left to right. The stagger is long
               * relative to each word's own fade (0.5 vs 1.1) so the words
               * overlap only slightly — the line visibly assembles one word
               * at a time as you scroll rather than shimmering in together.
               * Linear-ish easing keeps each word's fade even; power4 would
               * make it snap in at the end, which reads as a pop, not a fade.
               */
              .to(
                words(b),
                {
                  opacity: 1,
                  duration: 1.1,
                  ease: "power1.out",
                  stagger: 0.5,
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

          // No glass() calls here — brand has no [data-glass] element by
          // design (removed per client correction), so its entrance/exit is
          // just the display + plain text treatment, same shape as every
          // other beat had before glass was layered on.
          /**
           * The fractal haze rides this timeline rather than getting one of
           * its own.
           *
           * The requirement was that it clear on the exact frame the wordmark
           * does. Two separate timelines with matching numbers would satisfy
           * that today and silently drift the first time either is retuned;
           * sharing brandExit makes it structural — the "<" position pins the
           * haze's fade to the same instant the wordmark's exit begins.
           */
          const HAZE = "[data-haze]";
          gsap.set(HAZE, { opacity: 1 });
          hazeVisibleRef.current = 1;

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
            .to(
              HAZE,
              {
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                // Keep the ref in step so drawFluted can stop working once the
                // layer is invisible.
                onUpdate() {
                  hazeVisibleRef.current = Number(
                    gsap.getProperty(HAZE, "opacity")
                  );
                },
              },
              "<"
            );

          gsap
            .timeline({
              onComplete: () => {
                timelines.push({ tl: brandExit, start: 0, end: 0.1 });
              },
            })
            .to(display("brand"), {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: "power4.out",
            })
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
          /**
           * The opening beats run right up to SERVICES_START so `purpose`
           * hands straight over to the first service, with no dead stretch of
           * footage carrying no copy in between.
           *
           * This has now been rebalanced twice, both times because a
           * statement was cut: first `reveal` (which held 0.293-0.586), then
           * `interior` (0.59-0.866). Rather than let either deletion reopen a
           * multi-screen silence mid-sequence, the survivors absorbed the gap
           * — `reveal`'s went to the three statements around it, and
           * `interior`'s went entirely to the services, which is why they now
           * start at frame 252 instead of 370.
           */
          /**
           * Tagline — a plain cross-fade: in, hold, out. Bespoke rather than
           * beat() because that shared recipe is a clip-wipe plus staggered
           * travel, and what is wanted here is opacity and nothing else.
           *
           * This replaced a true stroke write-on that drew the phrase as
           * handwriting, dropped as too informal for the brand. It was removed
           * deliberately rather than lost: the centreline paths and the
           * extractor that produced them are in git history, should it ever
           * be wanted back.
           */
          const taglineText = "[data-beat='tagline'] [data-fade]";
          gsap.set(taglineText, { opacity: 0 });

          const write = gsap.timeline({ paused: true });
          timelines.push({ tl: write, start: 0.1, end: 0.3 });
          write
            .to(taglineText, { opacity: 1, duration: 1.3, ease: "sine.inOut" })
            .to(taglineText, { opacity: 1, duration: 1.4 })
            .to(taglineText, { opacity: 0, duration: 1.3, ease: "sine.inOut" });

          /**
           * Purpose — a plain cross-fade, same shape as the tagline above.
           * Bespoke rather than beat() so it stays opacity-only.
           *
           * This replaced a per-line masked write-on that revealed the
           * sentence as though it were being handwritten.
           */
          const purposeText = "[data-beat=purpose] [data-fade]";
          gsap.set(purposeText, { opacity: 0 });
          const purposeFade = gsap.timeline({ paused: true });
          timelines.push({ tl: purposeFade, start: 0.32, end: 0.56 });
          purposeFade
            .to(purposeText, { opacity: 1, duration: 1.3, ease: "sine.inOut" })
            .to(purposeText, { opacity: 1, duration: 1.4 })
            .to(purposeText, { opacity: 0, duration: 1.3, ease: "sine.inOut" });


          /**
           * Services alternate left/right by index parity — even indices sit
           * left third, odd sit right third — entering with the matching
           * lateral motion above (-30 for left, +30 for right).
           *
           * The span is divided out of the distance remaining to FRAME_END
           * rather than being a fixed 0.3, so the final service's exit lands
           * on the sequence's final frame: the copy stops arriving at the
           * same moment the camera stops moving, with no tail of scroll where
           * one is still running and the other has finished.
           */
          const serviceSpan =
            (FRAME_END - SERVICES_START) / site.services.length;
          site.services.forEach((_, i) => {
            const start = SERVICES_START + i * serviceSpan;
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
          const sel = `[data-beat='${b}'] [data-anim], [data-beat='${b}'] [data-word], [data-beat='${b}'] [data-glass]`;
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

        fade("brand", 0, 0.1, true);
        // The tagline is now drawn SVG with no [data-anim]/[data-word]
        // children, so the generic fade() selector would match nothing. Fade
        // the group instead — reduced motion wants the phrase present, just
        // without the write-on.
        gsap.set("[data-beat=tagline] [data-fade]", { opacity: 0 });
        gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "10% top",
            end: "30% top",
            scrub: 0.8,
          },
        })
          .to("[data-beat=tagline] [data-fade]", { opacity: 1, duration: 1 })
          .to("[data-beat=tagline] [data-fade]", { opacity: 1, duration: 1.3 })
          .to("[data-beat=tagline] [data-fade]", { opacity: 0, duration: 1 });
        fade("purpose", 0.32, 0.56);

        const serviceSpan =
          (FRAME_END - SERVICES_START) / site.services.length;
        site.services.forEach((_, i) => {
          const start = SERVICES_START + i * serviceSpan;
          fade(`service-${i}`, start, start + serviceSpan);
        });
      }, rootRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [ready]);

  return (
    /*
      1400vh, not 1000vh. The services still occupy the same 13.4% of scroll
      PROGRESS (frame 370 to the last frame is fixed — see
      SERVICES_START_FRAME — and progress maps to frame linearly, so that
      fraction can't move without sliding the section off the shot it's
      anchored to). What 1400vh buys is more physical scroll DISTANCE for
      that same fraction: ~43.5vh per service instead of ~30vh, without
      touching which frame anything lands on. The four opening beats get the
      same proportional increase, which is also the fix for "the text
      animation" feeling rushed generally, not just in the services block.
    */
    <div ref={rootRef} className="relative h-[1400vh]">
      {/* Loading veil */}
      <div
        className="grain fixed inset-0 z-50 flex items-center justify-center bg-stone transition-opacity duration-1000"
        style={{
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : "auto",
        }}
      >
        <div className="text-center">
          <div className="font-display text-[13vw] font-light leading-none text-ink/90 md:text-[7vw]">
            {Math.round(progress * 100)}
          </div>
          <div className="mt-6 text-[10px] uppercase tracking-brand text-ink/50">
            {site.name}
          </div>
        </div>
      </div>

      {/*
        Pinned stage. On touch devices it tracks the dynamic viewport (100dvh):
        100vh there is the height with the browser bars hidden, so while they
        show, the bottom of the stage — the wordmark and CTA — sat behind them.
        Desktop browsers have no dynamic bars and keep h-screen.
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden [@media(pointer:coarse)]:h-[100dvh]">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {/*
          ---- Fluted glass ----
          A second canvas carrying the same frame re-rendered through ribs.
          See drawFluted() for the optics; nothing is composited on top of the
          film, so there is no texture and no grain — every pixel here is the
          footage, just magnified sliver by sliver until only silhouette is
          left.

          Sits after the canvas but BEFORE every [data-beat]. Painting order is
          what keeps it off the VIZKRAFT wordmark: the wordmark is in a later
          sibling, so it renders on top and the glass never touches it. No mask
          required.

          Its fade is driven from the brandExit timeline, not from anything
          here, so it clears on the same frame the wordmark does.
        */}
        <canvas
          ref={hazeRef}
          data-haze
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block h-full w-full"
        />

        {/*
          NO overlay on the film — the footage renders exactly as graded.

          There was a top/bottom vignette here (ink/35 to ink/60) acting as a
          legibility scrim for the off-white text. Removed on request to judge
          the frames clean.

          Be aware of what it was doing: measured behind the wordmark, contrast
          was 8.54:1 with it. Whatever the film happens to be bright behind now
          is what the type has to read against, with only the text-shadows on
          the tagline and purpose lines left as a floor. If a beat becomes hard
          to read over a pale shot, this is why.
        */}

        {/*
          ---- Moment 1: brand ----
          The one deliberately centred title-card moment — a brand-mark
          reveal earns it the way the tagline right after earns its own
          exception. Everything from here on defaults to the left third.
        */}
        <div
          data-beat="brand"
          className="pointer-events-none absolute inset-0 flex items-end justify-start overflow-hidden px-6 pb-12 text-left md:pl-[6vw] md:pb-[9vh]"
        >
          {/*
            No glass here by design — this moment is a direct correction
            away from it (client call). Bottom-left corner rather than the
            earlier centred title-card treatment.
          */}
          <div ref={brandRef} className="flex flex-col items-start">
            <p
              data-anim
              className="mb-5 max-w-full text-[9px] uppercase tracking-wide2 text-stone/70 md:text-[11px]"
            >
              {site.beats.hero.eyebrow}
            </p>
            {/*
              A large face set tight (-0.02em) rather than a small one opened
              up with tracking — that inversion is what makes the word read as
              one solid graphic mass instead of a spaced-out label, and it is
              how the reference wordmark is built.

              Scaled down on request, 13.5vw to 11.5vw, which takes the
              footprint from ~64% of the viewport to ~55%. That does break the
              earlier two-thirds-width requirement; it was superseded
              deliberately. If the two-thirds figure is ever wanted back, 13.5
              is the number.

              Light (300), the thinnest weight The Seasons ships in this pack
              — there is no Thin or ExtraLight cut to reach for. At this size
              the light weight is what lets the serif read as elegant rather
              than heavy; Regular and Bold both close up the counters and the
              word starts to look dense instead of large.

              font-thin must map to a real 300 face (registered in
              layout.tsx). If it ever falls back to synthesising a light
              weight from Regular the strokes go ragged rather than fine.

              Width is verified by measurement, not eyeballed — see the check
              in verification.

              Off-white (stone), not ink: this sits directly on the film with
              no wash behind it (the wash was removed when the tagline/purpose
              moved to off-white text, which no longer needs one). Measured
              against the actual canvas pixels behind it, dark ink here was
              2.22:1 contrast — under the 3:1 floor for large text. Off-white
              measures 6.1:1 in the same spot and matches the reference, where
              the giant word and the supporting copy share one white.
            */}
            <h1
              data-anim="display"
              className="max-w-full font-display text-[clamp(2.1rem,11.5vw,12.8rem)] font-light leading-[0.88] tracking-[-0.02em] text-stone"
            >
              {site.beats.hero.title}
            </h1>
          </div>
        </div>

        {/*
          ---- Persistent CTA ----
          Deliberately a SIBLING of the beats, not a child of one.

          It used to live inside the brand beat, which meant it inherited that
          beat's exit and vanished at ~10% of the scroll along with the
          wordmark. It is now outside every [data-beat] container and carries
          no [data-anim], so no beat timeline touches it: it holds at full
          opacity for the whole pinned sequence and only leaves when the stage
          itself scrolls away.

          Placed on the source watermark rectangle. That placement is COMPUTED
          (see the CTA-place effect above), not expressed in CSS offsets: the
          canvas cover-fits, so the rectangle lands somewhere different on
          every viewport and a fixed bottom/right anchor drifts off it. The
          strip itself has been erased from the frames — this is placement for
          its own sake now.

          Rendered last so it stacks above the beat layers, and given its own
          pointer-events-auto because everything else in the stage is
          pointer-events-none to keep the film scrollable through the text.
        */}
        <div ref={ctaRef} className="pointer-events-none absolute z-20">
          <PillButton
            href="#contact"
            className="pointer-events-auto h-full w-full justify-between"
          >
            {site.beats.hero.cta}
          </PillButton>
        </div>

        {/*
          ---- Moment 2: tagline ----
          Deliberately IDENTICAL in treatment to the purpose statement below —
          same family, size, weight, colour, leading and centred placement.
          The two are consecutive beats and now read as one voice, differing
          only in the words and when they appear. If either is retuned, retune
          both or the pairing breaks.

          The uppercase and the one-word-per-line stack are gone with the
          resize: both existed to give a 5.6vw display line structure, and at
          1.9vw they would read as a cramped label rather than as a statement.

          Carries the same text-shadow for the same reason the purpose line
          does — centred mid-frame, where the vignette deliberately leaves the
          picture clear, so the type needs its own legibility floor.

          This replaced a drawn-lettering version (single-stroke centreline
          paths animated on by stroke-dashoffset, matching the Apple "hello").
          Dropped as too informal for the brand; recoverable from git history
          if ever wanted.
        */}
        <div
          data-beat="tagline"
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <p
            data-fade
            className="max-w-3xl font-sans text-[clamp(1.05rem,1.9vw,1.7rem)] font-thin leading-[1.6] tracking-[0.01em] text-stone/80 [text-shadow:0_2px_28px_rgba(0,0,0,0.55),0_1px_4px_rgba(0,0,0,0.4)]"
          >
            {site.beats.hero.subtitle}
          </p>
        </div>

        {/*
          ---- Moment 3: purpose ----
          Centred supporting statement in the sans face, set well below the
          tagline in scale so it reads as support rather than a second
          headline.

          The text-shadow is deliberate: this sits mid-frame, which the
          vignette leaves clear (it only darkens the top and bottom edges), so
          off-white type here has no guaranteed dark ground under it the way
          the corner placements do. A soft shadow keeps it legible over any
          frame without introducing a panel — the technique subtitles use.
        */}
        <div
          data-beat="purpose"
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <p
            data-fade
            className="max-w-3xl font-sans text-[clamp(1.05rem,1.9vw,1.7rem)] font-thin leading-[1.6] tracking-[0.01em] text-stone/80 [text-shadow:0_2px_28px_rgba(0,0,0,0.55),0_1px_4px_rgba(0,0,0,0.4)]"
          >
            {site.beats.purpose.line}
          </p>
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
                <span data-anim className="font-display text-sm font-light text-ink/60">
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
                  className="mt-4 max-w-xs text-sm font-thin leading-relaxed text-ink/75 md:text-base"
                >
                  {s.body}
                </p>
              </div>
            </div>
          );
        })}

        {/*
          Scroll hint — only while the brand moment is on screen.

          Hidden below md: on phones the brand block stacks its descriptors
          and CTA into normal flow at the bottom of the frame, and this hint
          sits in exactly that space, printing straight through the CTA pill.
          Desktop keeps it because there the right-hand column is pinned away
          from centre and the gap is genuinely empty.
        */}
        <div
          data-beat="brand"
          className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 md:block"
        >
          <span
            data-anim
            className="text-[9px] uppercase tracking-brand text-stone/70"
          >
            Scroll
          </span>
        </div>
      </div>
    </div>
  );
}
