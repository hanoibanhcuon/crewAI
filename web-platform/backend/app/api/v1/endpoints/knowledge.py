"""
Knowledge Source endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.knowledge import (
    KnowledgeSourceCreate,
    KnowledgeSourceUpdate,
    KnowledgeSourceResponse,
    KnowledgeSourceListResponse,
    KnowledgeChunksResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResult,
)
from app.services import knowledge_service

router = APIRouter()


@router.get("/", response_model=KnowledgeSourceListResponse)
async def list_knowledge_sources(
    skip: int = 0,
    limit: int = 20,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all knowledge sources for current user."""
    sources, total = await knowledge_service.get_knowledge_sources(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        source_type=source_type,
        status=status,
        search=search,
    )
    return KnowledgeSourceListResponse(
        items=[KnowledgeSourceResponse.model_validate(s) for s in sources],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.post("/", response_model=KnowledgeSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_source(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    source_type: str = Form("file"),
    url: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    embedding_model: str = Form("text-embedding-3-small"),
    file: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new knowledge source."""
    # Validate based on source type
    if source_type == "file" and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required for file source type",
        )
    if source_type == "url" and not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required for url source type",
        )
    if source_type == "text" and not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content is required for text source type",
        )

    data = KnowledgeSourceCreate(
        name=name,
        description=description,
        source_type=source_type,
        url=url,
        text_content=text_content,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        embedding_model=embedding_model,
    )

    source = await knowledge_service.create_knowledge_source(
        db, data, current_user.id, file
    )
    return KnowledgeSourceResponse.model_validate(source)


@router.get("/{source_id}", response_model=KnowledgeSourceResponse)
async def get_knowledge_source(
    source_id: UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a knowledge source by ID."""
    source = await knowledge_service.get_knowledge_source(db, source_id, current_user.id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge source not found",
        )
    return KnowledgeSourceResponse.model_validate(source)


@router.patch("/{source_id}", response_model=KnowledgeSourceResponse)
async def update_knowledge_source(
    source_id: UUID,
    data: KnowledgeSourceUpdate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a knowledge source."""
    source = await knowledge_service.update_knowledge_source(
        db, source_id, data, current_user.id
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge source not found",
        )
    return KnowledgeSourceResponse.model_validate(source)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_source(
    source_id: UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a knowledge source."""
    success = await knowledge_service.delete_knowledge_source(
        db, source_id, current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge source not found",
        )


@router.post("/{source_id}/upload", response_model=KnowledgeSourceResponse)
async def upload_file(
    source_id: UUID,
    file: UploadFile = File(...),
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to a knowledge source."""
    source = await knowledge_service.upload_file_to_source(
        db, source_id, current_user.id, file
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge source not found",
        )
    return KnowledgeSourceResponse.model_validate(source)


@router.post("/{source_id}/reprocess", response_model=KnowledgeSourceResponse)
async def reprocess_knowledge_source(
    source_id: UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Reprocess a knowledge source."""
    source = await knowledge_service.reprocess_knowledge_source(
        db, source_id, current_user.id
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge source not found",
        )
    return KnowledgeSourceResponse.model_validate(source)


@router.get("/{source_id}/chunks", response_model=KnowledgeChunksResponse)
async def get_chunks(
    source_id: UUID,
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get chunks from a knowledge source."""
    chunks, total = await knowledge_service.get_knowledge_chunks(
        db, source_id, current_user.id, skip, limit
    )
    return KnowledgeChunksResponse(
        items=chunks,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.post("/search")
async def search_knowledge(
    request: KnowledgeSearchRequest,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Search across knowledge sources."""
    results = await knowledge_service.search_knowledge(
        db,
        current_user.id,
        request.query,
        request.top_k,
        request.source_ids,
    )
    return {"results": results}
