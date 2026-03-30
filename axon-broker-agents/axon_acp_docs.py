# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "runloop-api-client",
#     "agent-client-protocol",
# ]
# ///
# Run this script with: uv run axon_acp_docs.py

from __future__ import annotations

import asyncio
import json
import os
import warnings
import acp

from acp import (
    InitializeRequest,
    NewSessionRequest,
    PROTOCOL_VERSION,
    PromptRequest,
)
from acp.schema import (
    Implementation,
    TextContentBlock,
)

from runloop_api_client import AsyncRunloopSDK
from runloop_api_client.types.axon_publish_params import AxonPublishParams
from typing import Literal

warnings.filterwarnings("ignore", message="Pydantic serializer warnings")


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
    # Create an Axon for session communication
    axon = await sdk.axon.create(name="acp-session")

    print("creating a devbox and installing opencode")

    # Create a Devbox with an ACP-compliant agent, Opencode
    async with await sdk.devbox.create(
        mounts=[
            {
                "type": "broker_mount",
                "axon_id": axon.id,
                "protocol": "acp",
                "agent_binary": "opencode",
                "launch_args": ["acp"],
            }
        ],
        launch_parameters={
            "launch_commands": ["npm i -g opencode-ai"],
        },
    ) as devbox:
        print(f"created devbox, id={devbox.id}")

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
                # Phase 1: Wait for session/new response from the agent
                if (
                    not session_id
                    and ev.event_type == "session/new"
                    and ev.origin == "AGENT_EVENT"
                ):
                    session_id = json.loads(ev.payload)["sessionId"]
                    print(f"> {user_prompt}")
                    print("< ", end="", flush=True)
                    prompt = PromptRequest(
                        session_id=session_id,
                        prompt=[TextContentBlock(type="text", text=user_prompt)],
                    )
                    await axon.publish(**make_axon_event("session/prompt", prompt))
                    prompt_sent = True
                    continue

                # Phase 2: Stream agent response
                if prompt_sent:
                    if ev.event_type == "agent_message_chunk":
                        text_part = json.loads(ev.payload)["update"]["content"]["text"]
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
    if os.getenv("RUNLOOP_API_KEY") is None:
        print("RUNLOOP_API_KEY is not set")
        exit(1)
    asyncio.run(run())
