import os
from enum import StrEnum
from typing import Literal, TypedDict, List, Union, Dict
import dotenv

from anthropic.types.beta import BetaToolComputerUse20241022Param

from .base import BaseAnthropicTool, ToolError, ToolResult
from runloop_api_client import Runloop
import logging

dotenv.load_dotenv()
logger = logging.getLogger(__name__)

runloop = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)

OUTPUT_DIR = "/tmp/computer_outputs"
TYPING_DELAY_MS = 12
TYPING_GROUP_SIZE = 50

Action = Literal[
    "key",
    "type",
    "mouse_move",
    "left_click",
    "left_click_drag",
    "right_click",
    "middle_click",
    "double_click",
    "screenshot",
    "cursor_position",
]


class Resolution(TypedDict):
    width: int
    height: int


# sizes above XGA/WXGA are not recommended (see README.md)
# scale down to one of these targets if ComputerTool._scaling_enabled is set
MAX_SCALING_TARGETS: dict[str, Resolution] = {
    "XGA": Resolution(width=1024, height=768),  # 4:3
    "WXGA": Resolution(width=1280, height=800),  # 16:10
    "FWXGA": Resolution(width=1366, height=768),  # ~16:9
}


class ScalingSource(StrEnum):
    COMPUTER = "computer"
    API = "api"


class ComputerToolOptions(TypedDict):
    display_height_px: int
    display_width_px: int
    display_number: int | None


def chunks(s: str, chunk_size: int) -> list[str]:
    return [s[i : i + chunk_size] for i in range(0, len(s), chunk_size)]


class ComputerTool(BaseAnthropicTool):
    """
    A tool that allows the agent to interact with the screen, keyboard, and mouse of the current computer.
    The tool parameters are defined by Anthropic and are not editable.
    """

    name: Literal["computer"] = "computer"
    api_type: Literal["computer_20241022"] = "computer_20241022"
    width: int
    height: int
    display_num: int | None

    _screenshot_delay = 2.0
    _scaling_enabled = True

    @property
    def options(self) -> ComputerToolOptions:
        width, height = self.scale_coordinates(
            ScalingSource.COMPUTER, self.width, self.height
        )
        return {
            "display_width_px": width,
            "display_height_px": height,
            "display_number": self.display_num,
        }

    def to_params(self) -> BetaToolComputerUse20241022Param:
        return {"name": self.name, "type": self.api_type, **self.options}

    def __init__(self, devbox_id):
        super().__init__()
        # WE NEED TO GET THE WIDTH AND HEIGHT OF THE SCREEN TO ALIGN WITH THE VALUE IN THE DEVBOX
        self.width = int(os.getenv("WIDTH") or 0)
        self.height = int(os.getenv("HEIGHT") or 0)
        assert self.width and self.height, "WIDTH, HEIGHT must be set"
        if (display_num := os.getenv("DISPLAY_NUM")) is not None:
            self.display_num = int(display_num)
            self._display_prefix = f"DISPLAY=:{self.display_num} "
        else:
            self.display_num = None
            self._display_prefix = ""

        self.xdotool = f"{self._display_prefix}xdotool"
        self.devbox_id = devbox_id

    def convert_coordinate(coord: List[Union[float, str]]) -> Dict[str, int]:
        x, y = coord
        return {"x": int(float(x)), "y": int(float(y))}

    async def __call__(
        self,
        *,
        action: Action,
        text: str | None = None,
        coordinate: tuple[int, int] | None = None,
        **kwargs,
    ):
        if coordinate:
            x, y = coordinate
            coordinate = {"x": x, "y": y}

        if action in [
            "mouse_move",
            "left_click",
            "left_click_drag",
            "right_click",
            "middle_click",
            "double_click",
        ]:
            response = runloop.devboxes.computers.mouse_interaction(
                self.devbox_id, action=action, coordinate=coordinate
            )
            return ToolResult(
                output=response.output,
                error=response.error,
                base64_image=response.latest_screenshot_base64_img,
            )
        if action in ["key", "type"]:
            response = runloop.devboxes.computers.keyboard_interaction(
                self.devbox_id, action=action, text=text
            )
            return ToolResult(
                output=response.output,
                error=response.error,
                base64_image=response.latest_screenshot_base64_img,
            )
        if action in ["screenshot", "cursor_position"]:
            response = runloop.devboxes.computers.screen_interaction(
                self.devbox_id, action=action
            )
            return ToolResult(
                output=response.output,
                error=response.error,
                base64_image=response.latest_screenshot_base64_img,
            )

        # If none of the conditions matched, raise an error
        raise ToolError(f"Invalid action: {action}")

    def scale_coordinates(self, source: ScalingSource, x: int, y: int):
        """Scale coordinates to a target maximum resolution."""
        if not self._scaling_enabled:
            return x, y
        ratio = self.width / self.height
        target_dimension = None
        for dimension in MAX_SCALING_TARGETS.values():
            # allow some error in the aspect ratio - not ratios are exactly 16:9
            if abs(dimension["width"] / dimension["height"] - ratio) < 0.02:
                if dimension["width"] < self.width:
                    target_dimension = dimension
                break
        if target_dimension is None:
            return x, y
        # should be less than 1
        x_scaling_factor = target_dimension["width"] / self.width
        y_scaling_factor = target_dimension["height"] / self.height
        if source == ScalingSource.API:
            if x > self.width or y > self.height:
                raise ToolError(f"Coordinates {x}, {y} are out of bounds")
            # scale up
            return round(x / x_scaling_factor), round(y / y_scaling_factor)
        # scale down
        return round(x * x_scaling_factor), round(y * y_scaling_factor)
