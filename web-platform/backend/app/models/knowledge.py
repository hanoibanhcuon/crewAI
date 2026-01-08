"""
Knowledge Source model for RAG/knowledge bases.
"""
from sqlalchemy import Column, String, Text, Integer, Boolean, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class SourceType(str, enum.Enum):
    FILE = "file"
    URL = "url"
    TEXT = "text"
    DIRECTORY = "directory"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class KnowledgeSource(BaseModel):
    """Knowledge source model for storing documents and embeddings."""

    __tablename__ = "knowledge_sources"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Source type and content
    source_type = Column(Enum(SourceType), default=SourceType.FILE, nullable=False)
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING, nullable=False)

    # File-related fields
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(100), nullable=True)

    # URL-related fields
    url = Column(String(2048), nullable=True)

    # Text content (for direct text input)
    text_content = Column(Text, nullable=True)

    # Chunking configuration
    chunk_count = Column(Integer, default=0)
    chunk_size = Column(Integer, default=1000)
    chunk_overlap = Column(Integer, default=200)

    # Embedding configuration
    embedding_model = Column(String(100), default="text-embedding-3-small")
    embedding_dimensions = Column(Integer, nullable=True)

    # Vector store reference
    vector_store_id = Column(String(255), nullable=True)
    collection_name = Column(String(255), nullable=True)

    # Processing info
    error_message = Column(Text, nullable=True)
    source_metadata = Column(JSON, default=dict)

    # Ownership
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="knowledge_sources")

    def __repr__(self):
        return f"<KnowledgeSource {self.name} ({self.source_type})>"
