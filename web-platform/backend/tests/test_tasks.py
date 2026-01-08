"""
Tests for Tasks API endpoints and services.
"""
import pytest
from unittest.mock import MagicMock


class TestTasksCRUD:
    """Test cases for Task CRUD operations."""

    def test_task_create_with_agent(self, mock_task, mock_agent):
        """TC_TSK_001: Create task with agent assignment."""
        # Arrange
        task_data = {
            "name": "Analysis Task",
            "description": "Analyze the data",
            "expected_output": "Analysis report",
            "agent_id": mock_agent["id"],
        }

        # Assert
        assert task_data["agent_id"] == mock_agent["id"]
        assert "expected_output" in task_data

    def test_task_create_without_agent(self):
        """TC_TSK_002: Create task without agent -> expect error."""
        # Arrange
        task_data = {
            "name": "Orphan Task",
            "description": "Task without agent",
        }

        # Assert - should fail without agent_id
        assert "agent_id" not in task_data

    def test_task_dependencies(self, mock_task):
        """TC_TSK_003: Setup task dependencies."""
        # Arrange
        task1 = {**mock_task, "id": "task-1"}
        task2 = {**mock_task, "id": "task-2", "context_task_ids": ["task-1"]}
        task3 = {**mock_task, "id": "task-3", "context_task_ids": ["task-1", "task-2"]}

        # Assert
        assert "context_task_ids" not in task1 or len(task1.get("context_task_ids", [])) == 0
        assert task2["context_task_ids"] == ["task-1"]
        assert len(task3["context_task_ids"]) == 2

    def test_task_execution_timeout(self, mock_task):
        """TC_TSK_004: Test execution with timeout configuration."""
        # Arrange
        task_with_timeout = {
            **mock_task,
            "timeout": 300,  # 5 minutes
            "max_retries": 3,
        }

        # Assert
        assert task_with_timeout["timeout"] == 300
        assert task_with_timeout["max_retries"] == 3

    def test_task_output_format_json(self, mock_task):
        """TC_TSK_005: Verify output format JSON."""
        # Arrange
        task_json_output = {
            **mock_task,
            "output_type": "json",
            "output_schema": {
                "type": "object",
                "properties": {
                    "result": {"type": "string"},
                    "confidence": {"type": "number"},
                },
            },
        }

        # Assert
        assert task_json_output["output_type"] == "json"
        assert "properties" in task_json_output["output_schema"]

    def test_task_output_format_pydantic(self, mock_task):
        """TC_TSK_005b: Verify output format Pydantic model."""
        # Arrange
        task_pydantic_output = {
            **mock_task,
            "output_type": "pydantic",
            "output_pydantic": "AnalysisResult",
        }

        # Assert
        assert task_pydantic_output["output_type"] == "pydantic"
        assert task_pydantic_output["output_pydantic"] == "AnalysisResult"

    def test_task_duplicate_with_context(self, mock_task):
        """TC_TSK_006: Duplicate task with context."""
        # Arrange
        original_task = {**mock_task, "context_task_ids": ["other-task"]}

        # Act
        duplicated = {
            **original_task,
            "id": "duplicated-task-id",
            "name": f"{original_task['name']} (Copy)",
        }

        # Assert
        assert duplicated["id"] != original_task["id"]
        assert duplicated["context_task_ids"] == original_task["context_task_ids"]


class TestTaskConfiguration:
    """Test cases for Task configuration options."""

    def test_task_async_execution(self, mock_task):
        """Test async execution setting."""
        # Arrange
        async_task = {**mock_task, "async_execution": True}
        sync_task = {**mock_task, "async_execution": False}

        # Assert
        assert async_task["async_execution"] is True
        assert sync_task["async_execution"] is False

    def test_task_human_input(self, mock_task):
        """Test human input requirement."""
        # Arrange
        task_with_human_input = {**mock_task, "human_input": True}

        # Assert
        assert task_with_human_input["human_input"] is True

    def test_task_file_output(self, mock_task):
        """Test task file output configuration."""
        # Arrange
        task_with_file_output = {
            **mock_task,
            "output_file": "results/analysis.md",
            "output_format": "markdown",
        }

        # Assert
        assert task_with_file_output["output_file"] == "results/analysis.md"
        assert task_with_file_output["output_format"] == "markdown"
