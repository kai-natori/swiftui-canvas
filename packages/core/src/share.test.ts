import { describe, expect, it } from "vitest";

import { newDoc } from "./model";
import { decodeDocDetailed, encodeDoc, SHARE_PREFIX, shareLink } from "./share";

describe("share warnings", () => {
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
