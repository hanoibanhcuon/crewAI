"""
Template model for marketplace.
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TemplateCategory(BaseModel):
    """Template category model."""

    __tablename__ = "template_categories"

    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    templates = relationship("Template", back_populates="category")


class Template(BaseModel):
    """Template model for marketplace."""

    __tablename__ = "templates"

    # Basic Info
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    long_description = Column(Text, nullable=True)

    # Type
    template_type = Column(String(20), nullable=False)  # crew, flow, agent

    # Category
    category_id = Column(UUID(as_uuid=True), ForeignKey("template_categories.id"), nullable=True)

    # Content
    content = Column(JSONB, nullable=False)  # Serialized crew/flow/agent configuration

    # Preview
    preview_image = Column(String(500), nullable=True)
    screenshots = Column(ARRAY(String), default=list)

    # Author
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Stats
    downloads = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)

    # Pricing
    is_free = Column(Boolean, default=True)
    price = Column(Float, default=0.0)

    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    # Version
    version = Column(String(20), default="1.0.0")

    # Tags
    tags = Column(ARRAY(String), default=list)

    # Use Cases
    use_cases = Column(ARRAY(String), default=list)

    # Requirements
    required_tools = Column(ARRAY(String), default=list)
    required_api_keys = Column(ARRAY(String), default=list)

    # Relationships
    category = relationship("TemplateCategory", back_populates="templates")
    author = relationship("User")
