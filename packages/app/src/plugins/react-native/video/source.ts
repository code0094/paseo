import { Buffer } from "buffer";

export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const extensions: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function decodeVideo(base64: string, mimeType: string) {
  const extension = extensions[mimeType];
  if (!extension) throw new Error("Unsupported video type");
  if (base64.length > 4 * Math.ceil(MAX_VIDEO_BYTES / 3)) throw new Error("Video exceeds 30 MiB");
  if (!base64.length || base64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
    throw new Error("Invalid video data");
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  if (bytes.length > MAX_VIDEO_BYTES) throw new Error("Video exceeds 30 MiB");
  const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  const mp4 =
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70;
  if (!(extension === "webm" ? webm : mp4)) throw new Error("Invalid video header");
  return { bytes, extension };
}
