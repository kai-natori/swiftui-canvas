import { createElement, forwardRef, type CSSProperties, type ReactNode } from "react";

/* Minimal React wrappers for @ozcanyldzhn/liquid-glass-js.
 *
 * The package's own /react subpath is broken in the published build:
 * its types (dist/wrappers/react.d.ts) declare LiquidGlassReact &
 * friends, but dist/liquid-glass.js — the file the subpath's import
 * condition points at — exports none of them, so any bundler import
 * fails with MISSING_EXPORT. The custom elements themselves are fine,
 * so these wrappers render them directly, the same way the upstream
 * wrapper does (createElement + attribute props). Importing the main
 * entry registers the elements (it self-registers in the browser).
 */
import "@ozcanyldzhn/liquid-glass-js";
import "@ozcanyldzhn/liquid-glass-js/css";

export interface LiquidGlassProps {
  width?: number;
  height?: number;
  radius?: number;
  thickness?: number;
  bezel?: number;
  ior?: number;
  blur?: number;
  tintColor?: string;
  tintOpacity?: number;
  children?: ReactNode;
}

export const LiquidGlass = forwardRef<HTMLElement, LiquidGlassProps>(function LiquidGlass(
  { tintColor, tintOpacity, children, ...rest },
  ref,
) {
  return createElement(
    "liquid-glass",
    {
      ref,
      ...rest,
      ...(tintColor !== undefined ? { "tint-color": tintColor } : {}),
      ...(tintOpacity !== undefined ? { "tint-opacity": tintOpacity } : {}),
    },
    children,
  );
});

export interface LiquidButtonProps {
  variant?: "default" | "primary" | "icon";
  radius?: number;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}

export const LiquidButton = forwardRef<HTMLElement, LiquidButtonProps>(function LiquidButton(
  { children, ...rest },
  ref,
) {
  return createElement("liquid-button", { ref, ...rest }, children);
});
