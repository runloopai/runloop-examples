from abc import ABCMeta, abstractmethod
from dataclasses import dataclass, fields, replace
from typing import Any
import os
import base64
from typing import Literal, Optional
from playwright.async_api import async_playwright

from anthropic.types.beta import BetaToolUnionParam


class BaseAnthropicTool(metaclass=ABCMeta):
    """Abstract base class for Anthropic-defined tools."""

    @abstractmethod
    def __call__(self, **kwargs) -> Any:
        """Executes the tool with the given arguments."""
        ...

    @abstractmethod
    def to_params(
        self,
    ) -> BetaToolUnionParam:
        raise NotImplementedError


@dataclass(kw_only=True, frozen=True)
class ToolResult:
    """Represents the result of a tool execution."""

    output: str | None = None
    error: str | None = None
    base64_image: str | None = None
    system: str | None = None

    def __bool__(self):
        return any(getattr(self, field.name) for field in fields(self))

    def __add__(self, other: "ToolResult"):
        def combine_fields(
            field: str | None, other_field: str | None, concatenate: bool = True
        ):
            if field and other_field:
                if concatenate:
                    return field + other_field
                raise ValueError("Cannot combine tool results")
            return field or other_field

        return ToolResult(
            output=combine_fields(self.output, other.output),
            error=combine_fields(self.error, other.error),
            base64_image=combine_fields(self.base64_image, other.base64_image, False),
            system=combine_fields(self.system, other.system),
        )

    def replace(self, **kwargs):
        """Returns a new ToolResult with the given fields replaced."""
        return replace(self, **kwargs)


class CLIResult(ToolResult):
    """A ToolResult that can be rendered as a CLI output."""


class ToolFailure(ToolResult):
    """A ToolResult that represents a failure."""


class ToolError(Exception):
    """Raised when a tool encounters an error."""

    def __init__(self, message):
        self.message = message


class ToolCollection:
    """A collection of anthropic-defined tools."""

    def __init__(self, *tools: BaseAnthropicTool):
        self.tools = tools
        self.tool_map = {tool.to_params()["name"]: tool for tool in tools}

    def to_params(
        self,
    ) -> list[BetaToolUnionParam]:
        return [tool.to_params() for tool in self.tools]

    async def run(self, *, name: str, tool_input: dict[str, Any]) -> ToolResult:
        tool = self.tool_map.get(name)
        if not tool:
            return ToolFailure(error=f"Tool {name} is invalid")
        try:
            return await tool(**tool_input)
        except ToolError as e:
            return ToolFailure(error=e.message)


