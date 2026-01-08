"""
Pytest configuration and fixtures for backend tests.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock()
    db.query = MagicMock(return_value=MagicMock())
    db.add = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    db.delete = MagicMock()
    return db


@pytest.fixture
def mock_async_db():
    """Mock async database session."""
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "full_name": "Test User",
        "is_active": True,
        "is_superuser": False,
    }


@pytest.fixture
def mock_agent():
    """Mock agent data."""
    return {
        "id": "test-agent-id",
        "name": "Test Agent",
        "role": "Researcher",
        "goal": "Research and analyze information",
        "backstory": "An expert researcher with years of experience",
        "owner_id": "test-user-id",
        "llm_model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 4096,
        "tools": [],
        "memory_enabled": True,
    }


@pytest.fixture
def mock_task():
    """Mock task data."""
    return {
        "id": "test-task-id",
        "name": "Test Task",
        "description": "Perform a test analysis",
        "expected_output": "A detailed analysis report",
        "agent_id": "test-agent-id",
        "owner_id": "test-user-id",
        "async_execution": False,
        "human_input": False,
    }


@pytest.fixture
def mock_crew():
    """Mock crew data."""
    return {
        "id": "test-crew-id",
        "name": "Test Crew",
        "description": "A test crew for testing",
        "process_type": "sequential",
        "owner_id": "test-user-id",
        "agent_ids": ["test-agent-id"],
        "task_ids": ["test-task-id"],
        "memory_enabled": False,
        "verbose": True,
    }


@pytest.fixture
def mock_flow():
    """Mock flow data."""
    return {
        "id": "test-flow-id",
        "name": "Test Flow",
        "description": "A test flow for testing",
        "owner_id": "test-user-id",
        "steps": [
            {"id": "start", "type": "START", "name": "Start"},
            {"id": "crew1", "type": "CREW", "name": "Process", "crew_id": "test-crew-id"},
            {"id": "end", "type": "END", "name": "End"},
        ],
        "connections": [
            {"source": "start", "target": "crew1", "type": "NORMAL"},
            {"source": "crew1", "target": "end", "type": "NORMAL"},
        ],
    }


@pytest.fixture
def mock_execution():
    """Mock execution data."""
    return {
        "id": "test-execution-id",
        "type": "crew",
        "resource_id": "test-crew-id",
        "status": "running",
        "owner_id": "test-user-id",
        "inputs": {"query": "test input"},
        "output": None,
        "error": None,
        "started_at": "2024-01-08T10:00:00Z",
        "completed_at": None,
        "token_usage": 0,
        "cost": 0.0,
    }


@pytest.fixture
def mock_trigger():
    """Mock trigger data."""
    return {
        "id": "test-trigger-id",
        "name": "Test Trigger",
        "description": "A test trigger",
        "trigger_type": "webhook",
        "target_type": "crew",
        "target_id": "test-crew-id",
        "owner_id": "test-user-id",
        "is_enabled": True,
        "config": {},
    }


@pytest.fixture
def mock_tool():
    """Mock tool data."""
    return {
        "id": "test-tool-id",
        "name": "Test Tool",
        "description": "A test tool for testing",
        "category": "custom",
        "tool_type": "custom",
        "owner_id": "test-user-id",
        "code": "def run(input): return input",
        "args_schema": {},
    }


@pytest.fixture
def mock_knowledge():
    """Mock knowledge base data."""
    return {
        "id": "test-knowledge-id",
        "name": "Test Knowledge Base",
        "description": "A test knowledge base",
        "source_type": "file",
        "owner_id": "test-user-id",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "embedding_model": "text-embedding-ada-002",
        "status": "ready",
    }


@pytest.fixture
def mock_template():
    """Mock marketplace template data."""
    return {
        "id": "test-template-id",
        "name": "Test Template",
        "description": "A test template",
        "template_type": "crew",
        "author_id": "test-user-id",
        "version": "1.0.0",
        "rating": 4.5,
        "rating_count": 10,
        "download_count": 100,
        "is_verified": True,
        "tags": ["test", "demo"],
        "content": {},
    }
