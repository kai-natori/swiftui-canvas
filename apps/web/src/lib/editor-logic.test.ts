import { describe, expect, it } from "vitest";

import { defaultPart, newDoc } from "@swiftui-canvas/core";

import { autoPlacePart, duplicateScreenDoc, navigationArrows, snap, snapPosition, tidyScreen } from "./editor-logic";

describe("editor logic", () => {
  it("auto-places below starter content, not below the tab bar", () => {
    const doc = newDoc("en");
    const sid = doc.screens[0]!.id;
    const part = defaultPart("en", sid, "slider", 0, 0);
    const position = autoPlacePart(doc, sid, part);
    const tab = doc.parts.find((p) => p.kind === "tabBar")!;
    expect(position).toEqual({ x: 16, y: 328 });
    expect(position.y + part.h!).toBeLessThanOrEqual(tab.y - 16);
  });

  it("uses an earlier free gap when appending would overflow", () => {
    const doc = newDoc("en");
    const sid = doc.screens[0]!.id;
    doc.parts = doc.parts.filter((p) => p.kind === "navBar" || p.kind === "tabBar");
    doc.parts.push({ ...defaultPart("en", sid, "box", 16, 400), h: 320 });
    const position = autoPlacePart(doc, sid, defaultPart("en", sid, "button", 0, 0));
    const nav = doc.parts.find((p) => p.kind === "navBar")!;
    expect(position.y).toBeGreaterThanOrEqual(nav.y + nav.h! + 16);
    expect(position.y + 50 + 16).toBeLessThanOrEqual(400);
  });

  it("keeps an added part visible on a full screen even when overlap is unavoidable", () => {
    const doc = newDoc("en");
    const sid = doc.screens[0]!.id;
    doc.parts = doc.parts.filter((p) => p.kind === "navBar" || p.kind === "tabBar");
    const nav = doc.parts.find((p) => p.kind === "navBar")!;
    const tab = doc.parts.find((p) => p.kind === "tabBar")!;
    doc.parts.push({ ...defaultPart("en", sid, "box", 16, nav.y + nav.h! + 16), h: 550 });
    const part = defaultPart("en", sid, "button", 0, 0);
    const position = autoPlacePart(doc, sid, part);
    expect(position.y).toBeGreaterThanOrEqual(nav.y + nav.h! + 16);
    expect(position.y + part.h!).toBeLessThanOrEqual(tab.y - 16);
  });

  it("honors chrome on empty screens and ignores other screens and overlay sheets", () => {
    const doc = newDoc("en");
    const sid = doc.screens[0]!.id;
    const part = defaultPart("en", sid, "slider", 0, 0);
    doc.parts = [defaultPart("en", "other-screen", "box", 16, 700), defaultPart("en", sid, "sheet", 0, 592)];
    expect(autoPlacePart(doc, sid, part)).toEqual({ x: 16, y: 80 });
    doc.screens[0]!.chrome = false;
    expect(autoPlacePart(doc, sid, part)).toEqual({ x: 16, y: 16 });
  });

  it("uses inferred part sizes when stored dimensions are absent", () => {
    const doc = newDoc("en");
    const sid = doc.screens[0]!.id;
    doc.parts = doc.parts.map((p) => ({ ...p, h: undefined, w: undefined }));
    expect(autoPlacePart(doc, sid, defaultPart("en", sid, "slider", 0, 0))).toEqual({ x: 16, y: 328 });
  });

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
