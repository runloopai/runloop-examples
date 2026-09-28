"""Compare basic Runloop and Tensorlake SDK behavior with isolated resources."""

import argparse
import asyncio
import json
import os
import sys
import uuid
from importlib.metadata import version
from pathlib import Path

from runloop_api_client import AsyncRunloopSDK
from tensorlake.sandbox import Sandbox


def check(name: str, runloop_value: object, tensorlake_value: object, expected: object) -> dict:
    return {
        "name": name,
        "runloop": runloop_value,
        "tensorlake": tensorlake_value,
        "expected": expected,
        "pass": runloop_value == tensorlake_value == expected,
    }


async def compare() -> dict:
    runloop_key = os.environ.get("RUNLOOP_API_KEY")
    tensorlake_key = os.environ.get("TENSORLAKE_API_KEY")
    if not runloop_key or not tensorlake_key:
        raise ValueError("Set RUNLOOP_API_KEY and TENSORLAKE_API_KEY before running")

    token = uuid.uuid4().hex
    report = {
        "versions": {
            "runloop-api-client": version("runloop-api-client"),
            "tensorlake": version("tensorlake"),
        },
        "cases": [],
        "cleanup": {},
    }
    runloop_box = None
    tensorlake_box = None
    async with AsyncRunloopSDK(bearer_token=runloop_key) as runloop:
        try:
            runloop_box = await runloop.devbox.create(name=f"transition-probe-{token[:12]}")
            tensorlake_box = Sandbox.create(
                name=f"transition-probe-{token[:12]}", api_key=tensorlake_key
            )

            command = "printf 'stdout-probe\\n'; printf 'stderr-probe\\n' >&2"
            runloop_result = await runloop_box.cmd.exec(command)
            tensorlake_result = tensorlake_box.run("bash", ["-lc", command])
            report["cases"].extend(
                [
                    check("command exit code", runloop_result.exit_code, tensorlake_result.exit_code, 0),
                    check("command stdout", await runloop_result.stdout(), tensorlake_result.stdout, "stdout-probe\n"),
                    check("command stderr", await runloop_result.stderr(), tensorlake_result.stderr, "stderr-probe\n"),
                ]
            )

            path = f"/tmp/transition-probe-{token}.txt"
            content = f"transition probe {token} — café\n"
            await runloop_box.file.write(file_path=path, contents=content)
            tensorlake_box.write_file(path, content.encode("utf-8"))
            report["cases"].append(
                check(
                    "UTF-8 file round trip",
                    await runloop_box.file.read(file_path=path),
                    tensorlake_box.read_file(path).decode("utf-8"),
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
            if tensorlake_box is not None:
                try:
                    tensorlake_box.terminate()
                    report["cleanup"]["tensorlake"] = "ok"
                except Exception as exc:
                    report["cleanup"]["tensorlake"] = f"failed: {type(exc).__name__}"
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("transition-results.json"))
    args = parser.parse_args()
    try:
        report = asyncio.run(compare())
    except Exception as exc:
        print(f"Probe failed: {type(exc).__name__}", file=sys.stderr)
        return 2
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.output}")
    return 0 if all(case["pass"] for case in report["cases"]) and all(
        status == "ok" for status in report["cleanup"].values()
    ) else 1


if __name__ == "__main__":
    raise SystemExit(main())
