"""
Entrypoint for streamlit, see https://docs.streamlit.io/
"""

import asyncio
import base64
import logging
import os
import traceback
from contextlib import contextmanager
from datetime import datetime, timedelta
from enum import StrEnum
from functools import partial
from typing import cast
import httpx
import streamlit as st
from anthropic import RateLimitError
from anthropic.types.beta import (
    BetaContentBlockParam,
    BetaTextBlockParam,
    BetaToolResultBlockParam,
)
from streamlit.delta_generator import DeltaGenerator

from loop import (
    sampling_loop,
)
from tools import ToolResult

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-3-5-sonnet-20241022"

WARNING_TEXT = "⚠️ Security Alert: Never provide access to sensitive accounts or data, as malicious web content can hijack Claude's behavior"
INTERRUPT_TEXT = "(user stopped or interrupted and wrote the following)"
INTERRUPT_TOOL_ERROR = "human stopped or interrupted tool execution"


class Sender(StrEnum):
    USER = "user"
    BOT = "assistant"
    TOOL = "tool"


def setup_state(api_key: str):
    if "api_key" not in st.session_state:
        st.session_state.api_key = api_key
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "responses" not in st.session_state:
        st.session_state.responses = {}
    if "tools" not in st.session_state:
        st.session_state.tools = {}
    if "only_n_most_recent_images" not in st.session_state:
        st.session_state.only_n_most_recent_images = 3
    if "custom_system_prompt" not in st.session_state:
        st.session_state.custom_system_prompt = ""
    if "hide_images" not in st.session_state:
        st.session_state.hide_images = False
    if "in_sampling_loop" not in st.session_state:
        st.session_state.in_sampling_loop = False


def setup_page(vnc_url):
    """Lay out our demo application."""

    st.set_page_config(layout="wide")
    col1, col2 = st.columns([0.35, 0.65])

    with open("styles.css", "r") as f:
        css = f.read()
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)

    with st.sidebar:
        st.text_input(
            "Anthropic API Key",
            type="password",
            key="api_key",
        )
        st.number_input(
            "Only send N most recent images",
            min_value=0,
            key="only_n_most_recent_images",
            help="To decrease the total tokens sent, remove older screenshots from the conversation",
        )
        st.text_area(
            "Custom System Prompt Suffix",
            key="custom_system_prompt",
            help="Additional instructions to append to the system prompt. See loop.py for the base system prompt.",
        )
        st.checkbox("Hide screenshots", key="hide_images")

    with col1:
        st.markdown('<div class="left-column">', unsafe_allow_html=True)
        st.title("Claude Computer Use Demo")
        st.warning(WARNING_TEXT)

        # **Initialize new_message before the condition**
        new_message = st.chat_input(
            "Type a message to send to Claude to control the computer..."
        )

        if not st.session_state.api_key:
            st.warning("Please set an API key in the sidebar")

        chat, http_logs = st.tabs(["Chat", "HTTP Exchange Logs"])

        with chat:
            # render past chats
            for message in st.session_state.messages:
                if isinstance(message["content"], str):
                    _render_message(message["role"], message["content"])
                elif isinstance(message["content"], list):
                    for block in message["content"]:
                        # the tool result we send back to the Anthropic API isn't sufficient to render all details,
                        # so we store the tool use responses
                        if isinstance(block, dict) and block["type"] == "tool_result":
                            _render_message(
                                Sender.TOOL,
                                st.session_state.tools[block["tool_use_id"]],
                            )
                        else:
                            _render_message(
                                message["role"],
                                cast(BetaContentBlockParam | ToolResult, block),
                            )

        # Render past HTTP exchanges
        for identity, (request, response) in st.session_state.responses.items():
            _render_api_response(request, response, identity, http_logs)

        # Handle new message
        if new_message:
            st.session_state.messages.append(
                {
                    "role": Sender.USER,
                    "content": [
                        *maybe_add_interruption_blocks(),
                        BetaTextBlockParam(type="text", text=new_message),
                    ],
                }
            )
            _render_message(Sender.USER, new_message)
        st.markdown("</div>", unsafe_allow_html=True)
    with col2:
        st.markdown('<div class="right-column">', unsafe_allow_html=True)
        st.components.v1.iframe(
            f"{vnc_url}?view_only=1", width=950, height=800, scrolling=False
        )
        st.markdown("</div>", unsafe_allow_html=True)
    return http_logs


async def main(api_key: str, devbox_id: str, cdp_url: str, vnc_url: str):
    """Render loop for streamlit"""
    setup_state(api_key)
    http_logs = setup_page(vnc_url)

    with track_sampling_loop():
        st.session_state.messages = await sampling_loop(
            system_prompt_suffix=st.session_state.custom_system_prompt,
            model=DEFAULT_MODEL,
            messages=st.session_state.messages,
            output_callback=partial(_render_message, Sender.BOT),
            tool_output_callback=partial(
                _tool_output_callback, tool_state=st.session_state.tools
            ),
            api_response_callback=partial(
                _api_response_callback,
                tab=http_logs,
                response_state=st.session_state.responses,
            ),
            api_key=st.session_state.api_key,
            cdp_url=cdp_url,
            only_n_most_recent_images=st.session_state.only_n_most_recent_images,
        )


