#!/usr/bin/env bash
set -euo pipefail
# Xcode supplies PODS_ROOT to the React Native bundle phase.
: "${PODS_ROOT:?Run this wrapper from the Xcode bundle phase}"
args=()
for arg in "$@"; do
  if [[ "${PASEO_HERMES_LOW_MEMORY:-0}" == 1 && "$arg" == -O ]]; then
    args+=(-Og)
  else
    args+=("$arg")
  fi
done
exec "$PODS_ROOT/hermes-engine/destroot/bin/hermesc" "${args[@]}"
