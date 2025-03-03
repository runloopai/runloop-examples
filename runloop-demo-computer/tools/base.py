from abc import ABC, abstractmethod
from dataclasses import dataclass, fields, replace
from typing import Any
from anthropic.types.beta import BetaToolUnionParam


class BaseTool(ABC):
    """Abstract base class for Anthropic-defined tools."""

    @abstractmethod
    def __call__(self, **kwargs) -> Any:
        pass

    @abstractmethod
    def to_params(self) -> BetaToolUnionParam:
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
        def combine(field1, field2, concat=True):
            if field1 and field2:
                return (
                    field1 + field2
                    if concat
                    else ValueError("Cannot combine tool results")
                )
            return field1 or field2

        return ToolResult(
            output=combine(self.output, other.output),
            error=combine(self.error, other.error),
            base64_image=combine(self.base64_image, other.base64_image, False),
            system=combine(self.system, other.system),
        )

    def replace(self, **kwargs):
        return replace(self, **kwargs)


class ToolError(Exception):
    """Raised when a tool encounters an error."""

    def __init__(self, message):
        super().__init__(message)
        self.message = message


class ToolCollection:
    """A collection of Anthropic-defined tools."""

    def __init__(self, *tools: BaseTool):
        self.tool_map = {tool.to_params()["name"]: tool for tool in tools}

    def to_params(self) -> list[BetaToolUnionParam]:
        return [tool.to_params() for tool in self.tool_map.values()]

    async def run(self, *, name: str, tool_input: dict[str, Any]) -> ToolResult:
        tool = self.tool_map.get(name)
        if not tool:
            return ToolResult(error=f"Tool {name} is invalid")
        try:
            return await tool(**tool_input)
        except ToolError as e:
            return ToolResult(error=e.message)
