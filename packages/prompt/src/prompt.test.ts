import { defaultPart, newDoc, type Doc } from "@swiftui-canvas/core";
import { describe, expect, it } from "vitest";

import { apiBaseline, buildPrompt, describePart } from "./prompt";

function fixture(): Doc {
  const doc = newDoc("en");
  const screen = doc.screens[0]!;
  doc.title = "Fitness Log";
  doc.theme = { accent: "green", scheme: "light", shape: "capsule", font: "rounded" };
  const list = defaultPart("en", screen.id, "list", 16, 340);
  list.options = [
    { label: "Morning run", icon: "figure.run", target: null },
    { label: "Swim", icon: "figure.pool.swim", target: null },
  ];
  const tabs = doc.parts.find((p) => p.kind === "tabBar")!;
  const second = { ...screen, id: "screen-2", name: "Stats", x: 440 };
  doc.screens.push(second);
  tabs.options = [
    { label: "Home", icon: "house", target: screen.id },
    { label: "Stats", icon: "chart.bar", target: second.id },
  ];
  const button = doc.parts.find((p) => p.kind === "button")!;
  button.link = { target: second.id, transition: "zoom" };
  button.note = "Haptic feedback on tap.";
  doc.parts.push(list);
  for (const [i, kind] of (["gauge", "datePicker", "colorPicker"] as const).entries()) {
    doc.parts.push(defaultPart("en", screen.id, kind, 16, 540 + i * 64));
  }
  return doc;
}

describe("buildPrompt", () => {
  it("describes container offsets and image assets without inserting image bytes", () => {
    const doc = newDoc("en");
    const box = { ...defaultPart("en", doc.screens[0]!.id, "box", 16, 200), label: "Photo group" };
    const image = { ...defaultPart("en", box.screen, "image", 32, 224), parent: box.id, image: "data:image/png;base64,aGVsbG8=" };
    doc.parts.push(box, image);
    for (const lang of ["en", "ja", "zh"] as const) {
      const text = buildPrompt(doc, { lang });
      expect(text).toContain("Photo group");
      expect(text).toContain("ZStack, x: 16, y: 24");
      expect(text).toContain("JSON");
      expect(text).not.toContain("base64");
    }
  });
  it("describes promoted control variants, bounds and missing optional values", () => {
    const doc = newDoc("en");
    for (const lang of ["en", "ja", "zh"] as const) {
      const gauge = defaultPart(lang, null, "gauge", 0, 0);
      gauge.variant = "accessoryCircular";
      for (const value of [0, 1]) {
        expect(describePart(lang, { ...gauge, value }, doc)).toContain(`value: ${value} (0–1), .gaugeStyle(.accessoryCircular)`);
      }
      const picker = defaultPart(lang, null, "datePicker", 0, 0);
      expect(describePart(lang, { ...picker, displayedComponents: "date" }, doc)).toContain("displayedComponents: [.date]");
      expect(describePart(lang, { ...picker, displayedComponents: "time" }, doc)).toContain("displayedComponents: [.hourAndMinute]");
      const color = defaultPart(lang, null, "colorPicker", 0, 0);
      expect(describePart(lang, { ...color, color: "#FF9500" }, doc)).toContain("#FF9500");
      expect(describePart(lang, { ...color, color: undefined, label: "" }, doc)).toContain("#007AFF");
      expect(describePart(lang, { ...picker, date: undefined, displayedComponents: undefined }, doc)).toContain("2026-11-21T09:41");
      expect(describePart(lang, { ...gauge, value: undefined }, doc)).toContain("0.65");
    }
  });
  it("contains the fixed API baseline with identical API wording in all languages", () => {
    for (const lang of ["en", "ja", "zh"] as const) {
      const text = apiBaseline(lang);
      for (const token of [
        "NavigationStack",
        "TabView + Tab",
        "NavigationView",
        "@Observable",
        "foregroundStyle",
        ".glassEffect()",
        "GlassEffectContainer",
        "buttonStyle(.glass)",
        ".scrollEdgeEffectStyle",
        ".navigationTransition(.zoom(sourceID:in:))",
        "Image(systemName:)",
        "iOS 26.0",
        "Swift 6.2",
      ]) {
        expect(text).toContain(token);
      }
    }
  });

  it("renders theme accent as RGB and parts in visual order", () => {
    const text = buildPrompt(fixture(), { lang: "en" });
    // green preset #34C759 -> (0.204, 0.780, 0.349)
    expect(text).toContain("Color(red: 0.204, green: 0.780, blue: 0.349)");
    expect(text).toContain("Fitness Log");
    const navIdx = text.indexOf("Navigation bar");
    const listIdx = text.indexOf("Morning run");
    expect(navIdx).toBeGreaterThan(-1);
    expect(listIdx).toBeGreaterThan(navIdx);
    expect(text).toContain("Haptic feedback on tap.");
    expect(text).toContain("transition: zoom");
    expect(text).toContain("Stats");
  });

  it("single-screen prompt only includes that screen", () => {
    const doc = fixture();
    const text = buildPrompt(doc, { lang: "en", screenId: "screen-2" });
    expect(text).toContain("Screen: Stats");
    expect(text).not.toContain("Morning run");
  });

  it("golden output (en)", () => {
    expect(buildPrompt(fixture(), { lang: "en" })).toMatchSnapshot();
  });

  it("golden output (ja)", () => {
    const text = buildPrompt(fixture(), { lang: "ja" });
    expect(text).toContain("画面: Stats");
    expect(text).toContain("テーマ");
    expect(text).toMatchSnapshot();
  });

  it("golden output (zh)", () => {
    expect(buildPrompt(fixture(), { lang: "zh" })).toMatchSnapshot();
  });
});
