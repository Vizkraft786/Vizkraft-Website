/**
 * Single source of truth for all copy + contact details.
 * Everything marked TODO is a placeholder awaiting confirmed info from Vizkraft.
 */

export const site = {
  name: "VIZKRAFT",
  tagline: "We Visualize Dreams",
  discipline: "Architectural Visualization",
  // From their Instagram bio — confirm this is the line they want to lead with.
  positioning: ["Cinematic Lighting", "Material Realism"],
  location: "Pune, India",

  contact: {
    // TODO: confirm — currently they only publish "DM to get a quote" on Instagram.
    email: "hello@vizkraft.studio",
    phone: "+91 00000 00000",
    whatsapp: "https://wa.me/910000000000",
    instagram: "https://www.instagram.com/vizzkraft/",
  },

  /**
   * Scroll-journey copy. Each beat is pinned to a scroll progress range (0–1)
   * across the cinematic sequence.
   */
  beats: {
    hero: {
      eyebrow: "Architectural Visualization Studio",
      title: "VIZKRAFT",
      subtitle: "We Visualize Dreams",
      cta: "Start a Project",
    },
    // Small/medium purpose statement — deliberately not another headline.
    purpose: {
      line: "We transform architectural ideas into immersive visual experiences.",
    },
    reveal: {
      // Appears as the clay model resolves into the laptop screen.
      line: "Every project begins as an idea.",
    },
    interior: {
      line: "We render it into something you can walk through.",
    },
  },

  /**
   * TODO: confirm the real service list with Vizkraft.
   * These are inferred from the work published on their Instagram.
   */
  services: [
    {
      index: "01",
      title: "Exterior Visualization",
      body: "Photoreal exteriors with controlled daylight, dusk and night studies — form, materiality and context resolved before a single brick is laid.",
    },
    {
      index: "02",
      title: "Interior Visualization",
      body: "Interiors rendered for material truth — timber grain, stone, textile and the way light actually falls across a room at a given hour.",
    },
    {
      index: "03",
      title: "Cinematic Animation",
      body: "Walkthroughs and camera films that move through a space the way a person would, built to sell the experience, not just the geometry.",
    },
    {
      index: "04",
      title: "Concept & Massing Studies",
      body: "Clay and white-model studies for early-stage design conversations — pure geometry, shadow and proportion, stripped of finish.",
    },
  ],

  /**
   * PLACEHOLDER — 9 project drawers.
   *
   * `renders` is a count, not a list of files: the archive draws that many
   * blank plates so the scatter layout can be judged at real density before
   * any imagery exists. Swap each entry for a real `images: string[]` once the
   * renders are chosen.
   */
  projects: [
    { id: "p1", title: "Project 1", category: "Residential", year: "2026", renders: 7 },
    { id: "p2", title: "Project 2", category: "Interior", year: "2026", renders: 9 },
    { id: "p3", title: "Project 3", category: "Exterior", year: "2026", renders: 6 },
    { id: "p4", title: "Project 4", category: "Commercial", year: "2026", renders: 8 },
    { id: "p5", title: "Project 5", category: "Residential", year: "2025", renders: 6 },
    { id: "p6", title: "Project 6", category: "Animation", year: "2025", renders: 9 },
    { id: "p7", title: "Project 7", category: "Interior", year: "2025", renders: 7 },
    { id: "p8", title: "Project 8", category: "Exterior", year: "2025", renders: 8 },
    { id: "p9", title: "Project 9", category: "Residential", year: "2024", renders: 6 },
  ],
} as const;

/**
 * Frame sequence config for the cinematic scroll.
 *
 * STRIDE exists for memory, not bandwidth. Every frame held as a decoded
 * bitmap costs width x height x 4 bytes, so all 240 source frames at 1280x720
 * is ~884 MB resident — enough to stall or blank the renderer. Taking every
 * 2nd frame halves that to ~440 MB while still giving 120 frames across the
 * scroll (~5vh per frame), which reads as continuous motion.
 *
 * All 240 files stay on disk; drop STRIDE to 1 if the motion ever looks steppy
 * and the memory budget allows it.
 */
const SOURCE_FRAMES = 240;
const STRIDE = 2;

export const sequence = {
  /** Number of frames actually loaded and drawn. */
  frameCount: Math.ceil(SOURCE_FRAMES / STRIDE),
  /** Maps a 0-based sequence index to its source file on disk. */
  path: (i: number) =>
    `/frames/frame_${String(i * STRIDE + 1).padStart(3, "0")}.jpg`,
  width: 1280,
  height: 720,
} as const;
