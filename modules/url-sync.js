import { colorOverrides, seedOverrides, clearAllOverrides } from "./state.js";
import { artCountLabel } from "./constants.js";

// ── URL → state ─────────────────────────────────────────────────────────
// Clears all overrides first so stale values don't bleed through.

export function applyQueryString(dom) {
  clearAllOverrides();
  const q = new URLSearchParams(location.search);

  if (q.has("csize"))     dom.cardSize                      = q.get("csize");
  if (q.has("seed"))      dom.seedInput.value              = q.get("seed");
  if (q.has("lstyle"))    dom.logoStyleSelect.value        = q.get("lstyle");
  if (q.has("lscale"))  { dom.logoScaleSlider.value        = q.get("lscale");
                           dom.logoScaleDisplay.textContent = dom.logoScaleSlider.value + '%'; }
  if (q.has("zoom"))    { dom.noiseZoomSlider.value        = q.get("zoom");
                           dom.noiseZoomDisplay.textContent = dom.noiseZoomSlider.value; }
  if (q.has("name"))      dom.personNameInput.value        = q.get("name");
  if (q.has("title"))     dom.jobTitleInput.value          = q.get("title");
  if (q.has("art_show"))    dom.showArtifactsToggle.checked = q.get("art_show")  !== "0";
  if (q.has("art_count"))  { dom.artCountSlider.value   = q.get("art_count");
                              dom.artCountDisplay.textContent = artCountLabel(dom.artCountSlider.value); }
  if (q.has("art_opacity")){ dom.artOpacitySlider.value  = q.get("art_opacity");
                              dom.artOpacityDisplay.textContent = dom.artOpacitySlider.value; }
  if (q.has("art_scale"))  { dom.artScaleSlider.value    = q.get("art_scale");
                              dom.artScaleDisplay.textContent = dom.artScaleSlider.value + '%'; }
  if (q.has("lanyard"))   dom.showLanyardToggle.checked    = q.get("lanyard")   !== "0";

  // Colour overrides — only in URL if user set them
  if (q.has("dark"))      colorOverrides.isDark          = q.get("dark")     !== "0";
  if (q.has("litness"))   colorOverrides.cardLightness   = parseInt(q.get("litness"),   10);
  if (q.has("hue"))       colorOverrides.hue             = parseInt(q.get("hue"),       10);
  if (q.has("sat"))       colorOverrides.saturation      = parseInt(q.get("sat"),       10);
  if (q.has("nbright"))   colorOverrides.noiseBrightness = parseInt(q.get("nbright"),   10) / 100;
  if (q.has("ncontrast")) colorOverrides.noiseContrast   = parseInt(q.get("ncontrast"), 10) / 100;

  // Seed overrides
  if (q.has("nonce"))     seedOverrides.logoNonce    = parseInt(q.get("nonce"),    10);
  if (q.has("art_seed"))  seedOverrides.artifactSeed = parseInt(q.get("art_seed"), 10);
}

// ── State → URL ─────────────────────────────────────────────────────────
// push=true  → pushState    (navigable: shuffle, seed change, discrete actions)
// push=false → replaceState (continuous: slider drag, text typing)

export function syncURL(dom, push = false) {
  const q = new URLSearchParams({
    seed:        dom.seedInput.value,
    csize:       dom.cardSize,
    lstyle:      dom.logoStyleSelect.value,
    lscale:      dom.logoScaleSlider.value,
    zoom:        dom.noiseZoomSlider.value,
    name:        dom.personNameInput.value.trim(),
    title:       dom.jobTitleInput.value.trim(),
    art_show:    dom.showArtifactsToggle.checked ? "1" : "0",
    art_count:   dom.artCountSlider.value,
    art_opacity: dom.artOpacitySlider.value,
    art_scale:   dom.artScaleSlider.value,
    lanyard:     dom.showLanyardToggle.checked   ? "1" : "0",
  });
  if (colorOverrides.isDark          !== undefined) q.set("dark",     colorOverrides.isDark ? "1" : "0");
  if (colorOverrides.cardLightness   !== undefined) q.set("litness",  colorOverrides.cardLightness);
  if (colorOverrides.hue             !== undefined) q.set("hue",      colorOverrides.hue);
  if (colorOverrides.saturation      !== undefined) q.set("sat",      colorOverrides.saturation);
  if (colorOverrides.noiseBrightness !== undefined) q.set("nbright",  Math.round(colorOverrides.noiseBrightness * 100));
  if (colorOverrides.noiseContrast   !== undefined) q.set("ncontrast",Math.round(colorOverrides.noiseContrast   * 100));
  if (seedOverrides.logoNonce        !== undefined) q.set("nonce",    seedOverrides.logoNonce);
  if (seedOverrides.artifactSeed     !== undefined) q.set("art_seed", seedOverrides.artifactSeed);
  const url = "?" + q.toString();
  if (push) history.pushState(null, "", url);
  else      history.replaceState(null, "", url);
}
