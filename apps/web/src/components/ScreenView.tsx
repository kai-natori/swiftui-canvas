import type { CSSProperties, PointerEvent, ReactNode } from "react";

import {
  CHROME_BOTTOM,
  SCREEN_H,
  SCREEN_W,
  accentHex,
  partsOf,
  type Doc,
  type Part,
  type Screen,
} from "@swiftui-canvas/core";

import { SfIcon } from "~/lib/symbols";
import { SwiftPart, fontStack, partUi } from "./SwiftPart";

/* ScreenView — one iPhone screen (393x852) with its system chrome and
 * parts, shared by the canvas and the preview. Positioning lives here;
 * the parent supplies per-part wrapper props (selection outline and drag
 * handlers in the canvas, nothing in the preview) and the tap callbacks
 * used in preview mode.
 */

export function screenBgCss(bg: string | undefined, dark: boolean): string {
  if (!bg || bg === "system") return dark ? "#000000" : "#ffffff";
  if (bg === "secondary") return dark ? "#1C1C1E" : "#F2F2F7";
  if (bg === "grouped") return dark ? "#111113" : "#EFEFF4";
  return bg;
}

export interface ScreenViewProps {
  doc: Doc;
  screen: Screen;
  /** Parts to hide (preview hides alert/sheet parts; they are presented). */
  hiddenKinds?: ReadonlySet<string>;
  onTap?: (part: Part) => void;
  onOptionTap?: (part: Part, index: number) => void;
  canGoBack?: boolean;
  onBack?: () => void;
  /** Canvas-only: attributes/handlers for the positioned part wrapper. */
  partWrapperProps?: (part: Part) => {
    onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
    style?: CSSProperties;
    dataSelected?: boolean;
  };
  children?: ReactNode;
}

export function ScreenChrome({ dark }: { dark: boolean }) {
  const color = dark ? "#fff" : "#000";
  return (
    <>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0, height: 59,
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "0 28px 6px", boxSizing: "border-box", pointerEvents: "none", zIndex: 40,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color }}>9:41</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center", color }}>
          <SfIcon name="wifi" size={15} />
          <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
            <path d="M23.5 4v4a2 2 0 0 0 0-4Z" fill="currentColor" opacity="0.5" />
          </svg>
        </span>
      </div>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: CHROME_BOTTOM,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: 8, boxSizing: "border-box", pointerEvents: "none", zIndex: 40,
        }}
      >
        <div style={{ width: 134, height: 5, borderRadius: 3, background: color, opacity: dark ? 0.6 : 0.85 }} />
      </div>
    </>
  );
}

export function ScreenView(props: ScreenViewProps) {
  const { doc, screen } = props;
  const ui = partUi(doc.theme);
  const dark = doc.theme.scheme === "dark";
  const parts = partsOf(doc, screen.id).filter((p) => !props.hiddenKinds?.has(p.kind));

  return (
    <div
      data-scheme={doc.theme.scheme}
      style={{
        position: "relative",
        width: SCREEN_W,
        height: SCREEN_H,
        background: screenBgCss(screen.bg, dark),
        borderRadius: 44,
        overflow: "hidden",
        fontFamily: fontStack(doc.theme.font),
        ["--sc-accent" as string]: accentHex(doc.theme),
        color: "var(--sc-label)",
        flex: "none",
      }}
    >
      {parts.map((part) => {
        const wrap = props.partWrapperProps?.(part);
        return (
          <div
            key={part.id}
            data-part-id={part.id}
            onPointerDown={wrap?.onPointerDown}
            style={{
              position: "absolute",
              left: part.x,
              top: part.y,
              zIndex: part.kind === "tabBar" ? 30 : part.kind === "navBar" ? 25 : 10,
              ...wrap?.style,
            }}
          >
            <SwiftPart
              part={part}
              doc={doc}
              ui={ui}
              onTap={props.onTap}
              onOptionTap={props.onOptionTap}
              canGoBack={props.canGoBack}
              onBack={props.onBack}
            />
          </div>
        );
      })}
      {screen.chrome ? <ScreenChrome dark={dark} /> : null}
      {props.children}
    </div>
  );
}
