#!/usr/bin/env bash
set -euo pipefail

NEMOCLAW_INSTALL_REF=26922313bba96184e65c3663b351683ebae9504d
NEMOCLAW_SANDBOX_NAME=runloop-example

: "${OPENAI_API_KEY:?OPENAI_API_KEY must be injected as a Runloop secret}"

if ! command -v docker >/dev/null 2>&1 || ! command -v lsof >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io lsof
fi

if ! docker info >/dev/null 2>&1; then
  nohup sudo env PATH=/usr/sbin:/usr/bin:/sbin:/bin /usr/sbin/dockerd \
    --host=unix:///var/run/docker.sock --group="$(id -gn)" \
    >/tmp/nemoclaw-dockerd.log 2>&1 </dev/null &
  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! docker info >/dev/null 2>&1; then
  tail -50 /tmp/nemoclaw-dockerd.log >&2
  exit 1
fi
export PATH="$HOME/.local/bin:$PATH"

env -u OPENAI_API_KEY curl -fsSL "https://raw.githubusercontent.com/NVIDIA/NemoClaw/${NEMOCLAW_INSTALL_REF}/install.sh" | \
  NEMOCLAW_INSTALL_REF="$NEMOCLAW_INSTALL_REF" \
  NEMOCLAW_NON_INTERACTIVE=1 \
  NEMOCLAW_ACCEPT_THIRD_PARTY_SOFTWARE=1 \
  NEMOCLAW_AGENT=hermes \
  NEMOCLAW_PROVIDER=openai \
  NEMOCLAW_MODEL=gpt-5.4-mini \
  NEMOCLAW_SANDBOX_NAME="$NEMOCLAW_SANDBOX_NAME" \
  NEMOCLAW_POLICY_TIER=balanced \
  NEMOCLAW_WEB_SEARCH_PROVIDER=none \
  bash

command -v nemoclaw-acp >/dev/null
