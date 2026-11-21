import { describe, expect, it } from "vitest";
import { defaultPart, isProject, isSearchTab, loadDoc, newDoc, saveDoc, validateDoc } from "./index";
import { decodeDoc, encodeDoc } from "./share";

describe("promoted controls", () => {
  it("supports explicit search tab roles while preserving older search symbols", async () => {
    expect(isSearchTab({ label: "検索", icon: "magnifyingglass" })).toBe(true);
    expect(isSearchTab({ label: "Find", role: "search" })).toBe(true);
    expect(isSearchTab({ label: "Search", icon: "magnifyingglass", role: "default" })).toBe(false);
    const doc = newDoc("en");
    const tab = doc.parts.find((p) => p.kind === "tabBar")!;
    tab.options![1]!.role = "search";
    expect(isProject(doc)).toBe(true);
    expect(await decodeDoc(await encodeDoc(doc))).toEqual(doc);
    expect(isProject({ ...doc, parts: [{ ...tab, options: [{ label: "Invalid", role: "bad" }] }] })).toBe(false);
  });
  it("preserves images and container membership through validation and sharing", async () => {
    const doc = newDoc("en");
    const box = defaultPart("en", doc.screens[0]!.id, "box", 16, 400);
    const image = { ...defaultPart("en", box.screen, "image", 32, 416), parent: box.id, image: "data:image/png;base64,aGVsbG8=" };
    doc.parts.push(box, image);
    expect(isProject(doc)).toBe(true);
    expect(await decodeDoc(await encodeDoc(doc))).toEqual(doc);
    expect(validateDoc(doc).warnings).toEqual([]);
    image.parent = "missing";
    expect(isProject(doc)).toBe(false);
    const repaired = validateDoc(doc);
    expect(repaired.doc?.parts.find((p) => p.id === image.id)?.parent).toBeUndefined();
    expect(repaired.warnings).toHaveLength(1);
  });

  it("rejects executable image sources and cyclic container groups", () => {
    const doc = newDoc("en");
    const image = defaultPart("en", doc.screens[0]!.id, "image", 0, 0);
    for (const source of ["javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4=", "https://example.com/image.png"]) {
      doc.parts = [{ ...image, image: source }];
      expect(isProject(doc)).toBe(false);
    }
    const box = defaultPart("en", doc.screens[0]!.id, "box", 0, 0);
    box.parent = box.id;
    doc.parts = [box];
    expect(isProject(doc)).toBe(false);
    expect(validateDoc(doc).doc?.parts[0]?.parent).toBeUndefined();
  });
  it("creates localized defaults and preserves them through storage and sharing", async () => {
    for (const lang of ["en", "ja", "zh"] as const) {
      const doc = newDoc(lang);
      const controls = (["gauge", "datePicker", "colorPicker"] as const).map((kind) => defaultPart(lang, doc.screens[0]!.id, kind, 16, 100));
      doc.parts = controls;
      expect(controls.every((p) => p.label.length > 0)).toBe(true);
      expect(controls[0]!.value).toBe(0.65);
      expect(controls[1]!.displayedComponents).toBe("both");
      expect(controls[2]!.color).toBe("#007AFF");
      expect(isProject(doc)).toBe(true);
      expect(validateDoc(doc).warnings).toEqual([]);
      expect(await decodeDoc(await encodeDoc(doc))).toEqual(doc);
      const map = new Map<string, string>();
      const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } };
      saveDoc(storage, doc);
      expect(loadDoc(storage)?.doc).toEqual(doc);
    }
  });

  it("accepts real dates in early years", () => {
    const doc = newDoc("en");
    doc.parts = [{ ...defaultPart("en", doc.screens[0]!.id, "datePicker", 0, 0), date: "0042-02-28T09:41" }];
    expect(isProject(doc)).toBe(true);
  });

  it("allows absent optional values and empty labels", () => {
    const doc = newDoc("en");
    doc.parts = (["gauge", "datePicker", "colorPicker"] as const).map((kind) => ({
      ...defaultPart("en", doc.screens[0]!.id, kind, 0, 0), label: "", value: undefined, date: undefined, color: undefined, displayedComponents: undefined,
    }));
    expect(isProject(doc)).toBe(true);
  });

  it("rejects invalid values and tolerantly drops malformed controls", () => {
    for (const [kind, field, value] of [
      ["gauge", "value", -0.1], ["gauge", "value", 1.1], ["gauge", "value", Number.NaN],
      ["datePicker", "displayedComponents", "week"], ["datePicker", "date", "invalid"], ["datePicker", "date", "2026-02-31T09:41"], ["datePicker", "date", "2026-11-21T24:00"],
      ["colorPicker", "color", "red"],
    ] as const) {
      const doc = newDoc("en");
      doc.parts = [{ ...defaultPart("en", doc.screens[0]!.id, kind, 0, 0), [field]: value }];
      expect(isProject(doc)).toBe(false);
      expect(validateDoc(doc).doc?.parts).toEqual([]);
      expect(validateDoc(doc).warnings).toHaveLength(1);
    }
  });
});
