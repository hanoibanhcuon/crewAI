"""
Knowledge Source schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class KnowledgeSourceBase(BaseModel):
    """Base knowledge source schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    source_type: str = "file"
    chunk_size: int = Field(default=1000, ge=100, le=4000)
    chunk_overlap: int = Field(default=200, ge=0, le=500)
    embedding_model: str = "text-embedding-3-small"


class KnowledgeSourceCreate(KnowledgeSourceBase):
    """Schema for creating a knowledge source."""
    url: Optional[str] = None
    text_content: Optional[str] = None


class KnowledgeSourceUpdate(BaseModel):
    """Schema for updating a knowledge source."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    chunk_size: Optional[int] = Field(None, ge=100, le=4000)
    chunk_overlap: Optional[int] = Field(None, ge=0, le=500)
    embedding_model: Optional[str] = None


class KnowledgeSourceResponse(BaseModel):
    """Schema for knowledge source response."""
    id: UUID
    name: str
    description: Optional[str] = None
    source_type: str
    status: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    url: Optional[str] = None
    chunk_count: int
    chunk_size: int
    chunk_overlap: int
    embedding_model: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeChunk(BaseModel):
    """Schema for a knowledge chunk."""
    id: str
    content: str
    metadata: Dict[str, Any] = {}
    embedding: Optional[List[float]] = None
    score: Optional[float] = None


class KnowledgeChunksResponse(BaseModel):
    """Schema for knowledge chunks response."""
    items: List[KnowledgeChunk]
    total: int
    page: int
    page_size: int


class KnowledgeSourceListResponse(BaseModel):
    """Schema for listing knowledge sources."""
    items: List[KnowledgeSourceResponse]
    total: int
    page: int
    page_size: int


class KnowledgeSearchRequest(BaseModel):
    """Schema for searching knowledge."""
    query: str
    top_k: int = Field(default=5, ge=1, le=20)
    source_ids: Optional[List[UUID]] = None
    filters: Optional[Dict[str, Any]] = None


class KnowledgeSearchResult(BaseModel):
    """Schema for knowledge search result."""
    chunk: KnowledgeChunk
    source_id: UUID
    source_name: str
    score: float
