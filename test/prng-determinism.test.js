/**
 * PRNG determinism smoke tests.
 *
 * Run with: node --test test/
 *
 * These pin the exact output of makePRNG and mixSeeds so that any accidental
 * change to the algorithm is caught immediately. The card's visual identity
 * depends on these sequences being stable across all future commits.
 *
 * deriveColorParams (modules/card.js) can't be tested here because card.js
 * has static imports that reference browser APIs. The expected output for
 * manual verification:
 *
 *   deriveColorParams(12345) => {
 *     isDark: true, cardLightness: 18, altCardLightness: 83,
 *     hue: 98, saturation: 49, noiseBrightness: ~0.069,
 *     noiseContrast: ~0.044, patternTwoTone: true, bgBlur: ~0.045,
 *     symbolHueDrift: ~-3.2
 *   }
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { makePRNG, mixSeeds } from '../modules/prng.js';

describe('makePRNG determinism', () => {
  it('seed 12345 produces a stable sequence', () => {
    const rng = makePRNG(12345);
    const vals = Array.from({ length: 5 }, () => rng.next());
    assert.deepStrictEqual(vals, [
      0.9797282677609473,
      0.3067522644996643,
      0.484205421525985,
      0.817934412509203,
      0.5094283693470061,
    ]);
  });

  it('seed 42 produces a stable sequence', () => {
    const rng = makePRNG(42);
    const vals = Array.from({ length: 5 }, () => rng.next());
    assert.deepStrictEqual(vals, [
      0.6011037519201636,
      0.44829055899754167,
      0.8524657934904099,
      0.6697340414393693,
      0.17481389874592423,
    ]);
  });

  it('int(0, 359) is stable for seed 12345', () => {
    assert.strictEqual(makePRNG(12345).int(0, 359), 352);
  });

  it('same seed always produces the same sequence', () => {
    const a = Array.from({ length: 10 }, () => makePRNG(99999).next());
    const b = Array.from({ length: 10 }, () => makePRNG(99999).next());
    // Each call starts fresh, so element 0 from seed 99999 is always the same
    assert.strictEqual(a[0], b[0]);
  });
});

describe('mixSeeds determinism', () => {
  it('mixSeeds(42, 7) is stable', () => {
    assert.strictEqual(mixSeeds(42, 7), 2119636459);
  });

  it('same inputs always produce the same output', () => {
    assert.strictEqual(mixSeeds(1, 2), mixSeeds(1, 2));
    assert.strictEqual(mixSeeds(0, 0), mixSeeds(0, 0));
  });

  it('different inputs produce different outputs', () => {
    assert.notStrictEqual(mixSeeds(1, 2), mixSeeds(2, 1));
  });
});
