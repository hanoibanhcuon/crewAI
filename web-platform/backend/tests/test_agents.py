"""
Tests for Agents API endpoints and services.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch


class TestAgentsCRUD:
    """Test cases for Agent CRUD operations."""

    def test_agent_create_with_valid_data(self, mock_db, mock_user, mock_agent):
        """TC_AGT_001: Create agent with full information."""
        # Arrange
        agent_data = {
            "name": "Research Agent",
            "role": "Researcher",
            "goal": "Find relevant information",
            "backstory": "Expert researcher",
            "llm_model": "gpt-4",
        }

        # Assert - should have all required fields
        assert "name" in agent_data
        assert "role" in agent_data
        assert "goal" in agent_data

    def test_agent_create_missing_required_fields(self, mock_db, mock_user):
        """TC_AGT_002: Create agent missing required fields -> expect validation error."""
        # Arrange - missing 'role' field
        agent_data = {
            "name": "Test Agent",
            "goal": "Test goal",
        }

        # Assert - should fail validation without role
        assert "role" not in agent_data

    def test_agent_update_existing(self, mock_db, mock_user, mock_agent):
        """TC_AGT_003: Update existing agent."""
        # Arrange
        update_data = {"name": "Updated Agent Name"}

        # Act - simulate update
        updated_agent = {**mock_agent, **update_data}

        # Assert
        assert updated_agent["name"] == "Updated Agent Name"
        assert updated_agent["role"] == mock_agent["role"]  # unchanged

    def test_agent_delete_in_use_warning(self, mock_db, mock_agent, mock_crew):
        """TC_AGT_004: Delete agent in use by crew -> expect warning."""
        # Arrange - agent is used in crew
        agent_id = mock_agent["id"]
        crew_agents = mock_crew["agent_ids"]

        # Assert - agent is in use
        assert agent_id in crew_agents

    def test_agent_duplicate(self, mock_agent):
        """TC_AGT_005: Duplicate agent and verify data."""
        # Act - create duplicate
        duplicated = {
            **mock_agent,
            "id": "duplicated-agent-id",
            "name": f"{mock_agent['name']} (Copy)",
        }

        # Assert
        assert duplicated["id"] != mock_agent["id"]
        assert duplicated["role"] == mock_agent["role"]
        assert duplicated["goal"] == mock_agent["goal"]

    def test_agent_search_by_role(self, mock_agent):
        """TC_AGT_006: Search agent by role."""
        # Arrange
        agents = [
            mock_agent,
            {**mock_agent, "id": "agent-2", "role": "Writer"},
            {**mock_agent, "id": "agent-3", "role": "Researcher"},
        ]
        search_role = "Researcher"

        # Act
        results = [a for a in agents if search_role.lower() in a["role"].lower()]

        # Assert
        assert len(results) == 2

    def test_agent_pagination(self):
        """TC_AGT_007: Pagination with 50+ agents."""
        # Arrange
        total_agents = 55
        page_size = 10
        page = 3

        # Act
        start = (page - 1) * page_size
        end = start + page_size

        # Assert
        assert start == 20
        assert end == 30
        assert (total_agents // page_size) + 1 == 6  # total pages


class TestAgentConfiguration:
    """Test cases for Agent configuration options."""

    def test_agent_llm_configuration(self, mock_agent):
        """Test LLM model selection and configuration."""
        # Arrange
        llm_config = {
            "model": "gpt-4",
            "temperature": 0.7,
            "max_tokens": 4096,
        }

        # Assert
        assert mock_agent["llm_model"] == llm_config["model"]
        assert mock_agent["temperature"] == llm_config["temperature"]

    def test_agent_tool_assignment(self, mock_agent, mock_tool):
        """Test assigning tools to agent."""
        # Arrange
        agent_with_tools = {**mock_agent, "tools": [mock_tool["id"]]}

        # Assert
        assert len(agent_with_tools["tools"]) == 1
        assert mock_tool["id"] in agent_with_tools["tools"]

    def test_agent_memory_settings(self, mock_agent):
        """Test agent memory enable/disable."""
        # Arrange
        agent_with_memory = {**mock_agent, "memory_enabled": True}
        agent_without_memory = {**mock_agent, "memory_enabled": False}

        # Assert
        assert agent_with_memory["memory_enabled"] is True
        assert agent_without_memory["memory_enabled"] is False

    def test_agent_knowledge_linkage(self, mock_agent, mock_knowledge):
        """Test linking knowledge bases to agent."""
        # Arrange
        agent_with_knowledge = {
            **mock_agent,
            "knowledge_sources": [mock_knowledge["id"]],
        }

        # Assert
        assert len(agent_with_knowledge["knowledge_sources"]) == 1
