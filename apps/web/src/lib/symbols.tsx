import type { ReactNode } from "react";

/* SF Symbol name → icon mapping (task 3.2).
 *
 * Data-driven: each entry is plain vector data (stroke paths, circles,
 * rects) rendered by SfIcon as a licence-safe stroke lookalike — SF
 * Symbol glyphs themselves are Apple's and are never embedded. Unknown
 * names fall back to a question-mark badge so a prompt can still carry
 * the name verbatim.
 *
 * Coverage: every default icon used by the 24 part kinds, the common
 * tab-bar / toolbar symbols, and a general-purpose set for the picker.
 */

export interface SymbolData {
  paths?: string[];
  circles?: [number, number, number][];
  rects?: [number, number, number, number, number?][];
  filled?: boolean;
}

const p = (paths: string[], extra?: Partial<SymbolData>): SymbolData => ({ paths, ...extra });

export const SF_SYMBOLS: Record<string, SymbolData> = {
  house: p(["M3.5 11.2 12 4l8.5 7.2", "M6 9.8V20h12V9.8"]),
  "house.fill": p(["M3.5 11.2 12 4l8.5 7.2", "M6 9.8V20h12V9.8"], { filled: true }),
  magnifyingglass: p(["m15.5 15.5 5 5"], { circles: [[10.5, 10.5, 6.5]] }),
  gearshape: p(["M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"], { circles: [[12, 12, 3.2]] }),
  star: p(["m12 3.5 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7L12 3.5Z"]),
  "star.fill": p(["m12 3.5 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7L12 3.5Z"], { filled: true }),
  heart: p(["M12 20.5S3.5 15.4 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.1-8.5 11.2-8.5 11.2Z"]),
  "heart.fill": p(["M12 20.5S3.5 15.4 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.1-8.5 11.2-8.5 11.2Z"], { filled: true }),
  plus: p(["M12 4v16M4 12h16"]),
  minus: p(["M4 12h16"]),
  xmark: p(["M5 5l14 14M19 5L5 19"]),
  checkmark: p(["m4.5 12.5 5 5 10-11"]),
  "chevron.right": p(["m9.5 5 7 7-7 7"]),
  "chevron.left": p(["m14.5 5-7 7 7 7"]),
  "chevron.down": p(["m5 9.5 7 7 7-7"]),
  "chevron.up.chevron.down": p(["m8 4-3.5 3.5L8 11M8 20l3.5-3.5L8 13", "m16 13 3.5 3.5L16 20M16 4l-3.5 3.5L16 11"]),
  "ellipsis.circle": p([], { circles: [[12, 12, 9], [5.5, 12, 0.4], [12, 12, 0.4], [18.5, 12, 0.4]] }),
  ellipsis: p([], { circles: [[5, 12, 1.2], [12, 12, 1.2], [19, 12, 1.2]] }),
  photo: p(["m5 18 4.5-4.5 3 3L17 12l2 2"], { rects: [[3, 4, 18, 16, 2]], circles: [[9, 9.5, 1.8]] }),
  tray: p(["M3 13h5l2 3h4l2-3h5", "M4 6.5h16V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z"]),
  bell: p(["M6 16v-5a6 6 0 0 1 12 0v5l1.5 3h-15L6 16Z", "M10 21a2.2 2.2 0 0 0 4 0"]),
  "bell.fill": p(["M6 16v-5a6 6 0 0 1 12 0v5l1.5 3h-15L6 16Z", "M10 21a2.2 2.2 0 0 0 4 0"], { filled: true }),
  person: p(["M5 20.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5"], { circles: [[12, 8, 3.6]] }),
  "person.fill": p(["M5 20.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5"], { circles: [[12, 8, 3.6]], filled: true }),
  "person.2": p(["M3 19c.6-2.6 2.4-4 5-4s4.4 1.4 5 4", "M15.5 11.5a3.4 3.4 0 1 0-1.5-6.3M17 15.2c2 .4 3.4 1.7 3.9 3.8"], { circles: [[8, 8.5, 3.2]] }),
  lock: p(["M6 11V8a6 6 0 0 1 12 0v3"], { rects: [[4.5, 11, 15, 9.5, 2]] }),
  "lock.fill": p(["M6 11V8a6 6 0 0 1 12 0v3"], { rects: [[4.5, 11, 15, 9.5, 2]], filled: true }),
  eye: p(["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"], { circles: [[12, 12, 3]] }),
  "eye.slash": p(["M4 4l16 16", "M9.9 6.2A9.4 9.4 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.5M6 9A16.4 16.4 0 0 0 2.5 12S6 18 12 18c1 0 2-.2 2.9-.5"], { circles: [[12, 12, 3]] }),
  "slider.horizontal.3": p(["M4 7h9M17 7h3M4 17h3M11 17h9", "M15 4.5v5M9 14.5v5"]),
  "list.bullet": p(["M9 6.5h11M9 12h11M9 17.5h11"], { circles: [[4.5, 6.5, 0.6], [4.5, 12, 0.6], [4.5, 17.5, 0.6]] }),
  "square.grid.2x2": p([], { rects: [[4, 4, 7, 7, 1.5], [13, 4, 7, 7, 1.5], [4, 13, 7, 7, 1.5], [13, 13, 7, 7, 1.5]] }),
  calendar: p(["M5 5v-1M19 5v-1M3.5 9.5h17"], { rects: [[3.5, 4.5, 17, 16, 2]] }),
  clock: p(["M12 7v5l3.5 2"], { circles: [[12, 12, 8.8]] }),
  map: p(["M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z", "M9 4v14M15 6v14"]),
  "chart.bar": p(["M4 4v16h16"], { rects: [[7.5, 12, 2.6, 5, 0.6], [11.5, 9, 2.6, 8, 0.6], [15.5, 6.5, 2.6, 10.5, 0.6]] }),
  gauge: p(["M4.5 15a8.5 8.5 0 1 1 15 0", "M12 15l4-5.5"], { circles: [[12, 15, 1.2]] }),
  "text.bubble": p(["M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H12l-4.5 4v-4H5.5A1.5 1.5 0 0 1 4 13.5v-8Z", "M8 8.5h8M8 11.5h5"]),
  envelope: p(["m3.5 6.5 8.5 6 8.5-6"], { rects: [[3, 5, 18, 14, 2]] }),
  camera: p(["M8.5 7.5 10 4.5h4l1.5 3H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5h4.5Z"], { circles: [[12, 13, 3.4]] }),
  "music.note": p(["M9.5 18.5V6l10-2v11.5", "M9.5 18.5a2.8 2.5 0 1 1-1.4-2.2M19.5 15.5a2.8 2.5 0 1 1-1.4-2.2"]),
  "sun.max": p(["M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"], { circles: [[12, 12, 3.6]] }),
  moon: p(["M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"]),
  bookmark: p(["M6.5 3.5h11V21L12 16.8 6.5 21V3.5Z"]),
  "square.and.arrow.up": p(["M12 14.5v-11M8 6.3 12 2.8l4 3.5", "M5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7"]),
  trash: p(["M4 6.5h16M9.5 6V4h5v2M6.5 6.5l1 13h9l1-13", "M10 10.5v6M14 10.5v6"]),
  pencil: p(["m14.5 5 4.5 4.5L8 20.5l-5 1 1-5L14.5 5Z", "m12.8 6.7 4.5 4.5"]),
  "info.circle": p(["M12 11v5"], { circles: [[12, 12, 9], [12, 7.8, 0.5]] }),
  "exclamationmark.triangle": p(["M12 4 2.8 20h18.4L12 4Z", "M12 10v4.5"], { circles: [[12, 17, 0.5]] }),
  "questionmark.circle": p(["M9.5 9.3A2.6 2.6 0 1 1 12 12.2c-.8 0-1 .5-1 1.3"], { circles: [[12, 12, 9], [12, 17, 0.5]] }),
  folder: p(["M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2.5h8A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V7.5Z"]),
  tag: p(["M3.5 3.5H12L21 12.5a2 2 0 0 1 0 2.8l-5.7 5.7a2 2 0 0 1-2.8 0L3.5 12V3.5Z"], { circles: [[8, 8, 1.4]] }),
  creditcard: p(["M2.5 6.5h19M2.5 10.5h19"], { rects: [[2, 5, 20, 14.5, 2]] }),
  cart: p(["M2.5 3.5h2.2l2.4 12h10.6l2-8.5H6.2"], { circles: [[9.5, 20, 1.3], [17, 20, 1.3]] }),
  bag: p(["M5 8h14l-1.2 12.5H6.2L5 8Z", "M8.8 10.5V7a3.2 3.2 0 0 1 6.4 0v3.5"]),
  airplane: p(["M10.5 13.5 3 11l1.5-1.5 6 .5L15.5 4.2a2 2 0 0 1 3 2.4l-5 5.4.7 6.5-1.8 1-1-6Z"]),
  car: p(["M4.5 15.5 6 9.5A2 2 0 0 1 8 8h8a2 2 0 0 1 2 1.5L19.5 15.5M4.5 15.5h15M4.5 15.5v3.7h2.6M19.5 15.5v3.7h-2.6", "M8 15.7h.01M16 15.7h.01"], { circles: [[7.5, 19, 0.4]] }),
  bolt: p(["M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z"]),
  leaf: p(["M5 19C5 10 12 4.5 20 4.5c0 8-5.5 14.5-14 14.5M5 19c2-5 5.5-8.5 10-10.5"]),
  flame: p(["M12 21.5a6.5 6.5 0 0 1-6.5-6.5c0-3 1.7-5 3.2-6.8.4 1 1 1.8 2 2.3C11.4 8 12.6 5 15 3.5c-.3 2.8.7 4.4 1.7 6 1 1.5 1.8 3.2 1.8 5.5a6.5 6.5 0 0 1-6.5 6.5Z"]),
  book: p(["M12 6.5C10 4.8 7 4.3 4 4.5v13c3-.2 6 .3 8 2 2-1.7 5-2.2 8-2v-13c-3-.2-6 .3-8 2ZM12 6.5v13"]),
  "graduationcap": p(["m12 4.5 10 4.5-10 4.5L2 9l10-4.5Z", "M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"]),
  message: p(["M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H12l-4.5 4v-4H5.5A1.5 1.5 0 0 1 4 13.5v-8Z"]),
  phone: p(["M5 3.5h3.5L10 8 8 10a12.5 12.5 0 0 0 6 6l2-2 4.5 1.5v3.5a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 3 5.7a2 2 0 0 1 2-2.2Z"]),
  video: p(["m15 10.5 6-3.5v10l-6-3.5"], { rects: [[2.5, 6.5, 12.5, 11, 2]] }),
  mic: p(["M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"], { rects: [[9, 3, 6, 11, 3]] }),
  wifi: p(["M3 10a14 14 0 0 1 18 0M6 13.5a9.5 9.5 0 0 1 12 0M9 17a5 5 0 0 1 6 0"], { circles: [[12, 20, 0.7]] }),
  location: p(["M12 21.5S5 15.6 5 10a7 7 0 0 1 14 0c0 5.6-7 11.5-7 11.5Z"], { circles: [[12, 10, 2.6]] }),
  paperplane: p(["M21 3 10.2 13.8M21 3l-6.8 18-3.4-7.2L3.5 10.4 21 3Z"]),
  "doc.text": p(["M13.5 3.5v5H19", "M13.5 3.5H6.5v17h11V8.5"], { }),
  link: p(["M10 14.5a4 4 0 0 0 6 .4l3-3a4 4 0 1 0-5.6-5.6l-1.7 1.7", "M14 9.5a4 4 0 0 0-6-.4l-3 3a4 4 0 1 0 5.6 5.6l1.7-1.7"]),
  globe: p(["M12 3v18M3.5 9h17M3.5 15h17", "M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"], { circles: [[12, 12, 9]] }),
  sparkles: p(["M11 4.5 12.3 9 16.5 10.5 12.3 12 11 16.5 9.7 12 5.5 10.5 9.7 9 11 4.5Z", "M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"]),
  "arrow.right": p(["M3.5 12h16M14 6l6 6-6 6"]),
  "arrow.left": p(["M20.5 12h-16M10 6l-6 6 6 6"]),
  "arrow.up.right": p(["M6 18 18 6M9 6h9v9"]),
  play: p(["M8 5.5v13l11-6.5-11-6.5Z"]),
  pause: p([], { rects: [[7, 5, 3.4, 14, 1], [13.6, 5, 3.4, 14, 1]] }),
  stopwatch: p(["M12 8v4.5l3 2M9 2.8h6M12 2.8V6"], { circles: [[12, 14, 7.5]] }),
  dumbbell: p(["M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10"]),
  fork: p(["M7 3v6M4.5 3v3.5a2.5 2.5 0 0 0 5 0V3M7 9v12M17 3c-1.8 1.2-2.8 3.4-2.8 6 0 2 .8 3 2.8 3v9"]),
};

/** All symbol names available in the icon picker, sorted. */
export const SYMBOL_NAMES: string[] = Object.keys(SF_SYMBOLS).sort();

export function hasSymbol(name: string | null | undefined): boolean {
  return !!name && name in SF_SYMBOLS;
}

export function SfIcon({ name, size = 20 }: { name?: string | null; size?: number }): ReactNode {
  const data = name ? SF_SYMBOLS[name] : undefined;
  if (!data) {
    // Fallback badge: a question mark in a circle. The SF Symbol name
    // still travels verbatim in the document and the prompt.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.3A2.6 2.6 0 1 1 12 12.2c-.8 0-1 .5-1 1.3" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={data.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {data.rects?.map(([x, y, w, h, r], i) => (
        <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={r ?? 0} />
      ))}
      {data.paths?.map((d, i) => (
        <path key={`p${i}`} d={d} />
      ))}
      {data.circles?.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}
