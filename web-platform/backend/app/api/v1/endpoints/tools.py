"""
Tool endpoints.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.tool import ToolCreate, ToolUpdate, ToolResponse, ToolListResponse, ToolCategoryResponse
from app.services import tool_service

router = APIRouter()


@router.get("/", response_model=ToolListResponse)
async def list_tools(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[UUID] = None,
    tool_type: Optional[str] = None,
    include_builtin: bool = True,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List tools with pagination.
    """
    tools, total = await tool_service.get_tools(
        db,
        owner_id=current_user.id,
        category_id=category_id,
        tool_type=tool_type,
        search=search,
        include_builtin=include_builtin,
        page=page,
        page_size=page_size
    )

    return ToolListResponse(
        items=[ToolResponse.model_validate(tool) for tool in tools],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/categories", response_model=List[ToolCategoryResponse])
async def list_tool_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    List all tool categories.
    """
    categories = await tool_service.get_categories(db)
    return [ToolCategoryResponse.model_validate(cat) for cat in categories]


@router.post("/", response_model=ToolResponse, status_code=status.HTTP_201_CREATED)
async def create_tool(
    tool_data: ToolCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a custom tool.
    """
    tool = await tool_service.create_tool(db, tool_data, current_user.id)
    return ToolResponse.model_validate(tool)


@router.get("/{tool_id}", response_model=ToolResponse)
async def get_tool(
    tool_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tool by ID.
    """
    tool = await tool_service.get_tool(db, tool_id, current_user.id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
    return ToolResponse.model_validate(tool)


@router.patch("/{tool_id}", response_model=ToolResponse)
async def update_tool(
    tool_id: UUID,
    tool_data: ToolUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update tool.
    """
    tool = await tool_service.update_tool(db, tool_id, tool_data, current_user.id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found or not authorized"
        )
    return ToolResponse.model_validate(tool)


@router.delete("/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(
    tool_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete tool.
    """
    success = await tool_service.delete_tool(db, tool_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found or not authorized"
        )


@router.post("/{tool_id}/test")
async def test_tool(
    tool_id: UUID,
    test_input: dict,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Test a tool with sample input.
    """
    tool = await tool_service.get_tool(db, tool_id, current_user.id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )

    result = await tool_service.test_tool(db, tool_id, test_input, current_user.id)
    return {"result": result}
