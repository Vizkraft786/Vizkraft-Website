/**
 * Single source of truth for all copy + contact details.
 * Everything marked TODO is a placeholder awaiting confirmed info from Vizkraft.
 */

/**
 * Contact details, as confirmed by the studio. Every contact link in `site`
 * is built from these values, so the text shown on the page and the links it
 * points to cannot disagree.
 */
const EMAIL = "contactus.vizkraft@gmail.com";
/** Ten-digit national number. The +91 code is assumed from the Pune address. */
const PHONE_DIGITS = "9767860208";
const INSTAGRAM_HANDLE = "vizzkraft";
/** Body text pre-filled into the Gmail draft. */
const EMAIL_DRAFT = "Hey! Let's Connect.";

export const site = {
  name: "VIZKRAFT",
  tagline: "We Visualize Dreams",
  discipline: "Architectural Visualization",
  // From their Instagram bio — confirm this is the line they want to lead with.
  positioning: ["Cinematic Lighting", "Material Realism"],
  location: "Pune, India",
  /**
   * Production address, no trailing slash. The canonical URL, sitemap,
   * robots.txt and link-preview tags are all built from it.
   */
  url: "https://vizkraft.in",
  /**
   * Meta description — the line under the title in search results and link
   * previews. Kept under ~155 characters so Google does not truncate it.
   */
  description: "Architectural Visualization Studio",

  contact: {
    email: EMAIL,
    /** Display form, grouped 5+5 as Indian mobile numbers are usually written. */
    phone: `+91 ${PHONE_DIGITS.slice(0, 5)} ${PHONE_DIGITS.slice(5)}`,
    /** Starts a call on phones; hands off to a calling app on desktop. */
    phoneHref: `tel:+91${PHONE_DIGITS}`,
    /**
     * UNCONFIRMED: only works if this number is registered on WhatsApp. If it
     * is not, WhatsApp opens to an error instead of a chat.
     */
    whatsapp: `https://wa.me/91${PHONE_DIGITS}`,
    instagram: `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
    instagramHandle: `@${INSTAGRAM_HANDLE}`,
    /**
     * Gmail's own compose URL rather than mailto:. The request was for the
     * click to open Gmail specifically with the draft filled in; mailto: hands
     * off to the visitor's default mail app, which may not be Gmail. Visitors
     * not signed in to Gmail are shown Google's sign-in page first.
     */
    gmailCompose: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&body=${encodeURIComponent(EMAIL_DRAFT)}`,
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
   * Team, as confirmed by the studio. Portraits live under /public/team/.
   *
   * Never fill a slot with an invented person: an unconfirmed entry should read
   * as a placeholder on screen ("Name TBC", `photo: null`) so it cannot be
   * mistaken for real staff. The section reads its count from this array, so
   * adding or removing people needs no layout change.
   */
  team: [
    // `photo` is a path under /public, or null to show the blank plate.
    { id: "t1", name: "Maruf Inamdar", role: "Founder", photo: "/team/maruf-inamdar.jpg" },
    { id: "t2", name: "Zimraan Darvesh", role: "Co-Founder", photo: "/team/zimraan-darvesh.jpg" },
  ],

  /**
   * The nine projects, in the studio's chosen order. Renders are real files
   * under /public/projects/<id>/, listed with their pixel dimensions.
   *
   * width/height are stored rather than measured at runtime because the
   * archive lays each project's renders out as an equal-height row sized by
   * aspect ratio. It needs every ratio before the images load, or the row
   * would reflow as they arrive.
   *
   * No category or year: none was supplied, and the old placeholder values
   * would have read as real. Add them per project once known.
   */
  projects: [
    {
      id: "the-oasis",
      title: "The Oasis",
      images: [
        { src: "/projects/the-oasis/1.jpg", width: 1080, height: 1350 },
        { src: "/projects/the-oasis/2.jpg", width: 1080, height: 1350 },
      ],
    },
    {
      id: "mapusa-residence",
      title: "Mapusa Residence",
      images: [
        { src: "/projects/mapusa-residence/1.jpg", width: 1448, height: 1086 },
        { src: "/projects/mapusa-residence/2.jpg", width: 1448, height: 1086 },
      ],
    },
    {
      id: "villa-serene",
      title: "Villa Serene",
      images: [
        { src: "/projects/villa-serene/1.jpg", width: 1080, height: 1350 },
        { src: "/projects/villa-serene/2.jpg", width: 1024, height: 1536 },
      ],
    },
    {
      id: "godrej-office",
      title: "Godrej Office",
      images: [
        { src: "/projects/godrej-office/1.jpg", width: 1536, height: 1024 },
        { src: "/projects/godrej-office/2.jpg", width: 1536, height: 1024 },
      ],
    },
    {
      id: "bean-crust",
      title: "Bean Crust",
      images: [
        { src: "/projects/bean-crust/1.jpg", width: 2000, height: 1126 },
        { src: "/projects/bean-crust/2.jpg", width: 2000, height: 1126 },
      ],
    },
    {
      id: "business-bay",
      title: "Business Bay",
      images: [
        { src: "/projects/business-bay/1.jpg", width: 1080, height: 1350 },
        { src: "/projects/business-bay/2.jpg", width: 1080, height: 1350 },
      ],
    },
    {
      id: "casa-amara",
      title: "Casa Amara",
      images: [
        { src: "/projects/casa-amara/1.jpg", width: 1254, height: 1254 },
        { src: "/projects/casa-amara/2.jpg", width: 1402, height: 1122 },
      ],
    },
    {
      id: "casa-boho",
      title: "Casa Boho",
      images: [
        { src: "/projects/casa-boho/1.jpg", width: 1600, height: 1131 },
        { src: "/projects/casa-boho/2.jpg", width: 1600, height: 1131 },
      ],
    },
    {
      id: "aurelia-estate",
      title: "Aurelia Estate",
      images: [
        { src: "/projects/aurelia-estate/1.jpg", width: 1280, height: 1600 },
        { src: "/projects/aurelia-estate/2.jpg", width: 1024, height: 1536 },
      ],
    },
  ],
} as const;

/**
 * Frame sequence config for the cinematic scroll.
 *
 * The files in /public/frames are the two supplied source folders (240 + 187
 * = 427 continuous 3840x2160 frames) downscaled to 1920x1080 at q90 and
 * concatenated in order — folder 1 first, then folder 2, which continue the
 * same unbroken camera move.
 *
 * EVERY frame is present now; there is no decimation. The sequence was
 * previously every 3rd frame (143 of them) purely to fit a full preload in
 * memory, and that is what made the scrub choppy: 143 frames across 900vh of
 * scroll is ~57px per frame, so an ordinary scroll speed advances only ~18
 * frames a second. At 427 it is ~19px per frame, ~52/s.
 *
 * Holding all of those decoded is impossible — decoded cost is
 * width x height x 4 whatever the JPEG weighs, so 427 at 1920x1080 is ~3.5 GB
 * (at the 3840x2160 source, ~14 GB). CinematicScroll therefore streams them
 * through a sliding window of ImageBitmaps rather than preloading; see
 * DECODE_WINDOW there. That decoupling is what allows frame count and
 * resolution to both go up at once.
 *
 * 1920x1080 rather than the source resolution because the canvas cover-fits to
 * the viewport at up to 2x DPR — roughly 2880px wide at most — so 4K frames
 * would be discarded on the way to the screen while costing 4x the memory to
 * hold. 1080p is at or above the backing store on a 1x display and a mild
 * upscale on 2x, which is where the grade survives without the waste.
 */
const FRAME_COUNT = 427;

export const sequence = {
  /** Number of frames actually loaded and drawn. */
  frameCount: FRAME_COUNT,
  /** Maps a 0-based sequence index to its file on disk. */
  path: (i: number) => `/frames/frame_${String(i + 1).padStart(3, "0")}.jpg`,
  width: 1920,
  height: 1080,
  /**
   * Phone variant: the centre 960x1080 of every frame above, cut from the same
   * files at the same JPEG quality (37.7 MB for the set against 69.8 MB).
   *
   * A portrait screen cover-fits the full frame by height and only ever shows
   * this centre band, so drawing the crop puts the identical pixels in the
   * identical place. CinematicScroll decides which set a screen gets; see
   * PORTRAIT_MAX_ASPECT there. Regenerate it whenever /frames is re-exported.
   */
  portrait: {
    path: (i: number) =>
      `/frames-portrait/frame_${String(i + 1).padStart(3, "0")}.jpg`,
    width: 960,
    height: 1080,
  },
} as const;