# function provides context to the model about interruptions by the user or tool errors
def maybe_add_interruption_blocks():
    if not st.session_state.in_sampling_loop:
        return []
    # If this function is called while we're in the sampling loop, we can assume that the previous sampling loop was interrupted
    # and we should annotate the conversation with additional context for the model and heal any incomplete tool use calls
    result = []
    if st.session_state.messages:
        last_message = st.session_state.messages[-1]
        previous_tool_use_ids = [
            block["id"]
            for block in last_message["content"]
            if block["type"] == "tool_use"
        ]
        for tool_use_id in previous_tool_use_ids:
            st.session_state.tools[tool_use_id] = ToolResult(error=INTERRUPT_TOOL_ERROR)
            result.append(
                BetaToolResultBlockParam(
                    tool_use_id=tool_use_id,
                    type="tool_result",
                    content=INTERRUPT_TOOL_ERROR,
                    is_error=True,
                )
            )
    result.append(BetaTextBlockParam(type="text", text=INTERRUPT_TEXT))
    return result


@contextmanager
def track_sampling_loop():
    st.session_state.in_sampling_loop = True
    yield
    st.session_state.in_sampling_loop = False


def _api_response_callback(
    request: httpx.Request,
    response: httpx.Response | object | None,
    error: Exception | None,
    tab: DeltaGenerator,
    response_state: dict[str, tuple[httpx.Request, httpx.Response | object | None]],
):
    """
    Handle an API response by storing it to state and rendering it.
    """
    response_id = datetime.now().isoformat()
    response_state[response_id] = (request, response)
    logger.warning(f"API response error: {response_id}", exc_info=error)
    if error:
        _render_error(error)
    _render_api_response(request, response, response_id, tab)


def _tool_output_callback(
    tool_output: ToolResult, tool_id: str, tool_state: dict[str, ToolResult]
):
    """Handle a tool output by storing it to state and rendering it."""
    tool_state[tool_id] = tool_output
    _render_message(Sender.TOOL, tool_output)


def _render_api_response(
    request: httpx.Request,
    response: httpx.Response | object | None,
    response_id: str,
    tab: DeltaGenerator,
):
    """Render an API response to a streamlit tab"""
    with tab:
        with st.expander(f"Request/Response ({response_id})"):
            newline = "\n\n"
            st.markdown(
                f"`{request.method} {request.url}`{newline}{newline.join(f'`{k}: {v}`' for k, v in request.headers.items())}"
            )
            st.json(request.read().decode())
            st.markdown("---")
            if isinstance(response, httpx.Response):
                st.markdown(
                    f"`{response.status_code}`{newline}{newline.join(f'`{k}: {v}`' for k, v in response.headers.items())}"
                )
                st.json(response.text)
            else:
                st.write(response)


def _render_error(error: Exception):
    if isinstance(error, RateLimitError):
        body = "You have been rate limited."
        if retry_after := error.response.headers.get("retry-after"):
            body += f" **Retry after {str(timedelta(seconds=int(retry_after)))} (HH:MM:SS).** See our API [documentation](https://docs.anthropic.com/en/api/rate-limits) for more details."
        body += f"\n\n{error.message}"
    else:
        body = str(error)
        body += "\n\n**Traceback:**"
        lines = "\n".join(traceback.format_exception(error))
        body += f"\n\n```{lines}```"
    st.session_state.messages.append(
        {"role": Sender.BOT, "content": f"⚠️ Error: {body}"}
    )


def _render_message(
    sender: Sender,
    message: str | BetaContentBlockParam | ToolResult,
):
    """Convert input from the user or output from the agent to a streamlit message."""
    # streamlit's hotreloading breaks isinstance checks, so we need to check for class names
    is_tool_result = not isinstance(message, str | dict)
    if not message or (
        is_tool_result
        and st.session_state.hide_images
        and not hasattr(message, "error")
        and not hasattr(message, "output")
    ):
        return
    with st.chat_message(sender):
        if is_tool_result:
            message = cast(ToolResult, message)
            if message.output:
                if message.__class__.__name__ == "CLIResult":
                    st.code(message.output)
                else:
                    st.markdown(message.output)
            if message.error:
                st.error(message.error)
            if message.base64_image and not st.session_state.hide_images:
                st.image(base64.b64decode(message.base64_image))
        elif isinstance(message, dict):
            if message["type"] == "text":
                st.write(message["text"])
            elif message["type"] == "tool_use":
                st.code(f"Tool Use: {message['name']}\nInput: {message['input']}")
            else:
                # only expected return types are text and tool_use
                raise Exception(f"Unexpected response type {message['type']}")
        else:
            st.markdown(message)


if __name__ == "__main__":
    api_key = os.getenv("ANTHROPIC_API_KEY")
    devbox_id = os.getenv("DEVBOX_ID")
    cdp_url = os.getenv("CDP_URL")
    vnc_url = os.getenv("VNC_URL")
    asyncio.run(main(api_key, devbox_id, cdp_url, vnc_url))
