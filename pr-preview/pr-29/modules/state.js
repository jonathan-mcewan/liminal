import { makePRNG }          from "./prng.js";
import { deriveColorParams } from "./card.js";

// ── Override state ──────────────────────────────────────────────────────
// Only keys that the user has explicitly set are present.
// Absent key → use seed-derived default.
export const colorOverrides = {};  // isDark | cardLightness | hue | saturation | noiseBrightness | noiseContrast | patternTwoTone | bgBlur
export const seedOverrides  = {};  // logoNonce | artifactSeed | patternSeed

export function clearColorOverrides() {
  delete colorOverrides.isDark;
  delete colorOverrides.cardLightness;
  delete colorOverrides.hue;
  delete colorOverrides.saturation;
  delete colorOverrides.noiseBrightness;
  delete colorOverrides.noiseContrast;
  delete colorOverrides.patternTwoTone;
  delete colorOverrides.bgBlur;
}

export function clearAllOverrides() {
  clearColorOverrides();
  delete seedOverrides.logoNonce;
  delete seedOverrides.artifactSeed;
  delete seedOverrides.patternSeed;
}

// ── Seed-derived defaults ───────────────────────────────────────────────

export function deriveSeedParams(seed) {
  const p = makePRNG(seed ^ 0xDEADBEEF);
  return {
    logoNonce:    p.int(0, 99999),
    artifactSeed: p.int(0, 99999),
    patternSeed:  p.int(0, 99999),
  };
}

// ── Effective values (override ?? seed-derived) ─────────────────────────

export function getEffectiveColor(seed) {
  const derived = deriveColorParams(seed);
  const effectiveIsDark = colorOverrides.isDark ?? derived.isDark;
  // When isDark is overridden to the opposite mode, use the alt derived lightness
  // so the slider shows a sensible value for the new mode.
  const derivedLightness = effectiveIsDark === derived.isDark
    ? derived.cardLightness
    : derived.altCardLightness;
  return {
    isDark:          effectiveIsDark,
    cardLightness:   colorOverrides.cardLightness   ?? derivedLightness,
    hue:             colorOverrides.hue             ?? derived.hue,
    saturation:      colorOverrides.saturation      ?? derived.saturation,
    noiseBrightness: colorOverrides.noiseBrightness ?? derived.noiseBrightness,
    noiseContrast:      colorOverrides.noiseContrast   ?? derived.noiseContrast,
    patternTwoTone:    colorOverrides.patternTwoTone  ?? derived.patternTwoTone,
    bgBlur:            colorOverrides.bgBlur          ?? derived.bgBlur,
  };
}

export function getEffectiveSeeds(seed) {
  const derived = deriveSeedParams(seed);
  return {
    logoNonce:    seedOverrides.logoNonce    ?? derived.logoNonce,
    artifactSeed: seedOverrides.artifactSeed ?? derived.artifactSeed,
    patternSeed:  seedOverrides.patternSeed  ?? derived.patternSeed,
  };
}
