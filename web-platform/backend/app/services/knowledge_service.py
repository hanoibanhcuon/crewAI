"""
Knowledge Source service.
"""
import os
import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import UploadFile

from app.models.knowledge import KnowledgeSource, SourceType, ProcessingStatus
from app.schemas.knowledge import (
    KnowledgeSourceCreate,
    KnowledgeSourceUpdate,
)


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads/knowledge")


async def get_knowledge_sources(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    source_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> tuple[List[KnowledgeSource], int]:
    """Get all knowledge sources for user."""
    query = select(KnowledgeSource).where(KnowledgeSource.user_id == user_id)

    if source_type:
        query = query.where(KnowledgeSource.source_type == source_type)

    if status:
        query = query.where(KnowledgeSource.status == status)

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (KnowledgeSource.name.ilike(search_filter))
            | (KnowledgeSource.description.ilike(search_filter))
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(KnowledgeSource.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    sources = result.scalars().all()

    return list(sources), total


async def get_knowledge_source(
    db: AsyncSession,
    source_id: UUID,
    user_id: UUID,
) -> Optional[KnowledgeSource]:
    """Get a knowledge source by ID."""
    query = select(KnowledgeSource).where(
        KnowledgeSource.id == source_id,
        KnowledgeSource.user_id == user_id,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_knowledge_source(
    db: AsyncSession,
    data: KnowledgeSourceCreate,
    user_id: UUID,
    file: Optional[UploadFile] = None,
) -> KnowledgeSource:
    """Create a new knowledge source."""
    source = KnowledgeSource(
        name=data.name,
        description=data.description,
        source_type=SourceType(data.source_type),
        status=ProcessingStatus.PENDING,
        chunk_size=data.chunk_size,
        chunk_overlap=data.chunk_overlap,
        embedding_model=data.embedding_model,
        user_id=user_id,
    )

    # Handle different source types
    if data.source_type == "file" and file:
        # Save file
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

        # Ensure directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Save file content
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        source.file_name = file.filename
        source.file_path = file_path
        source.file_size = len(content)
        source.file_type = file.content_type

    elif data.source_type == "url":
        source.url = data.url

    elif data.source_type == "text":
        source.text_content = data.text_content

    db.add(source)
    await db.commit()
    await db.refresh(source)

    # TODO: Trigger background processing task
    # await process_knowledge_source.delay(str(source.id))

    return source


async def update_knowledge_source(
    db: AsyncSession,
    source_id: UUID,
    data: KnowledgeSourceUpdate,
    user_id: UUID,
) -> Optional[KnowledgeSource]:
    """Update a knowledge source."""
    source = await get_knowledge_source(db, source_id, user_id)
    if not source:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(source, field, value)

    source.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(source)
    return source


async def delete_knowledge_source(
    db: AsyncSession,
    source_id: UUID,
    user_id: UUID,
) -> bool:
    """Delete a knowledge source."""
    source = await get_knowledge_source(db, source_id, user_id)
    if not source:
        return False

    # Delete file if exists
    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)

    # TODO: Delete from vector store
    # if source.vector_store_id:
    #     await delete_from_vector_store(source.vector_store_id)

    await db.delete(source)
    await db.commit()
    return True


async def upload_file_to_source(
    db: AsyncSession,
    source_id: UUID,
    user_id: UUID,
    file: UploadFile,
) -> Optional[KnowledgeSource]:
    """Upload a file to an existing knowledge source."""
    source = await get_knowledge_source(db, source_id, user_id)
    if not source:
        return None

    # Save file
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Delete old file if exists
    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)

    source.file_name = file.filename
    source.file_path = file_path
    source.file_size = len(content)
    source.file_type = file.content_type
    source.status = ProcessingStatus.PENDING
    source.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(source)

    # TODO: Trigger reprocessing
    # await process_knowledge_source.delay(str(source.id))

    return source


async def reprocess_knowledge_source(
    db: AsyncSession,
    source_id: UUID,
    user_id: UUID,
) -> Optional[KnowledgeSource]:
    """Reprocess a knowledge source."""
    source = await get_knowledge_source(db, source_id, user_id)
    if not source:
        return None

    source.status = ProcessingStatus.PENDING
    source.error_message = None
    source.chunk_count = 0
    source.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(source)

    # TODO: Trigger reprocessing
    # await process_knowledge_source.delay(str(source.id))

    return source


async def get_knowledge_chunks(
    db: AsyncSession,
    source_id: UUID,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
) -> tuple[List[Dict[str, Any]], int]:
    """Get chunks from a knowledge source."""
    source = await get_knowledge_source(db, source_id, user_id)
    if not source:
        return [], 0

    # TODO: Implement vector store chunk retrieval
    # For now, return empty list
    chunks = []
    total = source.chunk_count

    return chunks, total


async def search_knowledge(
    db: AsyncSession,
    user_id: UUID,
    query: str,
    top_k: int = 5,
    source_ids: Optional[List[UUID]] = None,
) -> List[Dict[str, Any]]:
    """Search across knowledge sources."""
    # TODO: Implement vector search
    # This would use the embedding model to create query embedding
    # and search in the vector store
    return []
