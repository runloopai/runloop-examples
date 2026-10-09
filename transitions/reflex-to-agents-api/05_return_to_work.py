import os
import sys

from openai import AsyncOpenAI

from common import (
    ExampleError,
    WorkspaceSession,
    default_agent,
    delete_session,
    run,
    wait_idle,
)


async def main() -> None:
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action not in {"start", "continue", "cancel", "delete"}:
        raise ExampleError(
            "Choose start, continue SESSION_ID, cancel SESSION_ID, or delete SESSION_ID"
        )
    if action != "start" and len(sys.argv) != 3:
        raise ExampleError("Provide the saved session ID")
    if not os.environ.get("OPENAI_API_KEY"):
        raise ExampleError("Set OPENAI_API_KEY before running this example")
    async with AsyncOpenAI(timeout=60, max_retries=0) as client:
        if action == "start":
            session = await client.beta.agents.sessions.create(
                agent=default_agent(),
                environment={
                    "type": "openai_hosted",
                    "network": {"access": "disabled"},
                },
            )
            print(f"Keep this session ID: {session.id}", flush=True)
            work = WorkspaceSession(client, session)
            await work.turn("Write an async Python migration plan to outputs/plan.md.")
            await work.save("plan.md")
            return
        session_id = sys.argv[2]
        if action == "delete":
            await delete_session(client, session_id)
            return
        if action == "cancel":
            await client.beta.agents.sessions.events.create(
                session_id, events=[{"type": "agent.session.input.cancel"}]
            )
            await wait_idle(client, session_id)
            return
        session = await wait_idle(client, session_id)
        if session.environment.type != "openai_hosted":
            raise ExampleError("Expected a managed sandbox session")
        environment = await client.beta.agents.environments.retrieve(
            session.environment.id
        )
        if environment.status != "connected":
            raise ExampleError(
                "Workspace unavailable; download published artifacts and upload them into a new session"
            )
        work = WorkspaceSession(client, session)
        await work.turn(
            "Read outputs/plan.md; if missing, stop and explain. Otherwise write "
            "the next steps to outputs/next-steps.md."
        )
        await work.save("next-steps.md")


if __name__ == "__main__":
    run(main())
