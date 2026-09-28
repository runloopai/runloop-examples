# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "runloop-api-client",
#     "agent-client-protocol",
# ]
# ///
# Run this script with: uv run nemoclaw_acp.py

from __future__ import annotations

import asyncio
import json
import os
import sys
import warnings
from pathlib import Path
from typing import Literal

import acp
from acp import (
    PROTOCOL_VERSION,
    InitializeRequest,
    NewSessionRequest,
    PromptRequest,
)
from acp.schema import (
    Implementation,
    TextContentBlock,
)
from runloop_api_client import AsyncRunloopSDK
from runloop_api_client.lib.polling import PollingConfig
from runloop_api_client.types.axon_publish_params import AxonPublishParams

warnings.filterwarnings("ignore", message="Pydantic serializer warnings")

SANDBOX_NAME = "runloop-example"


def make_axon_event(
    event_type: str,
    payload: InitializeRequest | NewSessionRequest | PromptRequest | str,
    *,
    origin: Literal["EXTERNAL_EVENT", "AGENT_EVENT", "USER_EVENT"] = "USER_EVENT",
    source: str = "axon_acp",
) -> AxonPublishParams:
    """Build a publish-ready event with sensible defaults."""
    wire_payload = (
        payload
        if isinstance(payload, str)
        else json.dumps(
            payload.model_dump(mode="json", by_alias=True, exclude_none=True)
        )
    )
    return {
        "event_type": event_type,
        "origin": origin,
        "payload": wire_payload,
        "source": source,
    }


async def main(sdk: AsyncRunloopSDK) -> None:
    install_script = Path(__file__).with_name("install_nemoclaw.sh").read_text()
    axon = await sdk.axon.create(name="nemoclaw-axon")

    print("creating a devbox and onboarding NemoClaw Hermes")

    async with await sdk.devbox.create(
        name="nemoclaw-devbox",
        mounts=[
            {
                "type": "file_mount",
                "target": "/tmp/install_nemoclaw.sh",
                "content": install_script,
            },
            {
                "type": "broker_mount",
                "axon_id": axon.id,
                "protocol": "acp",
                "agent_binary": "nemoclaw-acp",
                "launch_args": ["--sandbox", SANDBOX_NAME],
            },
        ],
        launch_parameters={
            "resource_size_request": "CUSTOM_SIZE",
            "custom_cpu_cores": 4,
            "custom_gb_memory": 16,
            "custom_disk_size": 40,
            "launch_commands": ["bash /tmp/install_nemoclaw.sh"],
        },
        environment_variables={
            "PATH": "/home/user/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        },
        secrets={"OPENAI_API_KEY": os.environ["NEMOCLAW_OPENAI_SECRET_NAME"]},
        polling_config=PollingConfig(max_attempts=3600, timeout_seconds=3600),
    ) as devbox:
        print(f"created devbox, id={devbox.id}")

        async with asyncio.timeout(300):
            async with await axon.subscribe_sse() as stream:
                await axon.publish(
                    **make_axon_event(
                        "initialize",
                        acp.InitializeRequest(
                            protocol_version=PROTOCOL_VERSION,
                            client_info=Implementation(
                                name="runloop-axon", version="1.0.0"
                            ),
                        ),
                    )
                )
                await axon.publish(
                    **make_axon_event(
                        "session/new",
                        NewSessionRequest(cwd="/home/user", mcp_servers=[]),
                    )
                )

                session_id: str = ""
                prompt_sent = False
                user_prompt = "Who are you?"

                async for ev in stream:
                    if (
                        not session_id
                        and ev.event_type == "session/new"
                        and ev.origin == "AGENT_EVENT"
                    ):
                        session_id = json.loads(ev.payload).get("sessionId")
                        if not session_id:
                            raise RuntimeError("NemoClaw did not return a session ID")
                        print(f"> {user_prompt}")
                        print("< ", end="", flush=True)
                        prompt = PromptRequest(
                            session_id=session_id,
                            prompt=[TextContentBlock(type="text", text=user_prompt)],
                        )
                        await axon.publish(**make_axon_event("session/prompt", prompt))
                        prompt_sent = True
                        continue

                    if prompt_sent:
                        if (
                            ev.event_type == "session/update"
                            and ev.origin == "AGENT_EVENT"
                        ):
                            parsed = json.loads(ev.payload)
                            if (
                                parsed.get("update", {}).get("sessionUpdate")
                                == "agent_message_chunk"
                            ):
                                text_part = (
                                    parsed.get("update", {})
                                    .get("content", {})
                                    .get("text")
                                )
                                if text_part:
                                    print(text_part, end="", flush=True)
                        if ev.event_type == "turn.completed":
                            break
                print()

                print(
                    f"\nView full Axon event stream at https://platform.runloop.ai/axons/{axon.id}"
                )


async def run() -> None:
    async with AsyncRunloopSDK() as sdk:
        await main(sdk)


if __name__ == "__main__":
    missing = [
        name
        for name in ("RUNLOOP_API_KEY", "NEMOCLAW_OPENAI_SECRET_NAME")
        if not os.getenv(name)
    ]
    if missing:
        print(f"Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)
    asyncio.run(run())
