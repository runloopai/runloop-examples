from common import run, workspace_session


async def main() -> None:
    async with workspace_session() as work:
        await work.turn(
            "Write a five-step async Python migration plan to outputs/plan.md."
        )
        await work.save("plan.md")
        await work.turn(
            "Read outputs/plan.md and write a checklist to outputs/checklist.md."
        )
        await work.save("checklist.md")


if __name__ == "__main__":
    run(main())
