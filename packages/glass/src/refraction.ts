/* Rim refraction for the Liquid Glass material (design D4, layer 1).
 *
 * The displacement map is a rounded-rect SVG whose centre is neutral
 * (rgb 128,128,128 = no shift) and whose rim carries red/green gradients:
 * the X displacement grows toward the left/right edges and the Y
 * displacement toward the top/bottom edges, so the backdrop bends only
 * at the rim — the way real glass lenses its edge. An SVG filter
 * (feImage + feDisplacementMap) applies that map; Chromium honours it in
 * `backdrop-filter: url(...)`, other browsers ignore the url() layer and
 * keep the frost layer underneath.
 */

export interface DisplacementOptions {
  width: number;
  height: number;
  /** Corner radius of the shape, in pt. */
  radius: number;
  /** Width of the refracting rim, in pt. Default 18. */
  edge?: number;
  /** Displacement strength passed to feDisplacementMap. Default 24. */
  scale?: number;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** A data-URI SVG displacement map for a rounded rect of the given size. */
export function displacementMapDataUri(opts: DisplacementOptions): string {
  const { width, height, radius } = opts;
  const edge = Math.max(4, Math.min(opts.edge ?? 18, Math.min(width, height) / 2));
  // Rim strength profile: 128 at the inner edge of the rim, extreme at the
  // outer edge. The four edge gradients are painted as rects with
  // linearGradient fills in the R (x) and G (y) channels.
  const lo = 128 - 90;
  const hi = 128 + 90;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<defs>`,
    `<linearGradient id="gx" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0" stop-color="rgb(${clamp255(lo)},128,128)"/>`,
    `<stop offset="${edge / width}" stop-color="rgb(128,128,128)"/>`,
    `<stop offset="${1 - edge / width}" stop-color="rgb(128,128,128)"/>`,
    `<stop offset="1" stop-color="rgb(${clamp255(hi)},128,128)"/>`,
    `</linearGradient>`,
    `<linearGradient id="gy" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0" stop-color="rgb(128,${clamp255(lo)},128)"/>`,
    `<stop offset="${edge / height}" stop-color="rgb(128,128,128)"/>`,
    `<stop offset="${1 - edge / height}" stop-color="rgb(128,128,128)"/>`,
    `<stop offset="1" stop-color="rgb(128,${clamp255(hi)},128)"/>`,
    `</linearGradient>`,
    `<clipPath id="clip"><rect width="${width}" height="${height}" rx="${radius}"/></clipPath>`,
    `</defs>`,
    `<g clip-path="url(#clip)">`,
    `<rect width="${width}" height="${height}" fill="rgb(128,128,128)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#gx)" style="mix-blend-mode:lighten"/>`,
    `<rect width="${width}" height="${height}" fill="url(#gy)" style="mix-blend-mode:darken"/>`,
    `</g>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** The SVG filter markup (as a string) that applies the map. The filter
 *  id must be unique per element size/radius combination. */
export function displacementFilterId(width: number, height: number, radius: number): string {
  return `sc-glass-refract-${width}x${height}-r${radius}`;
}

export interface FilterSpec {
  id: string;
  mapUri: string;
  scale: number;
}

export function displacementFilter(opts: DisplacementOptions): FilterSpec {
  return {
    id: displacementFilterId(opts.width, opts.height, opts.radius),
    mapUri: displacementMapDataUri(opts),
    scale: opts.scale ?? 24,
  };
}
