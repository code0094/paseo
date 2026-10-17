# Inline video plugin

Derived from [kschniedergers/paseo-plugins](https://github.com/kschniedergers/paseo-plugins/tree/da91d9b635afbd60211c66a71c0b9c06b72b828e/video-embeds), MIT license (retained in LICENSE).

Install this directory with `paseo plugin install /absolute/path/to/plugin-examples/video-embeds`.
Use the same installation ID as the existing video-embeds plugin, never enable two video transformers together.

The agent emits `![clip](/absolute/path/clip.mp4)`. On the custom mobile build the plugin shows the host native player; web keeps the HTML player. Official mobile clients show an explanatory placeholder. No special skill or HTML document is needed.

Files load on tap, up to 30 MiB; plugin RPC transfers the full file as base64. Codecs depend on the device; MP4 with H.264/AAC is the initial validation target. Mixed image/video messages are still left to the default renderer.
