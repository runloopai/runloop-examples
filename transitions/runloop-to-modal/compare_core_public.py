"""Compare basic Runloop and Modal SDK behavior with isolated resources."""

import argparse
import asyncio
import json
import os
import sys
import uuid
from importlib.metadata import version
from pathlib import Path

import modal
from runloop_api_client import AsyncRunloopSDK


def check(
    name: str, runloop_value: object, modal_value: object, expected: object
) -> dict:
    return {
        "name": name,
        "runloop": runloop_value,
        "modal": modal_value,
        "expected": expected,
        "pass": runloop_value == modal_value == expected,
    }


async def compare() -> dict:
    runloop_key = os.environ.get("RUNLOOP_API_KEY")
    if not runloop_key:
        raise ValueError("Set RUNLOOP_API_KEY before running")

    token = uuid.uuid4().hex
    report = {
        "versions": {
            "runloop-api-client": version("runloop-api-client"),
            "modal": version("modal"),
        },
        "cases": [],
        "cleanup": {},
    }
    runloop_box = None
    modal_box = None
    async with AsyncRunloopSDK(bearer_token=runloop_key) as runloop:
        try:
            runloop_box = await runloop.devbox.create(
                name=f"transition-probe-{token[:12]}"
            )
            app = await modal.App.lookup.aio(
                "runloop-transition-validation", create_if_missing=True
            )
            modal_box = await modal.Sandbox.create.aio(app=app, timeout=300)

            command = "printf 'stdout-probe\\n'; printf 'stderr-probe\\n' >&2"
            runloop_result = await runloop_box.cmd.exec(command)
            modal_process = await modal_box.exec.aio("bash", "-lc", command)
            modal_stdout = await modal_process.stdout.read.aio()
            modal_stderr = await modal_process.stderr.read.aio()
            await modal_process.wait.aio()
            report["cases"].extend(
                [
                    check(
                        "command exit code",
                        runloop_result.exit_code,
                        modal_process.returncode,
                        0,
                    ),
                    check(
                        "command stdout",
                        await runloop_result.stdout(),
                        modal_stdout,
                        "stdout-probe\n",
                    ),
                    check(
                        "command stderr",
                        await runloop_result.stderr(),
                        modal_stderr,
                        "stderr-probe\n",
                    ),
                ]
            )

            path = f"/tmp/transition-probe-{token}.txt"
            content = f"transition probe {token} — café\n"
            await runloop_box.file.write(file_path=path, contents=content)
            await modal_box.filesystem.write_text.aio(content, path)
            report["cases"].append(
                check(
                    "UTF-8 file round trip",
                    await runloop_box.file.read(file_path=path),
                    await modal_box.filesystem.read_text.aio(path),
                    content,
                )
            )
        finally:
            if runloop_box is not None:
                try:
                    await runloop_box.shutdown()
                    report["cleanup"]["runloop"] = "ok"
                except Exception as exc:
                    report["cleanup"]["runloop"] = f"failed: {type(exc).__name__}"
            if modal_box is not None:
                try:
                    await modal_box.terminate.aio(wait=True)
                    await modal_box.detach.aio()
                    report["cleanup"]["modal"] = "ok"
                except Exception as exc:
                    report["cleanup"]["modal"] = f"failed: {type(exc).__name__}"
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", type=Path, default=Path("transition-results_private.json")
    )
    args = parser.parse_args()
    try:
        report = asyncio.run(compare())
    except Exception as exc:
        print(f"Probe failed: {type(exc).__name__}", file=sys.stderr)
        return 2
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.output}")
    return (
        0
        if all(case["pass"] for case in report["cases"])
        and all(status == "ok" for status in report["cleanup"].values())
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())
