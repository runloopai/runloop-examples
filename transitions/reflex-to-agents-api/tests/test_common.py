import base64
import importlib.util
import io
import tempfile
import unittest
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx2

import common


def event(kind, child=None, turn_id="turn_main"):
    return SimpleNamespace(
        type=kind, turn=SimpleNamespace(subagent_id=child, id=turn_id)
    )


class EventStream:
    def __init__(self, events):
        self.events = events

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    async def __aiter__(self):
        for item in self.events:
            yield item


def session(status="idle"):
    return SimpleNamespace(
        id="sess_test",
        status=status,
        environment=SimpleNamespace(id="env_test", type="openai_hosted"),
    )


def client_fixture():
    client = MagicMock()
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=False)
    client.beta.agents.sessions.create = AsyncMock(return_value=session())
    client.beta.agents.sessions.retrieve = AsyncMock(return_value=session())
    client.beta.agents.sessions.delete = AsyncMock()
    client.beta.agents.sessions.events.create = AsyncMock()
    return client


def load_script(filename):
    spec = importlib.util.spec_from_file_location(
        filename, Path(common.__file__).parent / filename
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TurnTests(unittest.IsolatedAsyncioTestCase):
    def workspace(self, events):
        client = client_fixture()
        client.beta.agents.sessions.stream.return_value = EventStream(events)
        return common.WorkspaceSession(client, session())

    async def test_root_completion_waits_for_idle(self):
        work = self.workspace(
            [
                event("agent.session.idle"),
                event("agent.session.turn.completed", "child"),
                event("agent.session.turn.completed"),
                event("agent.session.idle"),
            ]
        )
        await work.turn("task")
        self.assertEqual(work.turn_id, "turn_main")

    async def test_child_failure_or_cancel_does_not_fail_root(self):
        for kind in ("agent.session.turn.failed", "agent.session.turn.cancelled"):
            work = self.workspace(
                [
                    event(kind, "child"),
                    event("agent.session.turn.completed"),
                    event("agent.session.idle"),
                ]
            )
            await work.turn("task")

    async def test_root_and_session_failures_are_fatal(self):
        for kind in (
            "agent.session.turn.failed",
            "agent.session.turn.cancelled",
            "error",
            "agent.session.failed",
            "agent.session.environment.failed",
        ):
            work = self.workspace([event(kind)])
            with self.assertRaises(common.ExampleError):
                await work.turn("task")
            self.assertIsNone(work.turn_id)

    async def test_no_idle_and_child_only_are_incomplete(self):
        for child in (None, "child"):
            work = self.workspace([event("agent.session.turn.completed", child)])
            with self.assertRaisesRegex(common.ExampleError, "before main-turn"):
                await work.turn("task")

    async def test_failure_after_completion_is_not_hidden(self):
        work = self.workspace(
            [event("agent.session.turn.completed"), event("agent.session.failed")]
        )
        with self.assertRaises(common.ExampleError):
            await work.turn("task")

    async def test_failed_follow_up_clears_previous_turn_id(self):
        work = self.workspace([event("agent.session.turn.failed")])
        work.turn_id = "previous"
        with self.assertRaises(common.ExampleError):
            await work.turn("task")
        self.assertIsNone(work.turn_id)


class ArtifactTests(unittest.IsolatedAsyncioTestCase):
    async def test_download_matches_turn_and_path(self):
        client = client_fixture()
        artifacts = [
            SimpleNamespace(id="old", turn_id="old", path="/workspace/outputs/plan.md"),
            SimpleNamespace(
                id="other", turn_id="turn_main", path="/workspace/outputs/other.md"
            ),
            SimpleNamespace(
                id="correct", turn_id="turn_main", path="/workspace/outputs/plan.md"
            ),
        ]

        async def listing():
            for artifact in artifacts:
                yield artifact

        client.beta.agents.sessions.artifacts.list.return_value = listing()
        response = MagicMock()
        response.__aenter__ = AsyncMock(return_value=response)
        response.__aexit__ = AsyncMock(return_value=False)

        async def write(target):
            target.write_text("plan")

        response.stream_to_file = AsyncMock(side_effect=write)
        content = client.beta.agents.sessions.artifacts.with_streaming_response.content
        content.return_value = response
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(common, "__file__", str(Path(directory) / "common.py")),
        ):
            target = await common.WorkspaceSession(client, session(), "turn_main").save(
                "plan.md"
            )
            self.assertEqual(target.read_text(), "plan")
        content.assert_called_once_with("correct", session_id="sess_test")

    async def test_no_turn_prevents_download(self):
        with self.assertRaisesRegex(common.ExampleError, "Complete a turn"):
            await common.WorkspaceSession(client_fixture(), session()).save("plan.md")


class LifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def test_body_failure_cleans_managed_session(self):
        client = client_fixture()
        with (
            patch.object(common, "AsyncOpenAI", return_value=client),
            patch.dict(common.os.environ, {"OPENAI_API_KEY": "application-fixture"}),
            self.assertRaisesRegex(RuntimeError, "body failed"),
        ):
            async with common.workspace_session():
                raise RuntimeError("body failed")
        client.beta.agents.sessions.delete.assert_awaited_once_with("sess_test")
        config = client.beta.agents.sessions.create.call_args.kwargs
        self.assertEqual(config["environment"]["type"], "openai_hosted")
        self.assertNotIn("env", config["environment"])

    async def test_cleanup_cancels_active_turn(self):
        client = client_fixture()
        client.beta.agents.sessions.retrieve.return_value = session("in_progress")
        await common.delete_session(client, "sess_test")
        client.beta.agents.sessions.events.create.assert_awaited_once_with(
            "sess_test", events=[{"type": "agent.session.input.cancel"}]
        )

    def conflict(self):
        response = httpx2.Response(
            409, request=httpx2.Request("DELETE", "https://example.test")
        )
        return common.ConflictError("fixture", response=response, body=None)

    async def test_cleanup_retries_conflict(self):
        client = client_fixture()
        client.beta.agents.sessions.delete.side_effect = [self.conflict(), None]
        with patch.object(common.asyncio, "sleep", new_callable=AsyncMock):
            await common.delete_session(client, "sess_test")
        self.assertEqual(client.beta.agents.sessions.delete.await_count, 2)

    async def test_cleanup_conflicts_are_bounded(self):
        client = client_fixture()
        client.beta.agents.sessions.delete.side_effect = self.conflict()
        with (
            patch.object(common.asyncio, "sleep", new_callable=AsyncMock),
            self.assertRaisesRegex(common.ExampleError, "Cleanup did not finish"),
        ):
            await common.delete_session(client, "sess_test")
        self.assertEqual(client.beta.agents.sessions.delete.await_count, 6)

    async def test_idle_wait_refuses_failed_or_action_required(self):
        for status in ("failed", "requires_action"):
            client = client_fixture()
            client.beta.agents.sessions.retrieve.return_value = session(status)
            with self.assertRaisesRegex(common.ExampleError, "needs attention"):
                await common.wait_idle(client, "sess_test")

    async def test_idle_wait_polls_active_session(self):
        client = client_fixture()
        client.beta.agents.sessions.retrieve.side_effect = [
            session("in_progress"),
            session(),
        ]
        with patch.object(common.asyncio, "sleep", new_callable=AsyncMock):
            self.assertEqual(
                (await common.wait_idle(client, "sess_test")).id, "sess_test"
            )


class CleanupRecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_session_cleanup_failure_preserves_body_error(self):
        client = client_fixture()
        client.beta.agents.sessions.delete.side_effect = RuntimeError(
            "sensitive-fixture"
        )
        stderr = io.StringIO()
        with (
            patch.object(common, "AsyncOpenAI", return_value=client),
            patch.dict(common.os.environ, {"OPENAI_API_KEY": "application-fixture"}),
            patch("sys.stderr", stderr),
            self.assertRaisesRegex(common.ExampleError, "Task failed"),
        ):
            async with common.workspace_session():
                raise common.ExampleError("Task failed")
        self.assertIn("delete session sess_test", stderr.getvalue())
        self.assertNotIn("sensitive-fixture", stderr.getvalue())


