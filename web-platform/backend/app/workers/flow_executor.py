"""
Flow Executor Worker - Handles flow execution using Celery.
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import UUID
import logging
import traceback

from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.execution import Execution, ExecutionLog, ExecutionStatus, LogLevel
from app.models.flow import Flow, FlowStep, FlowConnection
from app.core.websocket import broadcast_execution_event
from app.workers.crew_executor import celery_app, ExecutionLogger, _update_execution_status

logger = logging.getLogger(__name__)


async def _get_flow_config(db: AsyncSession, flow_id: UUID) -> Optional[Dict[str, Any]]:
    """Get flow configuration from database."""
    result = await db.execute(
        select(Flow)
        .options(
            selectinload(Flow.steps),
            selectinload(Flow.connections)
        )
        .where(Flow.id == flow_id)
    )
    flow = result.scalar_one_or_none()
    if not flow:
        return None

    # Build step map
    steps = {str(step.id): step for step in flow.steps}

    # Build adjacency list for connections
    connections = {}
    for conn in flow.connections:
        source = str(conn.source_step_id)
        if source not in connections:
            connections[source] = []
        connections[source].append({
            "target": str(conn.target_step_id),
            "type": conn.connection_type,
            "condition": conn.condition,
            "route_name": conn.route_name,
        })

    return {
        "flow": flow,
        "steps": steps,
        "connections": connections,
    }


def _find_start_step(steps: Dict[str, FlowStep]) -> Optional[FlowStep]:
    """Find the start step in the flow."""
    for step in steps.values():
        if step.step_type == "start":
            return step
    return None


def _get_next_steps(
    current_step_id: str,
    connections: Dict[str, List[Dict]],
    state: Dict[str, Any],
    route_name: Optional[str] = None
) -> List[str]:
    """Get next step IDs based on connections and state."""
    if current_step_id not in connections:
        return []

    next_steps = []
    for conn in connections[current_step_id]:
        # Handle router connections with route names
        if route_name and conn.get("route_name"):
            if conn["route_name"] == route_name:
                next_steps.append(conn["target"])
        # Handle conditional connections
        elif conn.get("condition"):
            try:
                # Evaluate condition against state
                if eval(conn["condition"], {"state": state, "__builtins__": {}}):
                    next_steps.append(conn["target"])
            except Exception:
                pass
        # Normal connections
        else:
            next_steps.append(conn["target"])

    return next_steps


async def _execute_step(
    step: FlowStep,
    state: Dict[str, Any],
    inputs: Dict[str, Any],
    execution_id: UUID,
    exec_logger: ExecutionLogger,
    db: AsyncSession,
) -> tuple[Dict[str, Any], Optional[str]]:
    """
    Execute a single flow step.

    Returns:
        tuple: (updated_state, route_name if router step)
    """
    step_type = step.step_type
    config = step.config or {}
    route_name = None

    await exec_logger.log(
        f"Executing step: {step.name} ({step_type})",
        source=step.name,
        source_type="step"
    )

    await broadcast_execution_event(
        execution_id, "step_start",
        {"step_name": step.name, "step_type": step_type}
    )

    try:
        if step_type == "start":
            # Start step - initialize state with inputs
            state = {**state, **inputs}

        elif step_type == "end":
            # End step - mark completion
            pass

        elif step_type == "crew":
            # Execute a crew
            crew_id = config.get("crew_id")
            if crew_id:
                from app.workers.crew_executor import _execute_crew_async

                await exec_logger.log(
                    f"Executing crew: {config.get('crew_name', crew_id)}",
                    source=step.name,
                    source_type="step"
                )

                # Pass state as inputs to crew
                crew_result = await _execute_crew_async(
                    execution_id, UUID(crew_id), state
                )
                state["crew_result"] = crew_result

        elif step_type == "function":
            # Execute custom Python code
            code = config.get("code", "")
            function_name = config.get("function_name", "execute")

            if code:
                # Create a safe execution environment
                local_vars = {"state": state.copy()}
                exec(code, {"__builtins__": __builtins__}, local_vars)

                # Call the function if it exists
                if function_name in local_vars:
                    result = local_vars[function_name](state)
                    if isinstance(result, dict):
                        state.update(result)

        elif step_type == "router":
            # Router step - evaluate conditions to determine route
            routes = config.get("routes", [])
            conditions = config.get("conditions", [])

            for i, condition in enumerate(conditions):
                try:
                    if eval(condition.get("condition", "False"),
                           {"state": state, "__builtins__": {}}):
                        route_name = condition.get("route", routes[i] if i < len(routes) else None)
                        break
                except Exception:
                    pass

            # Default route if no condition matched
            if not route_name and routes:
                route_name = routes[-1]

        elif step_type == "listen":
            # Listen step - wait for event (simplified)
            event_type = config.get("event")
            await exec_logger.log(
                f"Listening for event: {event_type}",
                source=step.name,
                source_type="step"
            )

        elif step_type == "human_feedback":
            # Human feedback step - wait for input
            prompt = config.get("prompt", "Please provide feedback")

            await broadcast_execution_event(
                execution_id, "human_input_required",
                {
                    "step_name": step.name,
                    "prompt": prompt,
                    "options": config.get("options", []),
                }
            )

            # Update execution status to waiting
            await _update_execution_status(
                db, execution_id, ExecutionStatus.WAITING_HUMAN
            )

            # In a real implementation, we would wait for feedback here
            # For now, we just mark it and continue
            state["awaiting_human_feedback"] = True

        await broadcast_execution_event(
            execution_id, "step_complete",
            {"step_name": step.name, "step_type": step_type}
        )

    except Exception as e:
        await exec_logger.log(
            f"Step {step.name} failed: {str(e)}",
            level=LogLevel.ERROR,
            source=step.name,
            source_type="step"
        )
        raise

    return state, route_name


async def _execute_flow_async(
    execution_id: UUID,
    flow_id: UUID,
    inputs: Dict[str, Any],
    initial_state: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute flow asynchronously."""
    async with AsyncSessionLocal() as db:
        exec_logger = ExecutionLogger(execution_id, db)

        try:
            # Update status to running
            await _update_execution_status(db, execution_id, ExecutionStatus.RUNNING)
            await exec_logger.log("Flow execution started", source_type="system")

            # Broadcast start event
            await broadcast_execution_event(
                execution_id, "start",
                {"message": "Flow execution started", "inputs": inputs}
            )

            # Get flow configuration
            config = await _get_flow_config(db, flow_id)
            if not config:
                raise ValueError(f"Flow {flow_id} not found")

            flow_model = config["flow"]
            steps = config["steps"]
            connections = config["connections"]

            await exec_logger.log(
                f"Loading flow: {flow_model.name} with {len(steps)} steps",
                source_type="system",
            )

            await broadcast_execution_event(
                execution_id, "flow_loaded",
                {
                    "flow_name": flow_model.name,
                    "steps_count": len(steps),
                }
            )

            start_time = datetime.utcnow()

            # Initialize state
            state = {**initial_state}

            # Find start step
            start_step = _find_start_step(steps)
            if not start_step:
                raise ValueError("Flow has no start step")

            # Execute flow using BFS
            current_step_ids = [str(start_step.id)]
            visited = set()
            step_count = 0

            while current_step_ids:
                next_step_ids = []

                for step_id in current_step_ids:
                    if step_id in visited:
                        continue
                    visited.add(step_id)

                    step = steps.get(step_id)
                    if not step:
                        continue

                    step_count += 1

                    # Execute step
                    state, route_name = await _execute_step(
                        step, state, inputs, execution_id, exec_logger, db
                    )

                    # Check if waiting for human input
                    if state.get("awaiting_human_feedback"):
                        # Stop execution and wait
                        return {"status": "waiting_human", "state": state}

                    # Get next steps
                    next_ids = _get_next_steps(step_id, connections, state, route_name)
                    next_step_ids.extend(next_ids)

                current_step_ids = next_step_ids

            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            await exec_logger.log(
                f"Flow execution completed in {duration_ms}ms ({step_count} steps)",
                source_type="system",
            )

            output = {
                "state": state,
                "steps_executed": step_count,
                "duration_ms": duration_ms,
            }

            metrics = {"duration_ms": duration_ms}

            # Update execution with success
            await _update_execution_status(
                db, execution_id, ExecutionStatus.COMPLETED,
                outputs=output, metrics=metrics
            )

            # Broadcast completion event
            await broadcast_execution_event(
                execution_id, "complete",
                {
                    "output": output,
                    "metrics": metrics,
                    "message": f"Flow execution completed in {duration_ms}ms",
                }
            )

            return output

        except Exception as e:
            error_msg = f"Flow execution failed: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            await exec_logger.log(
                error_msg, level=LogLevel.ERROR, source_type="system"
            )
            await _update_execution_status(
                db, execution_id, ExecutionStatus.FAILED, error=str(e)
            )

            # Broadcast error event
            await broadcast_execution_event(
                execution_id, "error",
                {"message": error_msg, "error": str(e)}
            )

            raise


@celery_app.task(bind=True, name="execute_flow")
def execute_flow(
    self,
    execution_id: str,
    flow_id: str,
    inputs: Dict[str, Any],
    initial_state: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """
    Celery task to execute a flow.

    Args:
        execution_id: UUID of the execution record
        flow_id: UUID of the flow to execute
        inputs: Input variables for the flow
        initial_state: Initial state for the flow

    Returns:
        Execution result
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _execute_flow_async(
                UUID(execution_id),
                UUID(flow_id),
                inputs,
                initial_state or {},
            )
        )
        return result
    finally:
        loop.close()
