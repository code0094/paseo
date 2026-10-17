import React, { createElement, useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { VideoProps } from "@getpaseo/plugin/client/react-native";
import { useRetainedPanelActive } from "@/components/retained-panel";
import { useRef } from "react";
import { decodeVideo } from "./source";

export function Video({ base64, mimeType, label, style }: VideoProps) {
  const [source, setSource] = useState<{ url: string; error: string }>({ url: "", error: "" });
  const ref = useRef<HTMLVideoElement>(null);
  const active = useRetainedPanelActive();
  useEffect(() => {
    let url: string | undefined;
    try {
      const { bytes } = decodeVideo(base64, mimeType);
      url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      setSource({ url, error: "" });
    } catch (error) {
      setSource({ url: "", error: String(error) });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [base64, mimeType]);
  useEffect(() => {
    if (!active) ref.current?.pause();
    const hide = () => {
      if (document.hidden) ref.current?.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [active]);
  if (source.error) return <Text accessibilityRole="alert">{source.error}</Text>;
  return (
    <View style={style}>
      {createElement("video", {
        ref,
        src: source.url || undefined,
        controls: true,
        playsInline: true,
        preload: "metadata",
        "aria-label": label ?? "Video",
        style: { width: "100%", aspectRatio: "16 / 9" },
        onError: () =>
          setSource((current) => ({ ...current, error: "Cannot play this video codec" })),
      })}
    </View>
  );
}