class ConfigurationTests(unittest.TestCase):
    def test_inline_file_is_base64_workspace_input(self):
        item = common.inline_file("brief.txt", "brief")
        self.assertEqual(item["path"], "/workspace/brief.txt")
        self.assertEqual(base64.b64decode(item["data"]), b"brief")

    def test_persona_is_agent_instructions(self):
        persona = load_script("03_use_persona.py").PERSONA
        self.assertEqual(common.default_agent(persona)["instructions"], persona)

    def test_mcp_routes_and_stdio_path(self):
        module = load_script("04_connect_mcp.py")
        for route in ("service", "environment", "stdio"):
            agent, environment, _ = module.configuration(route)
            tool = agent["tools"][0]
            if route == "stdio":
                self.assertNotIn("connection_origin", tool)
                self.assertEqual(tool["transport"]["cwd"], "/workspace")
                self.assertEqual(environment["network"]["access"], "enabled")
                self.assertTrue(environment["files"])
            else:
                self.assertEqual(tool["connection_origin"], route)
        with self.assertRaises(ValueError):
            module.configuration("invalid")


class ReturnTests(unittest.IsolatedAsyncioTestCase):
    async def test_start_retains_session(self):
        module = load_script("05_return_to_work.py")
        client = client_fixture()
        with (
            patch.object(module, "AsyncOpenAI", return_value=client),
            patch.object(module.WorkspaceSession, "turn", new_callable=AsyncMock),
            patch.object(module.WorkspaceSession, "save", new_callable=AsyncMock),
            patch("sys.argv", ["example", "start"]),
            patch.dict(common.os.environ, {"OPENAI_API_KEY": "application-fixture"}),
        ):
            await module.main()
        client.beta.agents.sessions.delete.assert_not_awaited()

    async def test_expired_environment_does_not_submit(self):
        module = load_script("05_return_to_work.py")
        client = client_fixture()
        client.beta.agents.environments.retrieve = AsyncMock(
            return_value=SimpleNamespace(status="expired")
        )
        with (
            patch.object(module, "AsyncOpenAI", return_value=client),
            patch("sys.argv", ["example", "continue", "sess_test"]),
            patch.dict(common.os.environ, {"OPENAI_API_KEY": "application-fixture"}),
            self.assertRaisesRegex(common.ExampleError, "Workspace unavailable"),
        ):
            await module.main()
        client.beta.agents.sessions.stream.assert_not_called()


class GitHubTests(unittest.IsolatedAsyncioTestCase):
    async def test_auth_modes_attach_vault_without_secret_in_prompt(self):
        module = load_script("06_github_auth.py")
        for mode in ("mcp", "api"):
            client = client_fixture()
            client.beta.agents.vaults.create = AsyncMock(
                return_value=SimpleNamespace(id="vault_test")
            )
            client.beta.agents.vaults.credentials.create = AsyncMock(
                return_value=SimpleNamespace(id="cred_test")
            )
            client.beta.agents.vaults.delete = AsyncMock()
            work = MagicMock()
            work.turn = AsyncMock()
            work.save = AsyncMock()
            configs = []

            @asynccontextmanager
            async def workspace(configs=configs, work=work, **kwargs):
                configs.append(kwargs)
                yield work

            with (
                patch.object(module, "AsyncOpenAI", return_value=client),
                patch.object(module, "workspace_session", side_effect=workspace),
                patch("sys.argv", ["example", mode]),
                patch.dict(
                    module.os.environ,
                    {
                        "OPENAI_API_KEY": "application-fixture",
                        "GITHUB_TOKEN": "github-fixture",
                        "GITHUB_REPOSITORY": "owner/repo",
                    },
                ),
            ):
                await module.main()
            config = configs[0]
            self.assertEqual(config["vault_ids"], ["vault_test"])
            self.assertNotIn("github-fixture", work.turn.call_args.args[0])
            self.assertNotIn("env", config["environment"])
            auth = client.beta.agents.vaults.credentials.create.call_args.kwargs["auth"]
            if mode == "mcp":
                self.assertEqual(auth["type"], "static_bearer")
                self.assertEqual(
                    config["agent"]["tools"][0]["allowed_tools"],
                    ["search_issues", "issue_read"],
                )
            else:
                self.assertEqual(
                    auth["networking"]["allowed_hosts"], ["api.github.com"]
                )
                self.assertEqual(
                    config["environment"]["network"]["allowed_domains"],
                    ["api.github.com"],
                )
            client.beta.agents.vaults.delete.assert_awaited_once_with("vault_test")


class RecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_vault_cleanup_failure_is_actionable(self):
        await self.vault_cleanup_case(task_fails=False)

    async def test_vault_cleanup_failure_preserves_primary_error(self):
        await self.vault_cleanup_case(task_fails=True)

    async def vault_cleanup_case(self, task_fails):
        module = load_script("06_github_auth.py")
        client = client_fixture()
        client.beta.agents.vaults.create = AsyncMock(
            return_value=SimpleNamespace(id="vault_test")
        )
        client.beta.agents.vaults.credentials.create = AsyncMock()
        client.beta.agents.vaults.delete = AsyncMock(
            side_effect=RuntimeError("sensitive-fixture")
        )
        work = MagicMock()
        work.turn = AsyncMock(
            side_effect=common.ExampleError("Task failed") if task_fails else None
        )
        work.save = AsyncMock()

        @asynccontextmanager
        async def workspace(**kwargs):
            yield work

        stdout, stderr = io.StringIO(), io.StringIO()
        expected = "Task failed" if task_fails else "Vault cleanup failed"
        with (
            patch.object(module, "AsyncOpenAI", return_value=client),
            patch.object(module, "workspace_session", side_effect=workspace),
            patch("sys.argv", ["example", "api"]),
            patch.dict(
                module.os.environ,
                {
                    "OPENAI_API_KEY": "application-fixture",
                    "GITHUB_TOKEN": "github-fixture",
                },
            ),
            patch("sys.stdout", stdout),
            patch("sys.stderr", stderr),
            self.assertRaisesRegex(common.ExampleError, expected),
        ):
            await module.main()
        self.assertIn("Vault: vault_test", stdout.getvalue())
        if task_fails:
            self.assertIn("delete vault vault_test", stderr.getvalue())
        self.assertNotIn("sensitive-fixture", stdout.getvalue() + stderr.getvalue())
        self.assertNotIn("github-fixture", stdout.getvalue() + stderr.getvalue())

    async def test_return_to_work_checks_key_before_client(self):
        module = load_script("05_return_to_work.py")
        with (
            patch.dict(common.os.environ, {}, clear=True),
            patch("sys.argv", ["example", "start"]),
            patch.object(module, "AsyncOpenAI") as constructor,
            self.assertRaisesRegex(common.ExampleError, "Set OPENAI_API_KEY"),
        ):
            await module.main()
        constructor.assert_not_called()


class OutputTests(unittest.TestCase):
    def test_cli_reports_missing_key(self):
        async def example():
            async with common.workspace_session():
                self.fail("Missing key must prevent provisioning")

        output = io.StringIO()
        with (
            patch.dict(common.os.environ, {}, clear=True),
            patch("sys.stderr", output),
            self.assertRaises(SystemExit),
        ):
            common.run(example())
        self.assertIn("Set OPENAI_API_KEY", output.getvalue())

    def test_cli_does_not_echo_exception_body(self):
        async def example():
            raise RuntimeError("sensitive-fixture")

        output = io.StringIO()
        with patch("sys.stderr", output), self.assertRaises(SystemExit):
            common.run(example())
        self.assertIn("RuntimeError", output.getvalue())
        self.assertNotIn("sensitive-fixture", output.getvalue())


if __name__ == "__main__":
    unittest.main()
