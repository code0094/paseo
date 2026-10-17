import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, expect, it } from "vitest";
import { Video } from "./index.web";
import { RetainedPanelActivity } from "@/components/retained-panel";
const fixture = new URL("./test-pattern.mp4", import.meta.url).href;

let root: Root | undefined;
let container: HTMLDivElement;
afterEach(() => {
  root?.unmount();
  container?.remove();
});
it("plays real MP4, pauses on hidden chat, and releases its media URL", async () => {
  const response = await fetch(fixture);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const base64 = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const render = (active: boolean) =>
    flushSync(() =>
      root!.render(
        <RetainedPanelActivity active={active}>
          <Video base64={base64} mimeType="video/mp4" label="Test clip" />
        </RetainedPanelActivity>,
      ),
    );
  render(true);
  await expect.poll(() => container.querySelector("video")?.src.startsWith("blob:")).toBe(true);
  const video = container.querySelector("video")!;
  video.muted = true;
  await video.play();
  await expect.poll(() => video.currentTime).toBeGreaterThan(0);
  expect(video.controls).toBe(true);
  render(false);
  await expect.poll(() => video.paused).toBe(true);
  const url = video.src;
  root!.unmount();
  root = undefined;
  await expect(fetch(url)).rejects.toThrow();
});
it("shows an inline error for invalid media", async () => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  flushSync(() => root!.render(<Video base64="????" mimeType="video/mp4" />));
  await expect.poll(() => container.textContent).toContain("Invalid video data");
  expect(container.querySelector("video")).toBeNull();
});
