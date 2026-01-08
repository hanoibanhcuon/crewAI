import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState, NoResultsState, NoDataState, ErrorState } from "@/components/ui/empty-state";
import { FileText, Search, AlertTriangle } from "lucide-react";

describe("EmptyState Component", () => {
  it("renders with icon, title, and description", () => {
    render(
      <EmptyState
        icon={FileText}
        title="No documents"
        description="Upload your first document to get started"
      />
    );

    expect(screen.getByText("No documents")).toBeInTheDocument();
    expect(screen.getByText("Upload your first document to get started")).toBeInTheDocument();
  });

  it("renders action button when provided", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn();

    render(
      <EmptyState
        icon={FileText}
        title="No items"
        description="Create your first item"
        action={{
          label: "Create Item",
          onClick: mockAction,
        }}
      />
    );

    const button = screen.getByRole("button", { name: /create item/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(mockAction).toHaveBeenCalled();
  });
});

describe("NoResultsState Component", () => {
  it("renders search-specific empty state", () => {
    render(<NoResultsState searchTerm="test query" />);

    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    expect(screen.getByText(/test query/i)).toBeInTheDocument();
  });

  it("renders with onClear callback", async () => {
    const user = userEvent.setup();
    const mockClear = vi.fn();

    render(<NoResultsState searchTerm="query" onClear={mockClear} />);

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    await user.click(clearButton);
    expect(mockClear).toHaveBeenCalled();
  });
});

describe("NoDataState Component", () => {
  it("renders data-specific empty state", () => {
    render(<NoDataState entityName="Agent" />);

    expect(screen.getByText(/no agent yet/i)).toBeInTheDocument();
  });

  it("renders with create action", async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn();

    render(
      <NoDataState
        entityName="Task"
        onCreate={mockCreate}
      />
    );

    const createButton = screen.getByRole("button", { name: /create task/i });
    await user.click(createButton);
    expect(mockCreate).toHaveBeenCalled();
  });
});

describe("ErrorState Component", () => {
  it("renders error message", () => {
    render(<ErrorState title="Something went wrong" />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders with retry action", async () => {
    const user = userEvent.setup();
    const mockRetry = vi.fn();

    render(<ErrorState title="Failed to load" onRetry={mockRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });
});
