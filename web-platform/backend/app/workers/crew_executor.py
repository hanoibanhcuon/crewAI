"""
CrewAI Executor Worker - Handles crew execution using Celery.
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
import logging
import traceback

from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.execution import Execution, ExecutionLog, ExecutionStatus, LogLevel
from app.core.websocket import broadcast_execution_event

# Configure Celery
celery_app = Celery(
    "crewai_executor",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
)

logger = logging.getLogger(__name__)


class ExecutionLogger:
    """Logger for crew execution that saves to database."""

    def __init__(self, execution_id: UUID, db: AsyncSession):
        self.execution_id = execution_id
        self.db = db

    async def log(
        self,
        message: str,
        level: LogLevel = LogLevel.INFO,
        source: Optional[str] = None,
        source_type: Optional[str] = None,
        data: Optional[Dict] = None,
    ):
        """Log a message to the database."""
        log_entry = ExecutionLog(
            execution_id=self.execution_id,
            level=level,
            message=message,
            source=source,
            source_type=source_type,
            data=data,
            timestamp=datetime.utcnow(),
        )
        self.db.add(log_entry)
        await self.db.commit()


async def _update_execution_status(
    db: AsyncSession,
    execution_id: UUID,
    status: ExecutionStatus,
    error: Optional[str] = None,
    outputs: Optional[Dict] = None,
    metrics: Optional[Dict] = None,
):
    """Update execution status in database."""
    from sqlalchemy import select, update

    stmt = update(Execution).where(Execution.id == execution_id)

    update_values = {"status": status}

    if status == ExecutionStatus.RUNNING:
        update_values["started_at"] = datetime.utcnow()
    elif status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
        update_values["completed_at"] = datetime.utcnow()

    if error:
        update_values["error"] = error
    if outputs:
        update_values["outputs"] = outputs
    if metrics:
        if "total_tokens" in metrics:
            update_values["total_tokens"] = metrics["total_tokens"]
        if "prompt_tokens" in metrics:
            update_values["prompt_tokens"] = metrics["prompt_tokens"]
        if "completion_tokens" in metrics:
            update_values["completion_tokens"] = metrics["completion_tokens"]
        if "estimated_cost" in metrics:
            update_values["estimated_cost"] = metrics["estimated_cost"]
        if "duration_ms" in metrics:
            update_values["duration_ms"] = metrics["duration_ms"]

    await db.execute(stmt.values(**update_values))
    await db.commit()


async def _get_crew_config(db: AsyncSession, crew_id: UUID) -> Optional[Dict[str, Any]]:
    """Get crew configuration from database."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.crew import Crew
    from app.models.agent import Agent
    from app.models.task import Task

    result = await db.execute(
        select(Crew)
        .options(selectinload(Crew.agents), selectinload(Crew.tasks))
        .where(Crew.id == crew_id)
    )
    crew = result.scalar_one_or_none()
    if not crew:
        return None

    # Get agents
    agent_ids = [ca.agent_id for ca in sorted(crew.agents, key=lambda x: x.order)]
    agents_result = await db.execute(
        select(Agent)
        .options(selectinload(Agent.tools))
        .where(Agent.id.in_(agent_ids))
    )
    agents_map = {a.id: a for a in agents_result.scalars().all()}

    # Get tasks
    task_ids = [ct.task_id for ct in sorted(crew.tasks, key=lambda x: x.order)]
    tasks_result = await db.execute(select(Task).where(Task.id.in_(task_ids)))
    tasks_map = {t.id: t for t in tasks_result.scalars().all()}

    return {
        "crew": crew,
        "agents": [agents_map.get(aid) for aid in agent_ids if agents_map.get(aid)],
        "tasks": [tasks_map.get(tid) for tid in task_ids if tasks_map.get(tid)],
    }


