from openai.types.beta.environment_param import EnvironmentParamOpenAIHosted

from common import inline_file, run, workspace_session


async def main() -> None:
    environment: EnvironmentParamOpenAIHosted = {
        "type": "openai_hosted",
        "network": {"access": "disabled"},
        "files": [
            inline_file(
                "brief.txt", "Plan a synchronous Python service's move to async.\n"
            )
        ],
    }
    async with workspace_session(environment=environment) as work:
        await work.turn("Read brief.txt and write a five-step plan to outputs/plan.md.")
        await work.save("plan.md")


if __name__ == "__main__":
    run(main())
