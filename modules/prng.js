/**
 * Creates a mulberry32 pseudo-random number generator.
 * Same seed always produces the same sequence — all visual variation is deterministic.
 */
export function makePRNG(seed) {
  let state = seed >>> 0;

  // Advance state and return a float in [0, 1)
  function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  }

  return {
    next,
    /** Random integer in [min, max] inclusive */
    int:   (min, max) => (next() * (max - min + 1) | 0) + min,
    /** Random float in [min, max) */
    float: (min, max) =>  next() * (max - min) + min,
  };
}

/**
 * Combines two 32-bit values into a new seed.
 * Used to derive the logo PRNG seed from the card seed + logo nonce,
 * so the two PRNGs stay statistically independent.
 */
export function mixSeeds(a, b) {
  let h = (a >>> 0) ^ Math.imul((b >>> 0) + 1, 0x9E3779B9);
  h = Math.imul(h ^ (h >>> 16), 0x45D9F3B);
  h = Math.imul(h ^ (h >>> 16), 0x45D9F3B);
  return (h ^ (h >>> 16)) >>> 0;
}
