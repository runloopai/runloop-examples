# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "runloop-api-client",
# ]
# ///
# Run this script with: uv run axon_claude_docs.py

from __future__ import annotations

import asyncio
import json
import os

from runloop_api_client import AsyncRunloopSDK
from runloop_api_client.types.axon_publish_params import AxonPublishParams
from runloop_api_client.types.shared_params.broker_mount import BrokerMount
from typing import Literal
from typing import Any


def make_axon_event(
    event_type: str,
    payload: dict[str, Any] | str,
    *,
    origin: Literal["EXTERNAL_EVENT", "AGENT_EVENT", "USER_EVENT"] = "USER_EVENT",
    source: str = "axon_claude",
) -> AxonPublishParams:
    """Build a publish-ready event with sensible defaults."""
    wire_payload = payload if isinstance(payload, str) else json.dumps(payload)
    return {
        "event_type": event_type,
        "origin": origin,
        "payload": wire_payload,
        "source": source,
    }


async def main(sdk: AsyncRunloopSDK) -> None:
    """Send a prompt to Claude Code and stream the response."""

    # Create an Axon for session communication
    axon = await sdk.axon.create(name="claude-session")

    print("creating a devbox and installing Claude Code")

    broker_mount: BrokerMount = {
        "type": "broker_mount",
        "axon_id": axon.id,
        "protocol": "claude_json",
        "launch_args": [],
    }

    # Create a Devbox with Claude Code agent
    async with await sdk.devbox.create(
        mounts=[broker_mount],
        launch_parameters={
            "launch_commands": [
                "curl -fsSL https://claude.ai/install.sh | bash && echo 'export PATH=\"$HOME/.local/bin:$PATH\"' >> ~/.bash_profile",
            ],
        },
        environment_variables={
            "PATH": "/home/user/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY") or "",
        },
    ) as devbox:
        print(f"created devbox, id={devbox.id}")

        async with await axon.subscribe_sse() as stream:
            user_prompt = "Who are you?"

            print(f"> {user_prompt}")
            print("< ", end="", flush=True)

            await axon.publish(
                **make_axon_event(
                    "query",
                    {
                        "type": "user",
                        "message": {
                            "role": "user",
                            "content": [{"type": "text", "text": user_prompt}],
                        },
                        "session_id": axon.id,
                    },
                )
            )

            async for ev in stream:
                # Print assistant text content and finish
                if ev.event_type == "assistant":
                    payload = json.loads(ev.payload)
                    content = payload.get("message", {}).get("content", [])
                    for block in content:
                        if block.get("type") == "text":
                            print(block.get("text", ""), end="", flush=True)
                    break
            print()

            print(
                f"\nView full Axon event stream at https://platform.runloop.ai/axons/{axon.id}"
            )


async def run() -> None:
    async with AsyncRunloopSDK() as sdk:
        await main(sdk)


if __name__ == "__main__":
    if os.getenv("RUNLOOP_API_KEY") is None:
        print("RUNLOOP_API_KEY is not set")
        exit(1)
    if os.getenv("ANTHROPIC_API_KEY") is None:
        print("ANTHROPIC_API_KEY is not set")
        exit(1)
    asyncio.run(run())
