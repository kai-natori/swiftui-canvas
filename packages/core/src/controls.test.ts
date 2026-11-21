import { describe, expect, it } from "vitest";
import { defaultPart, isProject, loadDoc, newDoc, saveDoc, validateDoc } from "./index";
import { decodeDoc, encodeDoc } from "./share";

describe("promoted controls", () => {
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
