import asyncio
import base64
import os
import sys
from collections.abc import AsyncIterator, Coroutine
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI, ConflictError
from openai.types.beta.agent_session import AgentSession
from openai.types.beta.agents.session_create_params import Agent
from openai.types.beta.environment_param import EnvironmentParamOpenAIHosted
from openai.types.beta.hosted_environment_file_param import (
    HostedEnvironmentFileParamInline,
)


class ExampleError(RuntimeError):
    """Messages must not contain credentials, file contents, or connection URLs."""


def default_agent(
    instructions: str = "Write clear files and verify your work.",
) -> Agent:
    return {
        "model": os.environ.get("OPENAI_AGENT_MODEL", "gpt-6-astra"),
        "instructions": instructions,
    }


def inline_file(filename: str, contents: str) -> HostedEnvironmentFileParamInline:
    return {
        "type": "inline",
        "path": f"/workspace/{filename}",
        "data": base64.b64encode(contents.encode()).decode(),
    }


async def wait_idle(client: AsyncOpenAI, session_id: str) -> AgentSession:
    async with asyncio.timeout(90):
        while True:
            session = await client.beta.agents.sessions.retrieve(session_id)
            if session.status == "idle":
                return session
            if session.status in {"failed", "requires_action"}:
                raise ExampleError(
                    "Session needs attention; inspect its saved state before continuing"
                )
            await asyncio.sleep(1)


async def delete_session(client: AsyncOpenAI, session_id: str) -> None:
    async with asyncio.timeout(90):
        session = await client.beta.agents.sessions.retrieve(session_id)
        if session.status == "in_progress":
            await client.beta.agents.sessions.events.create(
                session_id, events=[{"type": "agent.session.input.cancel"}]
            )
        for attempt in range(6):
            try:
                await client.beta.agents.sessions.delete(session_id)
                return
            except ConflictError:
                if attempt == 5:
                    raise ExampleError(
                        "Cleanup did not finish; delete the printed session ID later"
                    ) from None
                await asyncio.sleep(2**attempt)


@dataclass
class WorkspaceSession:
    client: AsyncOpenAI
    session: AgentSession
    turn_id: str | None = None

    async def turn(self, prompt: str) -> None:
        self.turn_id = None
        async with asyncio.timeout(300):
            async with self.client.beta.agents.sessions.stream(
                self.session.id, input=prompt
            ) as events:
                completed = None
                async for event in events:
                    if (
                        event.type == "agent.session.turn.failed"
                        or event.type == "agent.session.turn.cancelled"
                    ):
                        if event.turn.subagent_id is not None:
                            continue
                        raise ExampleError(f"Turn failed: {event.type}")
                    if event.type in {
                        "error",
                        "agent.session.failed",
                        "agent.session.environment.failed",
                    }:
                        raise ExampleError(f"Session failed: {event.type}")
                    if (
                        event.type == "agent.session.turn.completed"
                        and event.turn.subagent_id is None
                    ):
                        completed = event.turn.id
                    if event.type == "agent.session.idle" and completed is not None:
                        self.turn_id = completed
                        return
                raise ExampleError(
                    "Stream ended before main-turn completion and session idle"
                )

    async def save(self, filename: str) -> Path:
        if self.turn_id is None:
            raise ExampleError("Complete a turn before downloading its artifact")
        directory = Path(__file__).parent / "artifacts" / self.session.id
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / filename
        async for artifact in self.client.beta.agents.sessions.artifacts.list(
            self.session.id
        ):
            if (
                artifact.turn_id != self.turn_id
                or artifact.path != f"/workspace/outputs/{filename}"
            ):
                continue
            async with (
                self.client.beta.agents.sessions.artifacts.with_streaming_response.content(
                    artifact.id, session_id=self.session.id
                ) as response
            ):
                await response.stream_to_file(target)
            if not target.read_bytes().strip():
                raise ExampleError("Expected a non-empty artifact")
            print(f"Saved {target}")
            return target
        raise ExampleError("Expected artifact missing; inspect the saved session items")


@asynccontextmanager
async def workspace_session(
    agent: Agent | None = None,
    environment: EnvironmentParamOpenAIHosted | None = None,
    vault_ids: list[str] | None = None,
) -> AsyncIterator[WorkspaceSession]:
    if not os.environ.get("OPENAI_API_KEY"):
        raise ExampleError("Set OPENAI_API_KEY before running this example")
    async with AsyncOpenAI(timeout=60, max_retries=0) as client:
        session = await client.beta.agents.sessions.create(
            agent=agent if agent is not None else default_agent(),
            environment=environment
            if environment is not None
            else {"type": "openai_hosted", "network": {"access": "disabled"}},
            vault_ids=vault_ids or [],
        )
        print(f"Session: {session.id}", flush=True)
        succeeded = False
        try:
            yield WorkspaceSession(client, session)
            succeeded = True
        finally:
            try:
                await delete_session(client, session.id)
            except Exception:
                if succeeded:
                    raise
                print(
                    f"Session cleanup failed; delete session {session.id} later",
                    file=sys.stderr,
                )


def run(example: Coroutine[Any, Any, None]) -> None:
    try:
        asyncio.run(example)
    except KeyboardInterrupt:
        print(
            "Interrupted; use the printed session ID to check or clean up work.",
            file=sys.stderr,
        )
        raise SystemExit(130) from None
    except ExampleError as error:
        print(f"Example failed: {error}", file=sys.stderr)
        raise SystemExit(1) from None
    except Exception as error:  # noqa: BLE001
        # SDK response bodies can contain credentials or connection details.
        print(
            f"Example failed ({type(error).__name__}); inspect session state.",
            file=sys.stderr,
        )
        raise SystemExit(1) from None
