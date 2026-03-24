import { makePRNG }                          from "./prng.js";
import { CARD_SIZES, LOGO_NAMES, hashString, hueToColorName } from "./constants.js";
import { colorOverrides, seedOverrides, getEffectiveColor, getEffectiveSeeds } from "./state.js";

// ── Seed helper — accepts numbers or text ───────────────────────────────

export function getSeed(dom) {
  const raw = dom.seedInput.value.trim();
  const n = parseInt(raw, 10);
  if (!isNaN(n) && String(n) === raw) return n | 0;
  return hashString(raw);
}

// ── Slider / display sync ───────────────────────────────────────────────

export function updateThemeSeg(dom, isDark) {
  dom.themeLightBtn.classList.toggle("active", !isDark);
  dom.themeDarkBtn.classList.toggle("active",   isDark);
}

export function updateColorSliders(dom) {
  const c = getEffectiveColor(getSeed(dom));
  updateThemeSeg(dom, c.isDark);
  dom.cardLightnessSlider.value        = c.cardLightness;
  dom.cardLightnessDisplay.textContent = c.cardLightness;
  dom.hueSlider.value                  = c.hue;
  dom.hueDisplay.textContent           = c.hue;
  dom.saturationSlider.value           = c.saturation;
  dom.saturationDisplay.textContent    = c.saturation;
  dom.noiseBrightnessSlider.value      = Math.round(c.noiseBrightness * 100);
  dom.noiseBrightnessDisplay.textContent = Math.round(c.noiseBrightness * 100);
  dom.noiseContrastSlider.value        = Math.round(c.noiseContrast * 100);
  dom.noiseContrastDisplay.textContent = Math.round(c.noiseContrast * 100);
}

export function updateSeedInputs(dom) {
  const s = getEffectiveSeeds(getSeed(dom));
  dom.logoNonceInput.value    = s.logoNonce;
  dom.artifactSeedInput.value = s.artifactSeed;
}

export function updateResetButtons(dom) {
  dom.isDarkReset.classList.toggle('visible',            colorOverrides.isDark          !== undefined);
  dom.cardLightnessReset.classList.toggle('visible',     colorOverrides.cardLightness   !== undefined);
  dom.hueReset.classList.toggle('visible',               colorOverrides.hue             !== undefined);
  dom.saturationReset.classList.toggle('visible',        colorOverrides.saturation      !== undefined);
  dom.noiseBrightnessReset.classList.toggle('visible',   colorOverrides.noiseBrightness !== undefined);
  dom.noiseContrastReset.classList.toggle('visible',     colorOverrides.noiseContrast   !== undefined);
  dom.logoScaleReset.classList.toggle('visible',         parseInt(dom.logoScaleSlider.value, 10) !== 100);
  dom.logoNonceReset.classList.toggle('visible',         seedOverrides.logoNonce        !== undefined);
  dom.artifactSeedReset.classList.toggle('visible',      seedOverrides.artifactSeed     !== undefined);
}

export function updateLogoName(dom) {
  const override = parseInt(dom.logoStyleSelect.value, 10);
  if (override >= 0) {
    dom.logoNameDisplay.textContent = '';
  } else {
    const seed  = getSeed(dom);
    const style = makePRNG(seed ^ 0x9E3779B9).int(0, 24);
    dom.logoNameDisplay.textContent = `[${LOGO_NAMES[style]}]`;
  }
}

// ── Build params for generateCard ───────────────────────────────────────

export function buildParams(dom) {
  const seed  = getSeed(dom);
  const color = getEffectiveColor(seed);
  const seeds = getEffectiveSeeds(seed);
  const sizePreset = CARD_SIZES[dom.cardSize] || CARD_SIZES.id;
  return {
    size:                  1024,
    padding:               0.08,
    cardAspect:            sizePreset.aspect,
    cardScale:             sizePreset.scale,
    seed,
    logoNonce:             seeds.logoNonce,
    logoStyle:             parseInt(dom.logoStyleSelect.value, 10),
    logoScale:             parseInt(dom.logoScaleSlider.value, 10) / 100,
    hue:                   color.hue,
    isDarkOverride:        colorOverrides.isDark          !== undefined ? colorOverrides.isDark          : null,
    cardLightnessOverride: colorOverrides.cardLightness   !== undefined ? colorOverrides.cardLightness   : null,
    saturationOverride:    colorOverrides.saturation      !== undefined ? colorOverrides.saturation      : null,
    noiseZoom:             parseInt(dom.noiseZoomSlider.value, 10) | 0,
    noiseBrightness:       color.noiseBrightness,
    noiseContrast:         color.noiseContrast,
    personName:            dom.personNameInput.value.trim(),
    jobTitle:              dom.jobTitleInput.value.trim(),
    artifactSeed:          seeds.artifactSeed,
    artifactOpacity:       parseInt(dom.artOpacitySlider.value, 10) / 100,
    artifactCount:         parseInt(dom.artCountSlider.value, 10) === 0 ? null : parseInt(dom.artCountSlider.value, 10),
    artifactScale:         parseInt(dom.artScaleSlider.value, 10) / 100,
    showArtifacts:         dom.showArtifactsToggle.checked,
    showLanyard:           dom.showLanyardToggle.checked,
  };
}

// ── Card descriptor ─────────────────────────────────────────────────────

export function getCardDescriptor(dom) {
  const seed     = getSeed(dom);
  const color    = getEffectiveColor(seed);
  const raw      = dom.seedInput.value.trim();
  const isText   = String(seed) !== raw;
  const seedLabel = isText ? `${raw} (#${seed})` : `#${seed}`;
  const theme    = color.isDark ? 'Dark' : 'Light';
  const SIZE_LABELS = { id: null, square: 'Square', moo: 'MOO' };
  const sizeLabel = SIZE_LABELS[dom.cardSize] ?? null;
  const name     = dom.personNameInput.value.trim();
  const parts    = [sizeLabel, theme, name && name, seedLabel].filter(Boolean);
  return parts.join(' · ');
}

export function updateDescriptor(dom) {
  const desc = getCardDescriptor(dom);
  dom.cardDescriptor.textContent = desc;
  document.title = `LIMINAL · ${desc}`;
}

// ── Frame dimensions ────────────────────────────────────────────────────

export function getFrameDims(dom) {
  const sizePreset = CARD_SIZES[dom.cardSize] || CARD_SIZES.id;
  const sz = 1024, pad = 0.08;
  const refDim = sz * (1 - 2 * pad);
  let cw, ch;
  if (sizePreset.aspect <= 1) { ch = refDim * sizePreset.scale; cw = ch * sizePreset.aspect; }
  else                        { cw = refDim * sizePreset.scale; ch = cw / sizePreset.aspect; }
  return { frameW: cw, frameH: ch };
}
