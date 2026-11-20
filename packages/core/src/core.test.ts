import { describe, expect, it } from "vitest";

import {
  KIND_ORDER,
  defaultPart,
  isProject,
  loadDoc,
  newDoc,
  parseProjectFile,
  projectFileName,
  saveDoc,
  validateDoc,
  type Doc,
  type KeyValueStorage,
} from "./index";
import { decodeDoc, docFromHash, encodeDoc, shareLink } from "./share";

function fakeStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const broken = (mutate: (d: Record<string, unknown>) => void): unknown => {
  const d = JSON.parse(JSON.stringify(newDoc("en"))) as Record<string, unknown>;
  mutate(d);
  return d;
};

describe("model factories", () => {
  it("newDoc produces a strictly valid document", () => {
    for (const lang of ["en", "ja", "zh"] as const) {
      expect(isProject(newDoc(lang))).toBe(true);
    }
  });

  it("defaultPart covers every MVP kind with an allowed variant and size", () => {
    for (const kind of KIND_ORDER) {
      const p = defaultPart("en", "s1", kind, 16, 100);
      expect(p.kind).toBe(kind);
      expect(p.w).toBeGreaterThan(0);
      expect(p.h).toBeGreaterThan(0);
    }
  });

  it("tab bar defaults sit inside the screen above the home indicator", () => {
    const doc = newDoc("en");
    const tabs = doc.parts.find((p) => p.kind === "tabBar")!;
    expect(tabs.y + (tabs.h ?? 0)).toBeLessThanOrEqual(852 - 34);
    expect(tabs.x).toBe(16);
  });
});

describe("strict validation", () => {
  it("rejects an unknown part kind", () => {
    expect(isProject(broken((d) => ((d.parts as Record<string, unknown>[])[0]!.kind = "gauge")))).toBe(false);
  });

  it("rejects a dangling link target", () => {
    expect(
      isProject(
        broken((d) => {
          (d.parts as Record<string, unknown>[])[0]!.link = { target: "nope", transition: "push" };
        }),
      ),
    ).toBe(false);
  });

  it("rejects a bad theme and an empty screen list", () => {
    expect(isProject(broken((d) => ((d.theme as Record<string, unknown>).scheme = "auto")))).toBe(false);
    expect(isProject(broken((d) => (d.screens = [])))).toBe(false);
  });
});

describe("tolerant ingress", () => {
  it("drops a malformed part and warns, keeping the rest", () => {
    const input = broken((d) => {
      (d.parts as unknown[]).push({ id: "bad", screen: null, kind: "gauge", x: 0, y: 0, label: "x", variant: "plain" });
    });
    const { doc, errors, warnings } = validateDoc(input);
    expect(errors).toEqual([]);
    expect(doc).not.toBeNull();
    expect(doc!.parts.some((p) => p.id === "bad")).toBe(false);
    expect(warnings.some((w) => w.includes("dropped a malformed part"))).toBe(true);
    expect(isProject(doc)).toBe(true);
  });

  it("removes dangling links, option targets and presents", () => {
    const input = broken((d) => {
      const parts = d.parts as Record<string, unknown>[];
      parts[0]!.link = { target: "ghost", transition: "push" };
      parts[0]!.presents = "ghost";
      parts[0]!.options = [{ label: "A", target: "ghost" }];
    });
    const { doc, warnings } = validateDoc(input);
    const p = doc!.parts[0]!;
    expect(p.link).toBeUndefined();
    expect(p.presents).toBeUndefined();
    expect(p.options?.[0]?.target).toBeNull();
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    expect(isProject(doc)).toBe(true);
  });

  it("renames duplicate ids and moves orphaned parts to the workspace", () => {
    const input = broken((d) => {
      const parts = d.parts as Record<string, unknown>[];
      const copy = JSON.parse(JSON.stringify(parts[0])) as Record<string, unknown>;
      copy.screen = "missing-screen";
      parts.push(copy);
    });
    const { doc } = validateDoc(input);
    const ids = doc!.parts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(doc!.parts.some((p) => p.screen === null)).toBe(true);
  });

  it("rejects only when theme or screens are unusable", () => {
    expect(validateDoc(broken((d) => (d.theme = null))).doc).toBeNull();
    expect(validateDoc(broken((d) => (d.screens = "nope"))).doc).toBeNull();
    expect(validateDoc("hello").doc).toBeNull();
    const repaired = validateDoc(broken((d) => (d.title = 42)));
    expect(repaired.doc?.title).toBe("Untitled App");
  });
});

describe("share links", () => {
  it("round-trips a document through encode/decode", async () => {
    const doc = newDoc("ja");
    doc.parts.push(defaultPart("ja", doc.screens[0]!.id, "card", 16, 400));
    const payload = await encodeDoc(doc);
    expect(payload).not.toContain("+");
    expect(payload).not.toContain("/");
    const back = await decodeDoc(payload);
    expect(back).toEqual(doc);
  });

  it("builds and reads a #sc= link", async () => {
    const doc: Doc = newDoc("en");
    const link = await shareLink(doc, "https://example.com/app");
    expect(link.startsWith("https://example.com/app#sc=")).toBe(true);
    const hash = link.slice(link.indexOf("#"));
    expect(await docFromHash(hash)).toEqual(doc);
    expect(await docFromHash("#other=1")).toBeNull();
    expect(await decodeDoc("!!!not-base64!!!")).toBeNull();
  });
});

describe("storage helpers", () => {
  it("saves, loads and clears through the injected storage", () => {
    const storage = fakeStorage();
    const doc = newDoc("zh");
    saveDoc(storage, doc);
    expect(loadDoc(storage)?.doc).toEqual(doc);
    storage.map.clear();
    expect(loadDoc(storage)).toBeNull();
  });

  it("returns null for corrupt saved data instead of throwing", () => {
    const storage = fakeStorage();
    storage.setItem("swiftui-canvas:doc:v1", "{not json");
    expect(loadDoc(storage)).toBeNull();
  });

  it("derives a file name from the title and parses project files", () => {
    const doc = newDoc("en");
    doc.title = "My / App";
    expect(projectFileName(doc)).toBe("swiftui-canvas My App.json");
    expect(parseProjectFile(JSON.stringify(newDoc("en")))?.doc.title).toBe("Untitled App");
    expect(parseProjectFile("nope")).toBeNull();
  });
});
