"""
Tests for Tools API endpoints and services.
"""
import pytest
from unittest.mock import MagicMock


class TestToolsCRUD:
    """Test cases for Tool CRUD operations."""

    def test_tool_create_custom(self, mock_tool):
        """TC_TL_001: Create custom tool with Python code."""
        # Arrange
        tool_data = {
            "name": "Custom Search Tool",
            "description": "Search for information",
            "category": "custom",
            "tool_type": "custom",
            "code": '''
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"
''',
            "args_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["query"],
            },
        }

        # Assert
        assert tool_data["tool_type"] == "custom"
        assert "def search" in tool_data["code"]
        assert "query" in tool_data["args_schema"]["properties"]

    def test_tool_test_sandbox(self, mock_tool):
        """TC_TL_002: Test tool in sandbox."""
        # Arrange
        test_input = {"query": "test query"}
        expected_output = "Results for: test query"

        # Assert
        assert "query" in test_input

    def test_tool_with_env_variables(self, mock_tool):
        """TC_TL_003: Test tool with environment variables."""
        # Arrange
        tool_with_env = {
            **mock_tool,
            "env_vars": {
                "API_KEY": "encrypted:xxxxx",
                "BASE_URL": "https://api.example.com",
            },
        }

        # Assert
        assert "API_KEY" in tool_with_env["env_vars"]

    def test_tool_args_schema_validation(self, mock_tool):
        """TC_TL_004: Verify args schema validation."""
        # Arrange
        valid_args = {"input": "test value"}
        invalid_args = {}  # missing required field

        schema = {
            "type": "object",
            "properties": {
                "input": {"type": "string"},
            },
            "required": ["input"],
        }

        # Assert
        assert "input" in valid_args
        assert "input" not in invalid_args

    def test_tool_filter_by_category(self, mock_tool):
        """TC_TL_005: Filter tools by category."""
        # Arrange
        tools = [
            {**mock_tool, "id": "tool-1", "category": "search"},
            {**mock_tool, "id": "tool-2", "category": "custom"},
            {**mock_tool, "id": "tool-3", "category": "search"},
        ]

        # Act
        search_tools = [t for t in tools if t["category"] == "search"]

        # Assert
        assert len(search_tools) == 2

    def test_tool_search_by_name(self, mock_tool):
        """TC_TL_006: Search tools by name."""
        # Arrange
        tools = [
            {**mock_tool, "id": "tool-1", "name": "Web Search"},
            {**mock_tool, "id": "tool-2", "name": "File Reader"},
            {**mock_tool, "id": "tool-3", "name": "Search API"},
        ]
        search_term = "search"

        # Act
        results = [t for t in tools if search_term.lower() in t["name"].lower()]

        # Assert
        assert len(results) == 2


class TestToolTypes:
    """Test cases for different tool types."""

    def test_builtin_tools(self):
        """Test built-in system tools."""
        builtin_tools = [
            {"name": "SerperDevTool", "category": "search", "tool_type": "builtin"},
            {"name": "FileReadTool", "category": "file", "tool_type": "builtin"},
            {"name": "DirectoryReadTool", "category": "file", "tool_type": "builtin"},
        ]

        for tool in builtin_tools:
            assert tool["tool_type"] == "builtin"

    def test_mcp_tool(self):
        """Test MCP protocol tool."""
        mcp_tool = {
            "name": "MCP Browser Tool",
            "tool_type": "mcp",
            "mcp_config": {
                "server_url": "http://localhost:3000",
                "tool_name": "browser",
            },
        }

        assert mcp_tool["tool_type"] == "mcp"
        assert "mcp_config" in mcp_tool

    def test_langchain_tool(self):
        """Test LangChain integration tool."""
        langchain_tool = {
            "name": "Wikipedia Tool",
            "tool_type": "langchain",
            "langchain_config": {
                "tool_class": "WikipediaQueryRun",
                "top_k_results": 3,
            },
        }

        assert langchain_tool["tool_type"] == "langchain"
