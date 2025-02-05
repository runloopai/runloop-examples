from .base import BaseAnthropicTool, ToolResult, ToolError
from playwright.async_api import async_playwright
import os, asyncio, time, base64
import dotenv
from typing import Literal, Optional
dotenv.load_dotenv()
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


CDP_URL = os.getenv("CDP_URL")
TOKEN_LIMIT_PER_MINUTE = 80000
TOKENS_USED = 0
RESET_TIME = time.time() + 60


async def rate_limit_tokens(estimated_tokens: int):
    """Ensures token usage stays below the limit per minute."""
    global TOKENS_USED, RESET_TIME

    current_time = time.time()
    if current_time >= RESET_TIME:
        TOKENS_USED = 0
        RESET_TIME = current_time + 60

    if TOKENS_USED + estimated_tokens > TOKEN_LIMIT_PER_MINUTE:
        wait_time = RESET_TIME - current_time
        await asyncio.sleep(wait_time)
        TOKENS_USED = 0  

    TOKENS_USED += estimated_tokens

class BrowserTool(BaseAnthropicTool):
    """Tool for controlling a Playwright browser instance with persistent state."""

    _instance = None  

    def __new__(cls, *args, **kwargs):
        """Ensure a single instance of the class is used."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize browser state."""
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def start(self):
        """Ensures connection to an existing browser or starts a new one."""
        if self.browser:
            return  

        if not self.playwright:
            self.playwright = await async_playwright().start()

        try:
            self.browser = await self.playwright.chromium.connect_over_cdp(CDP_URL)
            self.context = self.browser.contexts[0] if self.browser.contexts else await self.browser.new_context()
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
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
        await rate_limit_tokens(4000)

        try:
            await self.page.goto(url)
            await self.page.wait_for_load_state("networkidle")  # Ensure page is fully loaded
            self.page = self.browser.contexts[0].pages[0]  # Ensure we have a valid page reference
            html_content = await self.page.evaluate("document.documentElement.outerHTML")
            return ToolResult(output=f"Navigated to {url}", system=html_content[:10000])
        except Exception as e:
            return ToolResult(error=f"Failed to navigate: {str(e)}")

    async def click(self, selector: str) -> ToolResult:
        """Clicks an element ensuring visibility and focus."""
        await self.ensure_page()
        await rate_limit_tokens(1000)

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

    async def fill(self, selector: str, text: str) -> ToolResult:
        """Fills an input field."""
        await self.ensure_page()
        await rate_limit_tokens(2000)

        try:
            await self.page.fill(selector, text)
            return ToolResult(output=f"Filled '{selector}' with '{text}'")
        except Exception as e:
            return ToolResult(error=f"Failed to fill '{selector}': {str(e)}")

    async def get_page_structure(self) -> ToolResult:
        """Extracts the full HTML content of the page."""
        await self.ensure_page()
        await rate_limit_tokens(5000)

        try:
            await self.page.wait_for_load_state("networkidle", timeout=10000)
            html_content = await self.page.evaluate("document.documentElement.outerHTML")
            return ToolResult(output="Full page structure retrieved", system=html_content[:10000])
        except Exception as e:
            return ToolResult(error=f"Failed to retrieve page structure: {str(e)}")

    async def screenshot(self, save_path: str = "screenshots/screenshot.png") -> ToolResult:
        """Takes a screenshot."""
        await self.ensure_page()  
        await rate_limit_tokens(3000)

        try:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            await self.page.screenshot(path=save_path)
            base64_image = None
            with open(save_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode()
            return ToolResult(output=f"Screenshot saved at: {save_path}", base64_image=base64_image)
        except Exception as e:
            return ToolResult(error=f"Failed to take screenshot: {str(e)}")

    async def submit_search(self) -> ToolResult:
        """Determines how to submit a search."""
        await self.ensure_page()
        await rate_limit_tokens(1000)

        try:
            search_button = self.page.locator('input[type="submit"], button[type="submit"]')

            if await search_button.count() > 0:
                await search_button.first.click()
                return ToolResult(output="Clicked the search button.")
            
            await self.page.keyboard.press("Enter")
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
        command: Literal["start", "goto", "click", "get_latest_screenshot", "fill", "screenshot", "get_page_structure", "close", "submit_search"],
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
            elif command == "fill" and selector and text:
                return await self.fill(selector, text)
            elif command == "screenshot":
                return await self.screenshot()
            elif command == "get_page_structure":
                return await self.get_page_structure()
            elif command == "close":
                return await self.close()
            elif command == "submit_search":
                return await self.submit_search()
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
                    "command": {"type": "string", "enum": ["start", "goto", "submit_search", "click", "fill", "screenshot", "get_page_structure", "close"]},
                    "selector": {"type": "string"},
                    "text": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["command"],
            },
        }
