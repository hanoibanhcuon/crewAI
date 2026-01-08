"""
Template service - business logic for marketplace template operations.
"""
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from slugify import slugify
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.template import Template, TemplateCategory


async def get_templates(
    db: AsyncSession,
    template_type: Optional[str] = None,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    is_free: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = "downloads",
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Template], int]:
    """Get templates with pagination."""
    query = select(Template).options(selectinload(Template.category))

    conditions = [Template.is_active == True]
    if template_type:
        conditions.append(Template.template_type == template_type)
    if category_id:
        conditions.append(Template.category_id == category_id)
    if search:
        conditions.append(
            Template.name.ilike(f"%{search}%") | Template.description.ilike(f"%{search}%")
        )
    if is_free is not None:
        conditions.append(Template.is_free == is_free)
    if is_featured is not None:
        conditions.append(Template.is_featured == is_featured)

    query = query.where(*conditions)

    # Sorting
    if sort_by == "downloads":
        query = query.order_by(Template.downloads.desc())
    elif sort_by == "likes":
        query = query.order_by(Template.likes.desc())
    elif sort_by == "rating":
        query = query.order_by(Template.rating.desc())
    else:
        query = query.order_by(Template.created_at.desc())

    count_query = select(func.count(Template.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_categories(db: AsyncSession) -> List[TemplateCategory]:
    """Get all template categories."""
    result = await db.execute(
        select(TemplateCategory).order_by(TemplateCategory.order)
    )
    return result.scalars().all()


async def get_user_templates(
    db: AsyncSession, user_id: UUID, page: int = 1, page_size: int = 20
) -> Tuple[List[Template], int]:
    """Get templates created by a user."""
    query = select(Template).options(selectinload(Template.category))
    conditions = [Template.author_id == user_id]

    query = query.where(*conditions)

    count_query = select(func.count(Template.id)).where(*conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return result.scalars().all(), total


async def get_template(db: AsyncSession, template_id: UUID) -> Optional[Template]:
    """Get template by ID."""
    result = await db.execute(
        select(Template)
        .options(selectinload(Template.category))
        .where(Template.id == template_id, Template.is_active == True)
    )
    return result.scalar_one_or_none()


async def create_template(db: AsyncSession, template_data, author_id: UUID) -> Template:
    """Create a new template."""
    # Generate unique slug
    base_slug = slugify(template_data.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Template).where(Template.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    template = Template(
        name=template_data.name,
        slug=slug,
        description=template_data.description,
        long_description=template_data.long_description,
        template_type=template_data.template_type,
        category_id=template_data.category_id,
        content=template_data.content,
        preview_image=template_data.preview_image,
        screenshots=template_data.screenshots,
        author_id=author_id,
        is_free=template_data.is_free,
        price=template_data.price,
        tags=template_data.tags,
        use_cases=template_data.use_cases,
        required_tools=template_data.required_tools,
        required_api_keys=template_data.required_api_keys,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def update_template(
    db: AsyncSession, template_id: UUID, template_data, author_id: UUID
) -> Optional[Template]:
    """Update template."""
    template = await db.execute(
        select(Template).where(Template.id == template_id, Template.author_id == author_id)
    )
    template = template.scalar_one_or_none()
    if not template:
        return None

    update_data = template_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return template


async def delete_template(db: AsyncSession, template_id: UUID, author_id: UUID) -> bool:
    """Delete template."""
    template = await db.execute(
        select(Template).where(Template.id == template_id, Template.author_id == author_id)
    )
    template = template.scalar_one_or_none()
    if not template:
        return False

    await db.delete(template)
    await db.commit()
    return True


async def use_template(
    db: AsyncSession, template_id: UUID, user_id: UUID
) -> Dict[str, Any]:
    """Use a template to create a crew/flow/agent."""
    template = await get_template(db, template_id)
    if not template:
        return {"error": "Template not found"}

    # Increment download count
    template.downloads = (template.downloads or 0) + 1
    await db.commit()

    # In production, this would actually create the entity from the template
    # For now, return mock response
    return {
        "id": str(UUID(int=0)),  # Would be the actual created entity ID
        "type": template.template_type,
        "name": template.name,
    }


async def like_template(db: AsyncSession, template_id: UUID, user_id: UUID) -> None:
    """Like a template."""
    template = await get_template(db, template_id)
    if template:
        template.likes = (template.likes or 0) + 1
        await db.commit()


async def rate_template(
    db: AsyncSession, template_id: UUID, user_id: UUID, rating: int
) -> None:
    """Rate a template."""
    template = await get_template(db, template_id)
    if template:
        # Calculate new average rating
        total_rating = template.rating * template.rating_count + rating
        template.rating_count = (template.rating_count or 0) + 1
        template.rating = total_rating / template.rating_count
        await db.commit()
