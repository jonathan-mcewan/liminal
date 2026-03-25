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
  if (q.has("bgstyle")) { dom.bgStyleSelect.value           = q.get("bgstyle"); }
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
  if (q.has("pat_type"))  { dom.patternTypeSelect.value     = q.get("pat_type"); }
  if (q.has("pat_opacity")){ dom.patternOpacitySlider.value = q.get("pat_opacity");
                              dom.patternOpacityDisplay.textContent = dom.patternOpacitySlider.value; }
  if (q.has("pat_scale"))  { dom.patternScaleSlider.value   = q.get("pat_scale");
                              dom.patternScaleDisplay.textContent = dom.patternScaleSlider.value + '%'; }
  if (q.has("lanyard"))   dom.showLanyardToggle.checked    = q.get("lanyard")   !== "0";
  if (q.has("bradius")) { dom.borderRadiusSlider.value     = q.get("bradius");
                           dom.borderRadiusDisplay.textContent = dom.borderRadiusSlider.value + '%'; }
  if (q.has("bblend"))   dom.bgBlendMode.value             = q.get("bblend");
  if (q.has("pat_rot")) { dom.patternRotationSlider.value  = q.get("pat_rot");
                           dom.patternRotationDisplay.textContent = dom.patternRotationSlider.value; }
  if (q.has("emboss"))    dom.embossMode                  = q.get("emboss");
  if (q.has("lpos"))      dom.logoPosition               = q.get("lpos");
  if (q.has("tpos"))      dom.textPosition               = q.get("tpos");
  if (q.has("art_type")) {
    const raw = q.get("art_type");
    dom.artTypeLock = raw === '' ? null : raw.split(',').map(Number).filter(n => n >= 0 && n <= 10);
    if (dom.artTypeLock && dom.artTypeLock.length === 0) dom.artTypeLock = null;
  }

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
  if (q.has("pat_seed")) seedOverrides.patternSeed  = parseInt(q.get("pat_seed"), 10);
  if (q.has("pat_2t"))  colorOverrides.patternTwoTone = q.get("pat_2t") !== "0";
  if (q.has("bblur"))   colorOverrides.bgBlur       = parseInt(q.get("bblur"), 10) / 1000;
}

// ── State → URL ─────────────────────────────────────────────────────────
// push=true  → pushState    (navigable: shuffle, seed change, discrete actions)
// push=false → replaceState (continuous: slider drag, text typing)

export function syncURL(dom, push = false) {
  // Always include seed and identity
  const q = new URLSearchParams({ seed: dom.seedInput.value });
  const name  = dom.personNameInput.value.trim();
  const title = dom.jobTitleInput.value.trim();
  if (name)  q.set("name",  name);
  if (title) q.set("title", title);

  // Only include params that differ from their defaults
  const set = (key, val, def) => { if (String(val) !== String(def)) q.set(key, val); };

  set("csize",       dom.cardSize,                                        "id");
  set("bgstyle",     dom.bgStyleSelect.value,                             "-1");
  set("lstyle",      dom.logoStyleSelect.value,                           "-1");
  set("lscale",      dom.logoScaleSlider.value,                           "100");
  set("zoom",        dom.noiseZoomSlider.value,                           "4");
  set("art_show",    dom.showArtifactsToggle.checked ? "1" : "0",         "0");
  set("art_count",   dom.artCountSlider.value,                            "0");
  set("art_opacity", dom.artOpacitySlider.value,                          "20");
  set("art_scale",   dom.artScaleSlider.value,                            "100");
  set("pat_type",    dom.patternTypeSelect.value,                         "-1");
  set("pat_opacity", dom.patternOpacitySlider.value,                      "15");
  set("pat_scale",   dom.patternScaleSlider.value,                        "100");
  set("lanyard",     dom.showLanyardToggle.checked ? "1" : "0",           "0");
  set("bradius",     dom.borderRadiusSlider.value,                        "20");
  set("bblend",      dom.bgBlendMode.value,                               "source-over");
  set("pat_rot",     dom.patternRotationSlider.value,                     "0");
  set("emboss",      dom.embossMode || "none",                            "none");
  set("lpos",        dom.logoPosition || "ct",                            "ct");
  set("tpos",        dom.textPosition || "lb",                            "lb");
  if (dom.artTypeLock) q.set("art_type", dom.artTypeLock.join(","));

  // Colour overrides — only if user has set them
  if (colorOverrides.isDark          !== undefined) q.set("dark",     colorOverrides.isDark ? "1" : "0");
  if (colorOverrides.cardLightness   !== undefined) q.set("litness",  colorOverrides.cardLightness);
  if (colorOverrides.hue             !== undefined) q.set("hue",      colorOverrides.hue);
  if (colorOverrides.saturation      !== undefined) q.set("sat",      colorOverrides.saturation);
  if (colorOverrides.noiseBrightness !== undefined) q.set("nbright",  Math.round(colorOverrides.noiseBrightness * 100));
  if (colorOverrides.noiseContrast   !== undefined) q.set("ncontrast",Math.round(colorOverrides.noiseContrast   * 100));
  if (seedOverrides.logoNonce        !== undefined) q.set("nonce",    seedOverrides.logoNonce);
  if (seedOverrides.artifactSeed     !== undefined) q.set("art_seed", seedOverrides.artifactSeed);
  if (seedOverrides.patternSeed      !== undefined) q.set("pat_seed", seedOverrides.patternSeed);
  if (colorOverrides.patternTwoTone  !== undefined) q.set("pat_2t",   colorOverrides.patternTwoTone ? "1" : "0");
  if (colorOverrides.bgBlur          !== undefined) q.set("bblur",    Math.round(colorOverrides.bgBlur * 1000));
  const url = "?" + q.toString();
  if (push) history.pushState(null, "", url);
  else      history.replaceState(null, "", url);
}
