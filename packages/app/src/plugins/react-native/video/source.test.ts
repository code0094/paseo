import { describe, expect, it } from "vitest";
import { decodeVideo, MAX_VIDEO_BYTES } from "./source";
const mp4 = Buffer.from([0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109]).toString("base64");
describe("plugin video input", () => {
  it("decodes MP4 without changing bytes", () => {
    expect(decodeVideo(mp4, "video/mp4")).toEqual({
      bytes: new Uint8Array(Buffer.from(mp4, "base64")),
      extension: "mp4",
    });
  });
  it("rejects malformed, oversized and mismatched media", () => {
    for (const [base64, mime] of [
      ["", "video/mp4"],
      ["???", "video/mp4"],
      [mp4, "text/html"],
      [mp4, "video/webm"],
      ["A".repeat(4 * Math.ceil((MAX_VIDEO_BYTES + 1) / 3)), "video/mp4"],
    ]) {
      expect(() => decodeVideo(base64, mime)).toThrow();
    }
  });
});
