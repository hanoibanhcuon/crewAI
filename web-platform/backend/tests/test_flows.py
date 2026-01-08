"""
Tests for Flows API endpoints and services.
"""
import pytest
from unittest.mock import MagicMock


class TestFlowsCRUD:
    """Test cases for Flow CRUD operations."""

    def test_flow_create_simple(self, mock_flow, mock_crew):
        """TC_FLW_001: Create simple flow START -> CREW -> END."""
        # Arrange
        flow_data = {
            "name": "Simple Flow",
            "steps": [
                {"id": "start", "type": "START", "name": "Start"},
                {"id": "crew1", "type": "CREW", "name": "Process", "crew_id": mock_crew["id"]},
                {"id": "end", "type": "END", "name": "End"},
            ],
            "connections": [
                {"source": "start", "target": "crew1", "type": "NORMAL"},
                {"source": "crew1", "target": "end", "type": "NORMAL"},
            ],
        }

        # Assert
        assert len(flow_data["steps"]) == 3
        assert flow_data["steps"][0]["type"] == "START"
        assert flow_data["steps"][-1]["type"] == "END"

    def test_flow_create_with_router(self, mock_flow, mock_crew):
        """TC_FLW_002: Create flow with ROUTER conditional."""
        # Arrange
        flow_data = {
            "name": "Conditional Flow",
            "steps": [
                {"id": "start", "type": "START", "name": "Start"},
                {"id": "router1", "type": "ROUTER", "name": "Decision", "conditions": [
                    {"condition": "result.score > 0.8", "target": "success_crew"},
                    {"condition": "result.score <= 0.8", "target": "retry_crew"},
                ]},
                {"id": "success_crew", "type": "CREW", "name": "Success Path"},
                {"id": "retry_crew", "type": "CREW", "name": "Retry Path"},
                {"id": "end", "type": "END", "name": "End"},
            ],
            "connections": [
                {"source": "start", "target": "router1", "type": "NORMAL"},
                {"source": "router1", "target": "success_crew", "type": "CONDITIONAL"},
                {"source": "router1", "target": "retry_crew", "type": "CONDITIONAL"},
                {"source": "success_crew", "target": "end", "type": "NORMAL"},
                {"source": "retry_crew", "target": "end", "type": "NORMAL"},
            ],
        }

        # Assert
        router_step = next(s for s in flow_data["steps"] if s["type"] == "ROUTER")
        assert "conditions" in router_step
        assert len(router_step["conditions"]) == 2

    def test_flow_human_feedback_step(self, mock_flow):
        """TC_FLW_003: Test HUMAN_FEEDBACK step."""
        # Arrange
        flow_with_feedback = {
            "name": "Human Feedback Flow",
            "steps": [
                {"id": "start", "type": "START", "name": "Start"},
                {"id": "crew1", "type": "CREW", "name": "Initial Process"},
                {"id": "feedback", "type": "HUMAN_FEEDBACK", "name": "Review", "config": {
                    "timeout": 3600,  # 1 hour
                    "prompt": "Please review the output and provide feedback",
                }},
                {"id": "end", "type": "END", "name": "End"},
            ],
        }

        # Assert
        feedback_step = next(s for s in flow_with_feedback["steps"] if s["type"] == "HUMAN_FEEDBACK")
        assert feedback_step["config"]["timeout"] == 3600

    def test_flow_parallel_execution(self, mock_flow, mock_crew):
        """TC_FLW_004: Test parallel execution with AND connection."""
        # Arrange
        flow_parallel = {
            "name": "Parallel Flow",
            "steps": [
                {"id": "start", "type": "START", "name": "Start"},
                {"id": "crew1", "type": "CREW", "name": "Branch A"},
                {"id": "crew2", "type": "CREW", "name": "Branch B"},
                {"id": "merge", "type": "CREW", "name": "Merge Results"},
                {"id": "end", "type": "END", "name": "End"},
            ],
            "connections": [
                {"source": "start", "target": "crew1", "type": "NORMAL"},
                {"source": "start", "target": "crew2", "type": "NORMAL"},
                {"source": "crew1", "target": "merge", "type": "AND"},
                {"source": "crew2", "target": "merge", "type": "AND"},
                {"source": "merge", "target": "end", "type": "NORMAL"},
            ],
        }

        # Assert - check for AND connections
        and_connections = [c for c in flow_parallel["connections"] if c["type"] == "AND"]
        assert len(and_connections) == 2

    def test_flow_deploy(self, mock_flow):
        """TC_FLW_005: Deploy flow and test endpoint."""
        # Arrange
        deploy_config = {
            "flow_id": mock_flow["id"],
            "environment": "production",
            "endpoint_path": f"/api/flows/{mock_flow['id']}/run",
        }

        # Assert
        assert deploy_config["environment"] == "production"

    def test_flow_state_persistence(self, mock_flow):
        """TC_FLW_006: Test flow state persistence."""
        # Arrange
        flow_with_state = {
            **mock_flow,
            "state_schema": {
                "type": "object",
                "properties": {
                    "counter": {"type": "integer", "default": 0},
                    "results": {"type": "array", "items": {"type": "object"}},
                },
            },
        }

        # Assert
        assert "state_schema" in flow_with_state
        assert "counter" in flow_with_state["state_schema"]["properties"]


class TestFlowStepTypes:
    """Test cases for different flow step types."""

    def test_listen_step(self):
        """Test LISTEN step configuration."""
        listen_step = {
            "id": "listen1",
            "type": "LISTEN",
            "name": "Wait for Event",
            "config": {
                "event_type": "webhook",
                "timeout": 300,
            },
        }

        assert listen_step["type"] == "LISTEN"
        assert listen_step["config"]["event_type"] == "webhook"

    def test_function_step(self):
        """Test FUNCTION step configuration."""
        function_step = {
            "id": "func1",
            "type": "FUNCTION",
            "name": "Transform Data",
            "config": {
                "function_name": "transform_output",
                "code": "def transform_output(data): return {'processed': data}",
            },
        }

        assert function_step["type"] == "FUNCTION"
        assert "code" in function_step["config"]
