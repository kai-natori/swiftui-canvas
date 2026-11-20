import { describe, expect, it } from "vitest";

import { displacementFilter, displacementFilterId, displacementMapDataUri } from "./refraction";

describe("displacement map generator", () => {
  it("produces an SVG data URI sized to the shape with a neutral centre", () => {
    const uri = displacementMapDataUri({ width: 361, height: 62, radius: 31 });
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    const svg = decodeURIComponent(uri.slice("data:image/svg+xml,".length));
    expect(svg).toContain('width="361"');
    expect(svg).toContain('height="62"');
    expect(svg).toContain("rgb(128,128,128)");
    expect(svg).toContain('rx="31"');
  });

  it("clamps the rim inside the shape and names filters stably", () => {
    const f = displacementFilter({ width: 44, height: 44, radius: 22, edge: 500 });
    expect(f.id).toBe(displacementFilterId(44, 44, 22));
    expect(f.scale).toBe(24);
    expect(f.mapUri).toContain("data:image/svg+xml");
  });
});
