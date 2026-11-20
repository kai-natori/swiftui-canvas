/* Licence-safe lookalike icons for SF Symbol names used in the lab.
 * SF Symbol glyphs themselves are Apple's and are not embedded; these
 * are simple stroke drawings in the same spirit.
 */

interface IconProps {
  size?: number;
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function HouseIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3.5 11.2 12 4l8.5 7.2" />
      <path d="M6 9.8V20h12V9.8" />
    </svg>
  );
}

export function SearchIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

export function GearIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export function ShareIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 15V3.5M8 6.5 12 2.8l4 3.7" />
      <path d="M5 12.5v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19.5v-7" />
    </svg>
  );
}

export function EllipsisIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

export function PlusIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function HeartIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 20.5S3.5 15.4 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.1-8.5 11.2-8.5 11.2Z" />
    </svg>
  );
}

export function StarIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m12 3.5 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8L8 13.5l-4.3-4 5.8-.7L12 3.5Z" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}
