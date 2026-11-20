import { defaultPart, newDoc, type Doc } from "@swiftui-canvas/core";
import { describe, expect, it } from "vitest";

import { apiBaseline, buildPrompt } from "./prompt";

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
  return doc;
}

describe("buildPrompt", () => {
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
