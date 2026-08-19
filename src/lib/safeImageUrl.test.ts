import { describe, expect, it } from "vitest";
import { safeImageUrl } from "./safeImageUrl";

const CDN = "https://res.cloudinary.com/demo/image/upload/v1/pack.jpg";

describe("safeImageUrl", () => {
  it("rejects empty, junk, and non-CDN urls", () => {
    expect(safeImageUrl(undefined, 64)).toBeNull();
    expect(safeImageUrl("", 64)).toBeNull();
    expect(safeImageUrl("not a url", 64)).toBeNull();
    expect(safeImageUrl("javascript:alert(1)", 64)).toBeNull();
    expect(safeImageUrl("http://res.cloudinary.com/demo/image/upload/v1/x.jpg", 64)).toBeNull();
    expect(safeImageUrl("https://evil.example/track.gif", 64)).toBeNull();
  });

  it("pads white-tile thumbs onto a white square", () => {
    const url = safeImageUrl(CDN, 64, "white");
    expect(url).toContain("c_pad,b_rgb:FFFFFF,w_128,h_128,q_auto,f_auto");
  });

  it("uses fill only for cover crop", () => {
    const url = safeImageUrl(CDN, 56, "none");
    expect(url).toContain("c_fill,g_auto,w_112,h_112,q_auto,f_auto");
    expect(url).not.toContain("c_pad");
  });

  it("replaces an existing Cloudinary transform instead of stacking", () => {
    const raw =
      "https://res.cloudinary.com/demo/image/upload/c_fit,w_40/v1/pack.jpg";
    const url = safeImageUrl(raw, 64, "white");
    expect(url).toContain("/image/upload/c_pad,b_rgb:FFFFFF,w_128,h_128,q_auto,f_auto/v1/pack.jpg");
    expect(url).not.toContain("c_fit,w_40");
  });
});
