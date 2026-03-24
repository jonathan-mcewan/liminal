import { colorOverrides, seedOverrides, clearAllOverrides } from "./state.js";
import { artCountLabel } from "./constants.js";

/**
 * Gather all current card settings into a plain object (JSON-serialisable).
 * Key names match URL params for consistency.
 */
export function gatherSettings(dom) {
  const obj = { v: 1 };

  // Standard params (always present)
  obj.seed        = dom.seedInput.value;
  obj.csize       = dom.cardSize;
  obj.bgstyle     = dom.bgStyleSelect.value;
  obj.lstyle      = dom.logoStyleSelect.value;
  obj.lscale      = dom.logoScaleSlider.value;
  obj.zoom        = dom.noiseZoomSlider.value;
  obj.name        = dom.personNameInput.value.trim();
  obj.title       = dom.jobTitleInput.value.trim();
  obj.art_show    = dom.showArtifactsToggle.checked ? "1" : "0";
  obj.art_count   = dom.artCountSlider.value;
  obj.art_opacity = dom.artOpacitySlider.value;
  obj.art_scale   = dom.artScaleSlider.value;
  obj.art_type    = dom.artTypeLock ? dom.artTypeLock.join(',') : '';
  obj.pat_type    = dom.patternTypeSelect.value;
  obj.pat_opacity = dom.patternOpacitySlider.value;
  obj.pat_scale   = dom.patternScaleSlider.value;
  obj.lanyard     = dom.showLanyardToggle.checked ? "1" : "0";
  obj.bradius     = dom.borderRadiusSlider.value;
  obj.bblend      = dom.bgBlendMode.value;
  obj.pat_rot     = dom.patternRotationSlider.value;
  obj.emboss      = dom.embossMode || 'none';

  // Colour overrides (only if set)
  if (colorOverrides.isDark          !== undefined) obj.dark     = colorOverrides.isDark ? "1" : "0";
  if (colorOverrides.cardLightness   !== undefined) obj.litness  = String(colorOverrides.cardLightness);
  if (colorOverrides.hue             !== undefined) obj.hue      = String(colorOverrides.hue);
  if (colorOverrides.saturation      !== undefined) obj.sat      = String(colorOverrides.saturation);
  if (colorOverrides.noiseBrightness !== undefined) obj.nbright  = String(Math.round(colorOverrides.noiseBrightness * 100));
  if (colorOverrides.noiseContrast   !== undefined) obj.ncontrast = String(Math.round(colorOverrides.noiseContrast * 100));
  if (colorOverrides.patternTwoTone  !== undefined) obj.pat_2t   = colorOverrides.patternTwoTone ? "1" : "0";
  if (colorOverrides.bgBlur          !== undefined) obj.bblur    = String(Math.round(colorOverrides.bgBlur * 1000));

  // Seed overrides (only if set)
  if (seedOverrides.logoNonce        !== undefined) obj.nonce    = String(seedOverrides.logoNonce);
  if (seedOverrides.artifactSeed     !== undefined) obj.art_seed = String(seedOverrides.artifactSeed);
  if (seedOverrides.patternSeed      !== undefined) obj.pat_seed = String(seedOverrides.patternSeed);

  return obj;
}

/**
 * Apply a settings object (from gatherSettings or JSON import) to the DOM and override state.
 * Mirrors applyQueryString logic but reads from a plain object.
 */
export function applySettings(json, dom) {
  if (!json || json.v !== 1) throw new Error("Invalid or unsupported settings format");

  clearAllOverrides();

  const has = (k) => json[k] !== undefined && json[k] !== null;
  const get = (k) => String(json[k]);

  if (has("csize"))     dom.cardSize                      = get("csize");
  if (has("seed"))      dom.seedInput.value              = get("seed");
  if (has("lstyle"))    dom.logoStyleSelect.value        = get("lstyle");
  if (has("lscale"))  { dom.logoScaleSlider.value        = get("lscale");
                         dom.logoScaleDisplay.textContent = dom.logoScaleSlider.value + '%'; }
  if (has("bgstyle"))   dom.bgStyleSelect.value          = get("bgstyle");
  if (has("zoom"))    { dom.noiseZoomSlider.value        = get("zoom");
                         dom.noiseZoomDisplay.textContent = dom.noiseZoomSlider.value; }
  if (has("name"))      dom.personNameInput.value        = get("name");
  if (has("title"))     dom.jobTitleInput.value          = get("title");
  if (has("art_show"))  dom.showArtifactsToggle.checked  = get("art_show") !== "0";
  if (has("art_count")){ dom.artCountSlider.value        = get("art_count");
                          dom.artCountDisplay.textContent = artCountLabel(dom.artCountSlider.value); }
  if (has("art_opacity")){ dom.artOpacitySlider.value    = get("art_opacity");
                            dom.artOpacityDisplay.textContent = dom.artOpacitySlider.value; }
  if (has("art_scale")){ dom.artScaleSlider.value        = get("art_scale");
                          dom.artScaleDisplay.textContent = dom.artScaleSlider.value + '%'; }
  if (has("art_type")) {
    const raw = get("art_type");
    dom.artTypeLock = raw === '' ? null : raw.split(',').map(Number).filter(n => n >= 0 && n <= 10);
    if (dom.artTypeLock && dom.artTypeLock.length === 0) dom.artTypeLock = null;
  }
  if (has("pat_type"))  dom.patternTypeSelect.value      = get("pat_type");
  if (has("pat_opacity")){ dom.patternOpacitySlider.value = get("pat_opacity");
                            dom.patternOpacityDisplay.textContent = dom.patternOpacitySlider.value; }
  if (has("pat_scale")){ dom.patternScaleSlider.value    = get("pat_scale");
                          dom.patternScaleDisplay.textContent = dom.patternScaleSlider.value + '%'; }
  if (has("lanyard"))   dom.showLanyardToggle.checked    = get("lanyard") !== "0";
  if (has("bradius")) { dom.borderRadiusSlider.value     = get("bradius");
                         dom.borderRadiusDisplay.textContent = dom.borderRadiusSlider.value + '%'; }
  if (has("bblend"))    dom.bgBlendMode.value            = get("bblend");
  if (has("pat_rot")) { dom.patternRotationSlider.value  = get("pat_rot");
                         dom.patternRotationDisplay.textContent = dom.patternRotationSlider.value; }
  if (has("emboss"))    dom.embossMode                   = get("emboss");

  // Colour overrides
  if (has("dark"))      colorOverrides.isDark          = get("dark") !== "0";
  if (has("litness"))   colorOverrides.cardLightness   = parseInt(get("litness"),   10);
  if (has("hue"))       colorOverrides.hue             = parseInt(get("hue"),       10);
  if (has("sat"))       colorOverrides.saturation      = parseInt(get("sat"),       10);
  if (has("nbright"))   colorOverrides.noiseBrightness = parseInt(get("nbright"),   10) / 100;
  if (has("ncontrast")) colorOverrides.noiseContrast   = parseInt(get("ncontrast"), 10) / 100;
  if (has("pat_2t"))    colorOverrides.patternTwoTone  = get("pat_2t") !== "0";
  if (has("bblur"))     colorOverrides.bgBlur          = parseInt(get("bblur"), 10) / 1000;

  // Seed overrides
  if (has("nonce"))     seedOverrides.logoNonce    = parseInt(get("nonce"),    10);
  if (has("art_seed"))  seedOverrides.artifactSeed = parseInt(get("art_seed"), 10);
  if (has("pat_seed"))  seedOverrides.patternSeed  = parseInt(get("pat_seed"), 10);
}