async def _execute_crew_async(
    execution_id: UUID,
    crew_id: UUID,
    inputs: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute crew asynchronously."""
    async with AsyncSessionLocal() as db:
        exec_logger = ExecutionLogger(execution_id, db)

        try:
            # Update status to running
            await _update_execution_status(db, execution_id, ExecutionStatus.RUNNING)
            await exec_logger.log("Crew execution started", source_type="system")

            # Broadcast start event
            await broadcast_execution_event(
                execution_id, "start",
                {"message": "Crew execution started", "inputs": inputs}
            )

            # Get crew configuration
            config = await _get_crew_config(db, crew_id)
            if not config:
                raise ValueError(f"Crew {crew_id} not found")

            crew_model = config["crew"]
            agents_models = config["agents"]
            tasks_models = config["tasks"]

            await exec_logger.log(
                f"Loading crew: {crew_model.name} with "
                f"{len(agents_models)} agents and {len(tasks_models)} tasks",
                source_type="system",
            )

            # Broadcast crew info
            await broadcast_execution_event(
                execution_id, "crew_loaded",
                {
                    "crew_name": crew_model.name,
                    "agents_count": len(agents_models),
                    "tasks_count": len(tasks_models),
                }
            )

            # Build CrewAI objects
            from crewai import Agent, Task, Crew, Process

            start_time = datetime.utcnow()

            # Create agents
            crewai_agents = []
            for idx, agent_model in enumerate(agents_models):
                await exec_logger.log(
                    f"Creating agent: {agent_model.name}",
                    source=agent_model.name,
                    source_type="agent",
                )

                # Broadcast agent creation
                await broadcast_execution_event(
                    execution_id, "agent_created",
                    {
                        "agent_name": agent_model.name,
                        "agent_role": agent_model.role,
                        "index": idx,
                        "total": len(agents_models),
                    }
                )

                agent = Agent(
                    role=agent_model.role.format(**inputs) if inputs else agent_model.role,
                    goal=agent_model.goal.format(**inputs) if inputs else agent_model.goal,
                    backstory=(
                        agent_model.backstory.format(**inputs)
                        if agent_model.backstory and inputs
                        else agent_model.backstory
                    ),
                    verbose=agent_model.verbose,
                    allow_delegation=agent_model.allow_delegation,
                    max_iter=agent_model.max_iter,
                    max_rpm=agent_model.max_rpm,
                    max_retry_limit=agent_model.max_retry_limit,
                    memory=agent_model.memory_enabled,
                    allow_code_execution=agent_model.allow_code_execution,
                    # Note: Tools need to be loaded from tool definitions
                    tools=[],
                )
                crewai_agents.append(agent)

            # Create tasks
            crewai_tasks = []
            for task_idx, task_model in enumerate(tasks_models):
                await exec_logger.log(
                    f"Creating task: {task_model.name}",
                    source=task_model.name,
                    source_type="task",
                )

                # Broadcast task creation
                await broadcast_execution_event(
                    execution_id, "task_created",
                    {
                        "task_name": task_model.name,
                        "task_description": task_model.description[:100],
                        "index": task_idx,
                        "total": len(tasks_models),
                    }
                )

                # Find assigned agent
                assigned_agent = None
                if task_model.agent_id:
                    for j, agent_model in enumerate(agents_models):
                        if agent_model.id == task_model.agent_id:
                            assigned_agent = crewai_agents[j]
                            break

                task = Task(
                    description=(
                        task_model.description.format(**inputs)
                        if inputs
                        else task_model.description
                    ),
                    expected_output=(
                        task_model.expected_output.format(**inputs)
                        if inputs
                        else task_model.expected_output
                    ),
                    agent=assigned_agent,
                    async_execution=task_model.async_execution,
                    human_input=task_model.human_input,
                    output_file=task_model.output_file,
                )
                crewai_tasks.append(task)

            await exec_logger.log("Building crew...", source_type="system")

            # Create crew
            process = Process.hierarchical if crew_model.process == "hierarchical" else Process.sequential

            crew = Crew(
                agents=crewai_agents,
                tasks=crewai_tasks,
                process=process,
                verbose=crew_model.verbose,
                memory=crew_model.memory_enabled,
                cache=crew_model.cache_enabled,
                max_rpm=crew_model.max_rpm,
                planning=crew_model.planning,
                full_output=crew_model.full_output,
            )

            await exec_logger.log("Starting crew kickoff...", source_type="system")

            # Broadcast kickoff event
            await broadcast_execution_event(
                execution_id, "kickoff_started",
                {"message": "Crew kickoff started"}
            )

            # Execute crew
            result = crew.kickoff(inputs=inputs)

            # Broadcast kickoff complete
            await broadcast_execution_event(
                execution_id, "kickoff_complete",
                {"message": "Crew kickoff completed"}
            )

            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            await exec_logger.log(
                f"Crew execution completed in {duration_ms}ms",
                source_type="system",
            )

            # Extract result
            output = {
                "raw": str(result.raw) if hasattr(result, "raw") else str(result),
                "tasks_output": [],
            }

            if hasattr(result, "tasks_output"):
                for task_output in result.tasks_output:
                    output["tasks_output"].append({
                        "description": task_output.description if hasattr(task_output, "description") else "",
                        "raw": str(task_output.raw) if hasattr(task_output, "raw") else str(task_output),
                    })

            # Get token usage if available
            metrics = {"duration_ms": duration_ms}
            if hasattr(result, "token_usage"):
                token_usage = result.token_usage
                metrics.update({
                    "total_tokens": token_usage.total_tokens if hasattr(token_usage, "total_tokens") else 0,
                    "prompt_tokens": token_usage.prompt_tokens if hasattr(token_usage, "prompt_tokens") else 0,
                    "completion_tokens": token_usage.completion_tokens if hasattr(token_usage, "completion_tokens") else 0,
                })

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
                    "message": f"Crew execution completed in {duration_ms}ms",
                }
            )

            return output

        except Exception as e:
            error_msg = f"Crew execution failed: {str(e)}"
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


@celery_app.task(bind=True, name="execute_crew")
def execute_crew(
    self,
    execution_id: str,
    crew_id: str,
    inputs: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Celery task to execute a crew.

    Args:
        execution_id: UUID of the execution record
        crew_id: UUID of the crew to execute
        inputs: Input variables for the crew

    Returns:
        Execution result
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _execute_crew_async(
                UUID(execution_id),
                UUID(crew_id),
                inputs,
            )
        )
        return result
    finally:
        loop.close()


@celery_app.task(bind=True, name="cancel_execution")
def cancel_execution(self, execution_id: str) -> bool:
    """
    Cancel an ongoing execution.

    Args:
        execution_id: UUID of the execution to cancel

    Returns:
        True if cancelled successfully
    """
    async def _cancel():
        async with AsyncSessionLocal() as db:
            await _update_execution_status(
                db, UUID(execution_id), ExecutionStatus.CANCELLED
            )
            return True

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        return loop.run_until_complete(_cancel())
    finally:
        loop.close()
