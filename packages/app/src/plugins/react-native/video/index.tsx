import React, { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import { File, Paths } from "expo-file-system";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { StyleSheet } from "react-native-unistyles";
import type { VideoProps } from "@getpaseo/plugin/client/react-native";
import { useRetainedPanelActive } from "@/components/retained-panel";
import { decodeVideo } from "./source";

let nextFile = 0;
type Prepared =
  | { key: string; uri: string; error?: never }
  | { key: string; error: string; uri?: never };

/** The host owns native resources; plugins only supply encoded bytes. */
export function Video({ base64, mimeType, label, style }: VideoProps) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  useEffect(() => {
    let file: File | undefined;
    try {
      const { bytes, extension } = decodeVideo(base64, mimeType);
      file = new File(Paths.cache, `paseo-video-${Date.now()}-${nextFile++}.${extension}`);
      file.write(bytes);
      setPrepared({ key: base64, uri: file.uri });
    } catch (error) {
      setPrepared({
        key: base64,
        error: error instanceof Error ? error.message : "Cannot prepare video",
      });
    }
    return () => {
      if (file?.exists) file.delete();
    };
  }, [base64, mimeType]);
  if (!prepared || prepared.key !== base64)
    return <Text style={styles.message}>Preparing video…</Text>;
  if (prepared.error !== undefined)
    return (
      <Text accessibilityRole="alert" style={styles.message}>
        {prepared.error}
      </Text>
    );
  return <NativeVideo key={prepared.uri} uri={prepared.uri} label={label} style={style} />;
}

function NativeVideo({
  uri,
  label,
  style,
}: {
  uri: string;
  label?: string;
  style: VideoProps["style"];
}) {
  const active = useRetainedPanelActive();
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.staysActiveInBackground = false;
  });
  const { status, error } = useEvent(player, "statusChange", { status: player.status });
  useEffect(() => {
    if (!active) player.pause();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => subscription.remove();
  }, [active, player]);
  return (
    <View style={style}>
      <VideoView
        player={player}
        style={styles.player}
        nativeControls
        contentFit="contain"
        allowsFullscreen
        accessibilityLabel={label ?? "Video"}
      />
      {status === "loading" ? <Text style={styles.message}>Loading video…</Text> : null}
      {status === "error" ? (
        <Text accessibilityRole="alert" style={styles.message}>
          {error?.message ?? "Cannot play this video codec"}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create((theme) => ({
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: theme.colors.surface1 },
  message: { color: theme.colors.foreground, padding: 12 },
}));
