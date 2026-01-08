"""
Tool service - business logic for tool operations.
"""
from typing import List, Optional, Tuple, Any
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tool import Tool, ToolCategory, ToolType
from app.schemas.tool import ToolCreate, ToolUpdate


async def get_tools(
    db: AsyncSession,
    owner_id: UUID,
    category_id: Optional[UUID] = None,
    tool_type: Optional[str] = None,
    search: Optional[str] = None,
    include_builtin: bool = True,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[Tool], int]:
    """Get tools with pagination."""
    query = select(Tool).options(selectinload(Tool.category))

    conditions = []
    if include_builtin:
        conditions.append(or_(Tool.owner_id == owner_id, Tool.is_builtin == True, Tool.is_public == True))
    else:
        conditions.append(Tool.owner_id == owner_id)

    if category_id:
        conditions.append(Tool.category_id == category_id)
    if tool_type:
        conditions.append(Tool.tool_type == tool_type)
    if search:
        conditions.append(
            or_(
                Tool.name.ilike(f"%{search}%"),
                Tool.description.ilike(f"%{search}%"),
            )
        )

    conditions.append(Tool.is_active == True)
    query = query.where(*conditions)

    count_query = select(func.count(Tool.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_categories(db: AsyncSession) -> List[ToolCategory]:
    """Get all tool categories."""
    result = await db.execute(
        select(ToolCategory).order_by(ToolCategory.order)
    )
    return result.scalars().all()


async def get_tool(db: AsyncSession, tool_id: UUID, user_id: UUID) -> Optional[Tool]:
    """Get tool by ID."""
    result = await db.execute(
        select(Tool)
        .options(selectinload(Tool.category))
        .where(
            Tool.id == tool_id,
            or_(Tool.owner_id == user_id, Tool.is_builtin == True, Tool.is_public == True)
        )
    )
    return result.scalar_one_or_none()


async def create_tool(db: AsyncSession, tool_data: ToolCreate, owner_id: UUID) -> Tool:
    """Create a custom tool."""
    tool = Tool(
        name=tool_data.name,
        description=tool_data.description,
        tool_type=tool_data.tool_type,
        category_id=tool_data.category_id,
        module_path=tool_data.module_path,
        class_name=tool_data.class_name,
        custom_code=tool_data.custom_code,
        args_schema=tool_data.args_schema,
        env_vars=tool_data.env_vars,
        default_config=tool_data.default_config,
        cache_enabled=tool_data.cache_enabled,
        cache_function=tool_data.cache_function,
        max_usage_count=tool_data.max_usage_count,
        result_as_answer=tool_data.result_as_answer,
        icon=tool_data.icon,
        color=tool_data.color,
        owner_id=owner_id,
        team_id=tool_data.team_id,
        is_public=tool_data.is_public,
        is_builtin=False,
        tags=tool_data.tags,
    )
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return tool


async def update_tool(
    db: AsyncSession, tool_id: UUID, tool_data: ToolUpdate, user_id: UUID
) -> Optional[Tool]:
    """Update tool."""
    tool = await db.execute(
        select(Tool).where(Tool.id == tool_id, Tool.owner_id == user_id)
    )
    tool = tool.scalar_one_or_none()
    if not tool:
        return None

    update_data = tool_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tool, field, value)

    await db.commit()
    await db.refresh(tool)
    return tool


async def delete_tool(db: AsyncSession, tool_id: UUID, user_id: UUID) -> bool:
    """Delete tool."""
    tool = await db.execute(
        select(Tool).where(Tool.id == tool_id, Tool.owner_id == user_id, Tool.is_builtin == False)
    )
    tool = tool.scalar_one_or_none()
    if not tool:
        return False

    await db.delete(tool)
    await db.commit()
    return True


async def test_tool(
    db: AsyncSession, tool_id: UUID, test_input: dict, user_id: UUID
) -> Any:
    """Test a tool with sample input."""
    tool = await get_tool(db, tool_id, user_id)
    if not tool:
        return {"error": "Tool not found"}

    # In production, this would actually execute the tool
    # For now, return a mock response
    return {
        "success": True,
        "tool_name": tool.name,
        "input": test_input,
        "output": f"Mock output for {tool.name}",
    }
