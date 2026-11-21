import { describe, expect, it } from "vitest";

import { KIND_ORDER, type KeyValueStorage } from "@swiftui-canvas/core";

import {
  CATALOG,
  CATALOG_CATEGORIES,
  NOT_YET,
  catalogKinds,
  entryForKind,
  filterCatalog,
  stashPendingPart,
  takePendingPart,
} from "./catalog";

function fakeStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe("catalog coverage", () => {
  it("covers every part kind exactly once", () => {
    const kinds = CATALOG.map((e) => e.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect([...kinds].sort()).toEqual([...KIND_ORDER].sort());
    expect(catalogKinds()).toEqual(KIND_ORDER);
  });

  it("uses only declared categories, and every category is used", () => {
    const ids = new Set(CATALOG_CATEGORIES.map((c) => c.id));
    for (const entry of CATALOG) expect(ids.has(entry.category)).toBe(true);
    for (const id of ids) expect(CATALOG.some((e) => e.category === id)).toBe(true);
    for (const entry of NOT_YET) expect(ids.has(entry.category)).toBe(true);
  });

  it("never lists an available view as not-yet", () => {
    const available = new Set(CATALOG.map((e) => e.swift));
    for (const entry of NOT_YET) expect(available.has(entry.swift)).toBe(false);
  });

  it("resolves entries by kind", () => {
    expect(entryForKind("toggle").swift).toBe("Toggle");
    expect(entryForKind("tabBar").swift).toBe("TabView");
    expect(entryForKind("contentUnavailable").swift).toBe("ContentUnavailableView");
  });
});

describe("filterCatalog", () => {
  it("returns everything for all + empty query", () => {
    expect(filterCatalog("all", "")).toHaveLength(KIND_ORDER.length);
    expect(filterCatalog("all", "   ")).toHaveLength(KIND_ORDER.length);
  });

  it("filters by category", () => {
    const controls = filterCatalog("controls", "");
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every((e) => e.category === "controls")).toBe(true);
  });

  it("matches SwiftUI names case-insensitively", () => {
    expect(filterCatalog("all", "toggle").map((e) => e.kind)).toEqual(["toggle"]);
    expect(filterCatalog("all", "PICKER").map((e) => e.kind).sort()).toEqual(["picker", "segmented"]);
    expect(filterCatalog("all", "navigationstack").map((e) => e.kind)).toEqual(["navBar"]);
  });

  it("matches part names in other languages", () => {
    expect(filterCatalog("all", "トグル").map((e) => e.kind)).toEqual(["toggle"]);
    expect(filterCatalog("all", "开关").map((e) => e.kind)).toEqual(["toggle"]);
  });

  it("combines category and query", () => {
    expect(filterCatalog("text", "picker")).toHaveLength(0);
    expect(filterCatalog("controls", "picker").length).toBe(2);
  });
});

describe("pending part hand-off", () => {
  it("round-trips a stashed kind exactly once", () => {
    const storage = fakeStorage();
    stashPendingPart(storage, "slider");
    expect(takePendingPart(storage)).toBe("slider");
    expect(takePendingPart(storage)).toBeNull();
  });

  it("rejects unknown values and clears them", () => {
    const storage = fakeStorage();
    storage.setItem("swiftui-canvas:pending-part:v1", "not-a-kind");
    expect(takePendingPart(storage)).toBeNull();
    expect(storage.map.size).toBe(0);
  });

  it("returns null when nothing was stashed", () => {
    expect(takePendingPart(fakeStorage())).toBeNull();
  });
});