class BrowserTool(BaseAnthropicTool):
    """Tool for controlling a Playwright browser instance with persistent state."""

    _instance = None

    def __new__(cls, *args, **kwargs):
        """Ensure a single instance of the class is used."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, cdp_url: str):
        """Initialize browser state."""
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.cdp_url = cdp_url

    async def start(self):
        """Ensures connection to an existing browser or starts a new one."""
        if self.browser:
            return

        if not self.playwright:
            self.playwright = await async_playwright().start()

        try:
            self.browser = await self.playwright.chromium.connect_over_cdp(self.cdp_url)
            self.context = (
                self.browser.contexts[0]
                if self.browser.contexts
                else await self.browser.new_context()
            )
            self.page = (
                self.context.pages[0]
                if self.context.pages
                else await self.context.new_page()
            )
        except Exception as e:
            raise ToolError(f"Failed to connect to Chrome: {e}")

    async def ensure_page(self):
        """Ensures an active page exists before executing commands."""
        await self.start()
        if not self.page:
            self.page = await self.context.new_page()

    async def goto(self, url: str) -> ToolResult:
        """Navigates to a URL using the already open browser."""
        await self.ensure_page()  # Make sure page is properly set before proceeding

        try:
            await self.page.goto(url)
            await self.page.wait_for_load_state(
                "networkidle"
            )  # Ensure page is fully loaded
            self.page = self.browser.contexts[0].pages[
                0
            ]  # Ensure we have a valid page reference
            html_content = await self.page.evaluate(
                "document.documentElement.outerHTML"
            )
            return ToolResult(output=f"Navigated to {url}", system=html_content[:10000])
        except Exception as e:
            return ToolResult(error=f"Failed to navigate: {str(e)}")

    async def click(self, selector: str) -> ToolResult:
        """Clicks an element ensuring visibility and focus."""
        await self.ensure_page()

        try:
            element = self.page.locator(selector)
            if not await element.count():
                return ToolResult(error=f"No elements found for selector: {selector}")

            await element.wait_for(state="visible", timeout=5000)
            await element.scroll_into_view_if_needed()
            await element.click(timeout=3000)
            return ToolResult(output=f"Clicked on '{selector}'")
        except Exception as e:
            return ToolResult(error=f"Failed to click '{selector}': {str(e)}")

    async def type_text(self, selector: str, text: str) -> ToolResult:
        """Fills an input field."""
        await self.ensure_page()

        try:
            await self.page.type(selector, text)
            return ToolResult(output=f"Filled '{selector}' with '{text}'")
        except Exception as e:
            return ToolResult(error=f"Failed to fill '{selector}': {str(e)}")

    async def get_page_structure(self) -> ToolResult:
        """Extracts the full HTML content of the page."""
        await self.ensure_page()

        try:
            await self.page.wait_for_load_state("networkidle", timeout=10000)
            html_content = await self.page.evaluate(
                "document.documentElement.outerHTML"
            )
            return ToolResult(
                output="Full page structure retrieved", system=html_content[:10000]
            )
        except Exception as e:
            return ToolResult(error=f"Failed to retrieve page structure: {str(e)}")

    async def screenshot(
        self, save_path: str = "screenshots/screenshot.png"
    ) -> ToolResult:
        """Takes a screenshot."""
        await self.ensure_page()

        try:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            await self.page.screenshot(path=save_path)
            base64_image = None
            with open(save_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode()
            return ToolResult(
                output=f"Screenshot saved at: {save_path}", base64_image=base64_image
            )
        except Exception as e:
            return ToolResult(error=f"Failed to take screenshot: {str(e)}")

    async def submit_using_enter_key(self) -> ToolResult:
        """Submits a search using the Enter key after filling the input field."""
        await self.ensure_page()

        try:
            search_box = self.page.locator("textarea[name='q']")

            # Ensure the search box is focused before pressing enter
            await search_box.click()
            await self.page.keyboard.press("Enter")

            # Wait for the search results to load
            await self.page.wait_for_load_state("domcontentloaded")

            return ToolResult(output="Pressed Enter to submit search.")

        except Exception as e:
            return ToolResult(error=f"Failed to submit search: {str(e)}")

    async def close(self):
        """Closes the browser session."""
        if self.browser:
            await self.browser.close()
            await self.playwright.stop()
            self.browser = None
            self.context = None
            self.page = None
            return ToolResult(output="Browser session closed.")
        return ToolResult(error="No active browser session to close.")

    async def __call__(
        self,
        *,
        command: Literal[
            "start",
            "goto",
            "click",
            "get_latest_screenshot",
            "type_text",
            "screenshot",
            "get_page_structure",
            "close",
            "submit_using_enter_key",
        ],
        selector: Optional[str] = None,
        text: Optional[str] = None,
        url: Optional[str] = None,
    ) -> ToolResult:
        """Executes a browser command."""
        try:
            if command == "start":
                await self.start()
                return ToolResult(output="Browser started successfully.")
            elif command == "goto" and url:
                return await self.goto(url)
            elif command == "click" and selector:
                return await self.click(selector)
            elif command == "type_text" and selector and text:
                return await self.type_text(selector, text)
            elif command == "screenshot":
                return await self.screenshot()
            elif command == "get_page_structure":
                return await self.get_page_structure()
            elif command == "close":
                return await self.close()
            elif command == "submit_using_enter_key":
                return await self.submit_using_enter_key()
            else:
                return ToolResult(error="Invalid command or missing parameters.")
        except Exception as e:
            return ToolResult(error=f"Error executing command '{command}': {str(e)}")

    def to_params(self):
        """Defines the schema for input parameters."""
        return {
            "name": "browser_tool",
            "description": "A tool to control a browser using Playwright.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "enum": [
                            "start",
                            "goto",
                            "submit_using_enter_key",
                            "click",
                            "type_text",
                            "screenshot",
                            "get_page_structure",
                            "close",
                        ],
                    },
                    "selector": {"type": "string"},
                    "text": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["command"],
            },
        }
