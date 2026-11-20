import { describe, expect, it } from "vitest";

import { defaultPart, newDoc } from "@swiftui-canvas/core";

import { duplicateScreenDoc, navigationArrows, snap, snapPosition, tidyScreen } from "./editor-logic";

describe("editor logic", () => {
  it("snaps to the 8pt grid", () => {
    expect(snap(13)).toBe(16);
    expect(snap(11)).toBe(8);
  });

  it("snapPosition snaps a part to the 16pt margin guide", () => {
    const doc = newDoc("en");
    const part = doc.parts.find((p) => p.kind === "button");
    if (!part) throw new Error("no button");
    const r = snapPosition(doc, part, 18, 300);
    expect(r.x).toBe(16);
    expect(r.vGuides).toContain(16);
  });

  it("tidy stacks parts below the nav bar and floats the tab bar", () => {
    const doc = newDoc("en");
    const tidied = tidyScreen(doc, doc.screens[0]?.id as string);
    const tab = tidied.parts.find((p) => p.kind === "tabBar");
    const nav = tidied.parts.find((p) => p.kind === "navBar");
    expect(nav?.y).toBe(59);
    expect(tab?.x).toBe(16);
    expect(tab?.y).toBe(852 - 34 - 62 - 8);
  });

  it("duplicating a screen remaps self-links and presents", () => {
    let doc = newDoc("en");
    const sid = doc.screens[0]?.id as string;
    const alert = defaultPart("en", sid, "alert", 60, 300);
    const button = defaultPart("en", sid, "button", 16, 400);
    button.presents = alert.id;
    button.link = { target: sid, transition: "push" };
    doc = { ...doc, parts: [...doc.parts, alert, button] };
    const { doc: next, screen } = duplicateScreenDoc(doc, sid);
    const copiedButton = next.parts.find((p) => p.screen === screen.id && p.kind === "button" && p.presents);
    expect(copiedButton?.link?.target).toBe(screen.id);
    const copiedAlert = next.parts.find((p) => p.id === copiedButton?.presents);
    expect(copiedAlert?.screen).toBe(screen.id);
  });

  it("builds a navigation arrow for a linked part", () => {
    let doc = newDoc("en");
    const sid = doc.screens[0]?.id as string;
    const second = defaultPart("en", null, "button", 0, 0);
    void second;
    const { doc: two } = duplicateScreenDoc(doc, sid, 600, 0);
    const target = two.screens[1]?.id as string;
    const button = two.parts.find((p) => p.screen === sid && p.kind === "button");
    if (!button) throw new Error("no button");
    doc = {
      ...two,
      parts: two.parts.map((p) => (p.id === button.id ? { ...p, link: { target, transition: "zoom" as const } } : p)),
    };
    const arrows = navigationArrows(doc);
    expect(arrows.some((a) => a.fromPartId === button.id && a.transition === "zoom")).toBe(true);
  });
});
