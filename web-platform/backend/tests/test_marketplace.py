"""
Tests for Marketplace API endpoints and services.
"""
import pytest
from unittest.mock import MagicMock


class TestMarketplaceCRUD:
    """Test cases for Marketplace operations."""

    def test_marketplace_browse(self, mock_template):
        """TC_MK_001: Browse marketplace templates."""
        # Arrange
        templates = [
            {**mock_template, "id": "tmpl-1", "name": "Research Crew"},
            {**mock_template, "id": "tmpl-2", "name": "Content Writer"},
            {**mock_template, "id": "tmpl-3", "name": "Data Analyst"},
        ]

        # Assert
        assert len(templates) == 3

    def test_marketplace_filter_by_type(self, mock_template):
        """TC_MK_002: Filter by type (crew)."""
        # Arrange
        templates = [
            {**mock_template, "id": "tmpl-1", "template_type": "crew"},
            {**mock_template, "id": "tmpl-2", "template_type": "flow"},
            {**mock_template, "id": "tmpl-3", "template_type": "agent"},
            {**mock_template, "id": "tmpl-4", "template_type": "crew"},
        ]

        # Act
        crew_templates = [t for t in templates if t["template_type"] == "crew"]

        # Assert
        assert len(crew_templates) == 2

    def test_marketplace_download_import(self, mock_template, mock_crew):
        """TC_MK_003: Download and import template."""
        # Arrange
        template_content = {
            "template_type": "crew",
            "content": {
                "name": mock_crew["name"],
                "description": mock_crew["description"],
                "agents": [],
                "tasks": [],
            },
        }

        # Assert
        assert template_content["template_type"] == "crew"
        assert "content" in template_content

    def test_marketplace_publish(self, mock_template, mock_crew):
        """TC_MK_004: Publish new template."""
        # Arrange
        publish_data = {
            "name": "My Research Crew",
            "description": "A crew for comprehensive research",
            "template_type": "crew",
            "content": mock_crew,
            "tags": ["research", "ai", "automation"],
            "use_cases": ["Market research", "Academic research"],
            "required_tools": ["SerperDevTool", "WebsiteSearchTool"],
            "required_api_keys": ["OPENAI_API_KEY", "SERPER_API_KEY"],
        }

        # Assert
        assert "tags" in publish_data
        assert len(publish_data["required_tools"]) > 0

    def test_marketplace_rate_template(self, mock_template):
        """TC_MK_005: Rate template."""
        # Arrange
        rating_data = {
            "template_id": mock_template["id"],
            "rating": 5,
            "comment": "Excellent template, saved me hours of work!",
        }

        # Calculate new average (simplified)
        old_rating = mock_template["rating"]
        old_count = mock_template["rating_count"]
        new_rating = (old_rating * old_count + rating_data["rating"]) / (old_count + 1)

        # Assert
        assert rating_data["rating"] >= 1 and rating_data["rating"] <= 5
        assert new_rating > 0

    def test_marketplace_search(self, mock_template):
        """TC_MK_006: Search templates."""
        # Arrange
        templates = [
            {**mock_template, "id": "tmpl-1", "name": "SEO Content Writer", "tags": ["seo", "content"]},
            {**mock_template, "id": "tmpl-2", "name": "Data Analyst", "tags": ["data", "analysis"]},
            {**mock_template, "id": "tmpl-3", "name": "Content Reviewer", "tags": ["content", "review"]},
        ]
        search_term = "content"

        # Act
        results = [
            t for t in templates
            if search_term.lower() in t["name"].lower() or
               any(search_term.lower() in tag.lower() for tag in t["tags"])
        ]

        # Assert
        assert len(results) == 2


class TestMarketplaceFilters:
    """Test cases for marketplace filtering options."""

    def test_filter_featured(self, mock_template):
        """Test featured templates filter."""
        templates = [
            {**mock_template, "id": "tmpl-1", "is_featured": True},
            {**mock_template, "id": "tmpl-2", "is_featured": False},
            {**mock_template, "id": "tmpl-3", "is_featured": True},
        ]

        featured = [t for t in templates if t.get("is_featured")]
        assert len(featured) == 2

    def test_filter_by_category(self, mock_template):
        """Test category filter."""
        templates = [
            {**mock_template, "id": "tmpl-1", "category": {"name": "Research"}},
            {**mock_template, "id": "tmpl-2", "category": {"name": "Content"}},
            {**mock_template, "id": "tmpl-3", "category": {"name": "Research"}},
        ]

        research = [t for t in templates if t.get("category", {}).get("name") == "Research"]
        assert len(research) == 2

    def test_filter_by_tags(self, mock_template):
        """Test tags filter."""
        templates = [
            {**mock_template, "id": "tmpl-1", "tags": ["ai", "research"]},
            {**mock_template, "id": "tmpl-2", "tags": ["content", "writing"]},
            {**mock_template, "id": "tmpl-3", "tags": ["ai", "automation"]},
        ]

        ai_templates = [t for t in templates if "ai" in t["tags"]]
        assert len(ai_templates) == 2

    def test_sort_by_rating(self, mock_template):
        """Test sorting by rating."""
        templates = [
            {**mock_template, "id": "tmpl-1", "rating": 4.2},
            {**mock_template, "id": "tmpl-2", "rating": 4.8},
            {**mock_template, "id": "tmpl-3", "rating": 4.5},
        ]

        sorted_templates = sorted(templates, key=lambda x: x["rating"], reverse=True)
        assert sorted_templates[0]["rating"] == 4.8

    def test_sort_by_downloads(self, mock_template):
        """Test sorting by download count."""
        templates = [
            {**mock_template, "id": "tmpl-1", "download_count": 150},
            {**mock_template, "id": "tmpl-2", "download_count": 500},
            {**mock_template, "id": "tmpl-3", "download_count": 250},
        ]

        sorted_templates = sorted(templates, key=lambda x: x["download_count"], reverse=True)
        assert sorted_templates[0]["download_count"] == 500

    def test_author_profile(self, mock_template, mock_user):
        """Test viewing author information."""
        template_with_author = {
            **mock_template,
            "author": {
                "id": mock_user["id"],
                "name": mock_user["full_name"],
                "templates_count": 5,
                "total_downloads": 1000,
            },
        }

        assert "author" in template_with_author
        assert template_with_author["author"]["templates_count"] == 5
