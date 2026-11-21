import { useId, type CSSProperties, type ReactNode } from "react";

import { displacementFilter } from "./refraction";

/* Liquid Glass components. Icons are ReactNode drawn by the caller (the
 * web app uses licence-safe lookalikes of SF Symbols); this package ships
 * no icon library.
 *
 * Every surface renders three layers (see glass.css): the frost layer is
 * the element's own backdrop-filter; the refraction layer is an overlay
 * span whose backdrop-filter references the generated SVG filter by id —
 * browsers without backdrop-filter url() support ignore that layer and
 * keep the frost. The specular highlight is the ::before sheen.
 */

export interface GlassSurfaceProps {
  /** Corner radius in pt; 999 gives a capsule. */
  radius?: number;
  /** Element size, needed to generate the rim displacement map. When
   *  omitted, refraction is skipped and the surface is frost-only. */
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Set false to disable the refraction layer explicitly. */
  refraction?: boolean;
}

export function GlassSurface(props: GlassSurfaceProps) {
  const { radius = 24, width, height, className, style, children, refraction = true } = props;
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filter =
    refraction && width !== undefined && height !== undefined
      ? displacementFilter({ width, height, radius: Math.min(radius, height / 2) })
      : null;
  const filterId = filter ? `${filter.id}-${rawId}` : null;

  return (
    <div
      className={className ? `sc-glass ${className}` : "sc-glass"}
      style={{ width, height, borderRadius: radius, ...style }}
    >
      {filter && filterId ? (
        <>
          <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
                <feImage href={filter.mapUri} preserveAspectRatio="none" x="0" y="0" width="100%" height="100%" />
                <feDisplacementMap in="SourceGraphic" scale={filter.scale} xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <span
            className="sc-glass__refract"
            style={{ backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }}
          />
        </>
      ) : null}
      <div className="sc-glass__content">{children}</div>
    </div>
  );
}

export interface GlassButtonProps {
  variant?: "glass" | "glassProminent";
  /** Accent colour (hex); sets the prominent tint via --sc-accent. */
  accent?: string;
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
}

export function GlassButton(props: GlassButtonProps) {
  const { variant = "glass", accent, onClick, children, style } = props;
  const merged: CSSProperties = {
    ...(accent ? ({ "--sc-accent": accent } as CSSProperties) : {}),
    ...style,
  };
  return (
    <GlassSurface radius={999} width={361} height={50} className="sc-glass-button" style={merged}>
      <button
        type="button"
        data-variant={variant}
        onClick={onClick}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          height: "100%",
          cursor: "pointer",
          color: variant === "glassProminent" ? "#fff" : "var(--sc-label)",
          background: variant === "glassProminent" ? "color-mix(in srgb, var(--sc-accent) 68%, transparent)" : "transparent",
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 17,
        }}
      >
        {children}
      </button>
    </GlassSurface>
  );
}

export interface GlassToolbarButtonProps {
  label: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function GlassToolbarButton(props: GlassToolbarButtonProps) {
  return (
    <GlassSurface radius={999} width={44} height={44} className="sc-toolbar-button">
      <button
        type="button"
        aria-label={props.label}
        title={props.label}
        onClick={props.onClick}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          cursor: "pointer",
          borderRadius: 999,
          color: "var(--sc-label)",
        }}
      >
        {props.children}
      </button>
    </GlassSurface>
  );
}

export interface GlassAlertAction {
  label: string;
  /** "cancel" renders regular weight; "destructive" renders red. */
  role?: "default" | "cancel" | "destructive";
}

export interface GlassAlertProps {
  title: string;
  message?: string;
  actions: GlassAlertAction[];
  onAction?: (index: number) => void;
  width?: number;
  style?: CSSProperties;
}

/** The iOS alert card on the glass material: centred title/message and a
 *  button row split by hairlines. Used by the preview's presentation
 *  layer and rendered in place on the canvas for alert parts. */
export function GlassAlert(props: GlassAlertProps) {
  const width = props.width ?? 270;
  return (
    <GlassSurface radius={28} width={width} height={180} className="sc-alert" style={props.style}>
      <div className="sc-alert__body">
        <div className="sc-alert__title">{props.title}</div>
        {props.message ? <div className="sc-alert__message">{props.message}</div> : null}
      </div>
      <div
        className="sc-alert__actions"
        style={{ gridTemplateColumns: `repeat(${Math.max(props.actions.length, 1)}, 1fr)` }}
      >
        {props.actions.map((a, i) => (
          <button
            key={i}
            type="button"
            className="sc-alert__action"
            data-role={a.role ?? (i === 0 && props.actions.length > 1 ? "cancel" : "default")}
            onClick={() => props.onAction?.(i)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </GlassSurface>
  );
}

export interface GlassSheetProps {
  /** Sheet width in pt; defaults to the full screen width. */
  width?: number;
  height?: number;
  onClose?: () => void;
  closeLabel?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

/** A bottom sheet shell on the glass material: rounded top corners, a
 *  grabber, and an optional circular glass close button at the top right
 *  (the iOS 26 sheet chrome). Content is supplied by the caller. */
export function GlassSheet(props: GlassSheetProps) {
  const width = props.width ?? 393;
  const height = props.height ?? 260;
  return (
    <GlassSurface
      radius={28}
      width={width}
      height={height}
      className="sc-sheet"
      style={props.style}
    >
      <div className="sc-sheet__grabber" aria-hidden="true" />
      {props.onClose ? (
        <button
          type="button"
          className="sc-sheet__close"
          aria-label={props.closeLabel ?? "Close"}
          onClick={props.onClose}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
      <div className="sc-sheet__content">{props.children}</div>
    </GlassSurface>
  );
}

export interface GlassTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface GlassTabBarProps {
  items: GlassTabItem[];
  selectedId: string;
  onSelect?: (id: string) => void;
  /** Bar width in pt; defaults to the 361pt floating-capsule width. */
  width?: number;
}

/** The floating capsule tab bar (liquid-glass spec): 62pt tall, fully
 *  rounded, never full-width, no separator; the selected tab sits on a
 *  brighter glass pill. Position it from the parent (16pt side insets,
 *  8pt above the screen bottom, home indicator outside the bar). */
export function GlassTabBar(props: GlassTabBarProps) {
  const width = props.width ?? 361;
  return (
    <GlassSurface radius={999} width={width} height={62} className="sc-tabbar">
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "0 6px", boxSizing: "border-box" }}>
        {props.items.map((item) => {
          const selected = item.id === props.selectedId;
          return (
            <button
              key={item.id}
              type="button"
              className="sc-tabbar__item"
              data-selected={selected ? "true" : "false"}
              aria-pressed={selected}
              onClick={() => props.onSelect?.(item.id)}
            >
              {item.icon ? <span className="sc-tabbar__icon">{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </GlassSurface>
  );
}
