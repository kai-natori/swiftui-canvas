import { describe, expect, it } from "vitest";
import { deflateRawSync } from "node:zlib";

import { newDoc } from "./model";
import { decodeDocDetailed, decodeDoc, encodeDoc, MAX_SHARE_LENGTH, SHARE_PREFIX, shareLink } from "./share";
import { MAX_PROJECT_BYTES } from "./storage";

describe("share warnings", () => {
  it("rejects oversized encoded inputs and compressed expansion before parsing", async () => {
    expect(await decodeDocDetailed("A".repeat(MAX_SHARE_LENGTH + 1))).toBeNull();
    const doc = { ...newDoc("en"), title: "x".repeat(MAX_PROJECT_BYTES) };
    const payload = deflateRawSync(JSON.stringify(doc)).toString("base64url");
    expect(payload.length).toBeLessThan(MAX_SHARE_LENGTH);
    expect(await decodeDocDetailed(payload)).toBeNull();
    expect(await decodeDoc(payload)).toBeNull();
    await expect(encodeDoc(doc)).rejects.toThrow("size limit");
  });

  it("keeps raw JSON fallback and project-path share links working", async () => {
    const doc = newDoc("ja");
    const payload = Buffer.from(JSON.stringify(doc)).toString("base64url");
    expect((await decodeDocDetailed(payload))?.doc).toEqual(doc);
    const link = await shareLink(doc, "https://example.github.io/swiftui-canvas/");
    expect(link.startsWith(`https://example.github.io/swiftui-canvas/${SHARE_PREFIX}`)).toBe(true);
  });
  it("surfaces tolerant-ingress warnings through the detailed decoder", async () => {
    const doc = newDoc("en");
    const broken = {
      ...doc,
      parts: [
        ...doc.parts,
        { id: "brokenpart1", screen: doc.screens[0]?.id, kind: "nope", x: 0, y: 0, label: "x", variant: "plain" },
      ],
    };
    const payload = await encodeDoc(broken as never);
    const decoded = await decodeDocDetailed(payload);
    expect(decoded).not.toBeNull();
    expect(decoded?.warnings.length).toBeGreaterThan(0);
    expect(decoded?.doc.parts.some((p) => p.id === "brokenpart1")).toBe(false);
  });

  it("round-trips a clean document with no warnings", async () => {
    const doc = newDoc("ja");
    const link = await shareLink(doc, "https://example.workers.dev/");
    expect(link.startsWith(`https://example.workers.dev/${SHARE_PREFIX}`)).toBe(true);
    const decoded = await decodeDocDetailed(link.slice(link.indexOf(SHARE_PREFIX) + SHARE_PREFIX.length));
    expect(decoded?.warnings).toEqual([]);
    expect(decoded?.doc.title).toBe(doc.title);
  });
});
