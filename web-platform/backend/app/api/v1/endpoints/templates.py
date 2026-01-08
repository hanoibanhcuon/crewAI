"""
Template (Marketplace) endpoints.
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.services import template_service

router = APIRouter()


# Pydantic models for templates
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    long_description: Optional[str] = None
    template_type: str  # crew, flow, agent
    category_id: Optional[UUID] = None
    content: Dict[str, Any]
    preview_image: Optional[str] = None
    screenshots: List[str] = []
    is_free: bool = True
    price: float = 0.0
    tags: List[str] = []
    use_cases: List[str] = []
    required_tools: List[str] = []
    required_api_keys: List[str] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    long_description: Optional[str] = None
    category_id: Optional[UUID] = None
    content: Optional[Dict[str, Any]] = None
    preview_image: Optional[str] = None
    screenshots: Optional[List[str]] = None
    is_free: Optional[bool] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    use_cases: Optional[List[str]] = None
    required_tools: Optional[List[str]] = None
    required_api_keys: Optional[List[str]] = None


class TemplateCategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    order: int

    class Config:
        from_attributes = True


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    long_description: Optional[str]
    template_type: str
    category_id: Optional[UUID]
    category: Optional[TemplateCategoryResponse]
    content: Dict[str, Any]
    preview_image: Optional[str]
    screenshots: List[str]
    author_id: UUID
    author_name: Optional[str] = None
    downloads: int
    likes: int
    rating: float
    rating_count: int
    is_free: bool
    price: float
    is_active: bool
    is_featured: bool
    is_verified: bool
    version: str
    tags: List[str]
    use_cases: List[str]
    required_tools: List[str]
    required_api_keys: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    items: List[TemplateResponse]
    total: int
    page: int
    page_size: int
    pages: int


@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    template_type: Optional[str] = None,
    category_id: Optional[UUID] = None,
    is_free: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = "downloads",  # downloads, likes, rating, created_at
    db: AsyncSession = Depends(get_db)
):
    """
    List templates in marketplace.
    """
    templates, total = await template_service.get_templates(
        db,
        template_type=template_type,
        category_id=category_id,
        search=search,
        is_free=is_free,
        is_featured=is_featured,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )

    return TemplateListResponse(
        items=[TemplateResponse.model_validate(t) for t in templates],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/categories", response_model=List[TemplateCategoryResponse])
async def list_template_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    List all template categories.
    """
    categories = await template_service.get_categories(db)
    return [TemplateCategoryResponse.model_validate(cat) for cat in categories]


@router.get("/my", response_model=TemplateListResponse)
async def list_my_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List templates created by current user.
    """
    templates, total = await template_service.get_user_templates(
        db, current_user.id, page=page, page_size=page_size
    )

    return TemplateListResponse(
        items=[TemplateResponse.model_validate(t) for t in templates],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new template.
    """
    template = await template_service.create_template(db, template_data, current_user.id)
    return TemplateResponse.model_validate(template)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get template by ID.
    """
    template = await template_service.get_template(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse.model_validate(template)


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: UUID,
    template_data: TemplateUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update template.
    """
    template = await template_service.update_template(
        db, template_id, template_data, current_user.id
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or not authorized"
        )
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete template.
    """
    success = await template_service.delete_template(db, template_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or not authorized"
        )


@router.post("/{template_id}/use")
async def use_template(
    template_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Use a template to create a crew/flow/agent.
    """
    template = await template_service.get_template(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    result = await template_service.use_template(db, template_id, current_user.id)
    return {
        "message": f"{template.template_type.capitalize()} created from template",
        "id": result.get("id"),
        "type": template.template_type
    }


@router.post("/{template_id}/like")
async def like_template(
    template_id: UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Like a template.
    """
    await template_service.like_template(db, template_id, current_user.id)
    return {"message": "Template liked"}


@router.post("/{template_id}/rate")
async def rate_template(
    template_id: UUID,
    rating: int = Query(..., ge=1, le=5),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Rate a template.
    """
    await template_service.rate_template(db, template_id, current_user.id, rating)
    return {"message": "Template rated"}
