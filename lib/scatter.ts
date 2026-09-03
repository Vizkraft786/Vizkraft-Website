/**
 * Deterministic scatter layout for the archive overlay.
 *
 * Positions must be identical on server and client or React throws a hydration
 * mismatch, so this uses a seeded hash rather than Math.random(). The same
 * project always opens to the same arrangement, which also means the layout can
 * be judged and tuned rather than being different every time.
 *
 * Placement is a loose grid with jitter, not pure randomness: uniform random
 * points clump badly at these counts, leaving plates stacked in one corner and
 * dead space elsewhere. The grid guarantees spread, the jitter removes the
 * regularity, and the result reads as scattered while staying legible.
 */

/** mulberry32 — small, fast, stable across environments. */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export type Plate = {
  /** percentage of the overlay, for the plate's centre */
  x: number;
  y: number;
  /** viewport-width units */
  w: number;
  rotate: number;
  /** paint order — varied so plates interleave instead of stacking in sequence */
  z: number;
  ratio: "landscape" | "portrait" | "square";
};

const RATIOS: Plate["ratio"][] = ["landscape", "portrait", "square"];

export function scatter(projectIndex: number, count: number): Plate[] {
  // Columns scale with count so 6 plates aren't crammed into the same grid 9 use.
  const cols = count <= 6 ? 3 : count <= 8 ? 4 : 4;
  const rows = Math.ceil(count / cols);

  return Array.from({ length: count }, (_, i) => {
    const s = projectIndex * 997 + i * 131;
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Cell centre, inset from the edges so nothing runs off-screen.
    const cellW = 76 / cols;
    const cellH = 60 / rows;
    const baseX = 12 + cellW * (col + 0.5);
    const baseY = 20 + cellH * (row + 0.5);

    const ratio = RATIOS[(i + projectIndex) % RATIOS.length];

    return {
      x: baseX + (rand(s) - 0.5) * cellW * 0.5,
      y: baseY + (rand(s + 1) - 0.5) * cellH * 0.55,
      w: 13 + rand(s + 2) * 8,
      rotate: (rand(s + 3) - 0.5) * 16,
      z: 10 + Math.floor(rand(s + 4) * 40),
      ratio,
    };
  });
}
