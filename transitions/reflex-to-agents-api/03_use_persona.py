from common import default_agent, run, workspace_session

PERSONA = """You are a careful Python reviewer.
Prioritize correctness and explain the evidence for each finding.
Keep the summary concise. Mark assumptions explicitly.
"""


async def main() -> None:
    async with workspace_session(agent=default_agent(PERSONA)) as work:
        await work.turn(
            "Review this proposal: replace all requests calls with aiohttp without "
            "changing callers. Write risks and a safer plan to outputs/review.md."
        )
        await work.save("review.md")


if __name__ == "__main__":
    run(main())
