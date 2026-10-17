import { Video as HostVideo } from "@getpaseo/plugin/client/react-native";
import { useAgent, useRpc, type PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { readVideoRpc, type VideoEmbedData } from "../shared/video";
import { createMediaUrl, isWeb, renderVideoElement, revokeMediaUrl } from "./web";

type Theme = PluginTimelineItemProps["theme"];
export function VideoEmbed({
  item,
  theme,
  host,
  agentId,
}: PluginTimelineItemProps<VideoEmbedData>) {
  const cwd = useAgent(agentId, (agent) => agent.cwd) ?? undefined;
  const style = useMemo(() => ({ gap: 12 }), []);
  const prose = useMemo(
    () => ({ color: theme.colors.foreground, fontSize: 15, lineHeight: 22 }),
    [theme],
  );
  const segments = useMemo(() => {
    let offset = 0;
    return item.data.segments.map((segment) => {
      const key = String(offset);
      offset += JSON.stringify(segment).length;
      return { key, segment };
    });
  }, [item.data]);
  return (
    <View style={style}>
      {segments.map(({ key, segment }) =>
        segment.kind === "text" ? (
          <Text key={key} style={prose}>
            {segment.text}
          </Text>
        ) : (
          <VideoSegment
            key={`${host.id}:${agentId}:${key}:${segment.path}`}
            path={segment.path}
            label={segment.label}
            cwd={cwd}
            hostId={host.id}
            theme={theme}
          />
        ),
      )}
    </View>
  );
}
function VideoSegment({
  path,
  label,
  cwd,
  hostId,
  theme,
}: {
  path: string;
  label: string;
  cwd?: string;
  hostId: string;
  theme: Theme;
}) {
  const readVideo = useRpc(readVideoRpc);
  const [requested, setRequested] = useState(false);
  const supported = isWeb || typeof HostVideo === "function";
  const query = useQuery({
    queryKey: ["video-embed", hostId, cwd, path],
    queryFn: () => readVideo({ path, cwd }),
    enabled: supported && requested,
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  });
  const request = useCallback(() => setRequested(true), []);
  const { refetch } = query;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const styles = useMemo(
    () => ({
      frame: {
        padding: 16,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface1,
      },
      text: { color: theme.colors.foregroundMuted, fontSize: 14 },
    }),
    [theme],
  );
  const title = label || path.split("/").pop() || path;
  if (!supported)
    return (
      <Text style={styles.text}>Install the Paseo build with inline video to play {title}.</Text>
    );
  if (!requested)
    return (
      <Pressable accessibilityRole="button" onPress={request} style={styles.frame}>
        <Text style={styles.text}>▶ {title}</Text>
      </Pressable>
    );
  if (query.isPending) return <Text style={styles.text}>Loading video…</Text>;
  if (query.data?.ok)
    return <LoadedVideo base64={query.data.base64} mime={query.data.mime} label={title} />;
  return (
    <View style={styles.frame}>
      <Text accessibilityRole="alert" style={styles.text}>
        Video unavailable. Check the file, connection and 30 MiB limit.
      </Text>
      <Pressable accessibilityRole="button" onPress={retry} disabled={query.isFetching}>
        <Text style={styles.text}>Retry</Text>
      </Pressable>
    </View>
  );
}
function LoadedVideo({ base64, mime, label }: { base64: string; mime: string; label: string }) {
  if (!isWeb)
    return (
      <HostVideo
        base64={base64}
        mimeType={mime as "video/mp4" | "video/quicktime" | "video/webm"}
        label={label}
      />
    );
  return <WebVideo base64={base64} mime={mime} label={label} />;
}
function WebVideo({ base64, mime, label }: { base64: string; mime: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = createMediaUrl(base64, mime);
    setUrl(next);
    return () => {
      if (next) revokeMediaUrl(next);
    };
  }, [base64, mime]);
  if (!url) return <Text>Preparing video…</Text>;
  return renderVideoElement({ src: url, label });
}
