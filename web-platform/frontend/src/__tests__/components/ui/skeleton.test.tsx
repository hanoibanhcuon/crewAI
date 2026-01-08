import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Skeleton,
  CardSkeleton,
  GridSkeleton,
  TableSkeleton,
  FormSkeleton,
  DetailSkeleton,
  PageSkeleton,
} from "@/components/ui/skeleton";

describe("Skeleton Component", () => {
  it("renders with default classes", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("animate-pulse", "rounded-md", "bg-muted");
  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("custom-class");
  });
});

describe("CardSkeleton Component", () => {
  it("renders card skeleton structure", () => {
    const { container } = render(<CardSkeleton />);
    // Should have multiple skeleton elements for header and content
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});

describe("GridSkeleton Component", () => {
  it("renders specified number of card skeletons", () => {
    const { container } = render(<GridSkeleton count={6} />);
    const grid = container.firstChild as HTMLElement;
    // Should contain multiple skeleton cards
    expect(grid?.children.length).toBe(6);
  });

  it("defaults to 6 items", () => {
    const { container } = render(<GridSkeleton />);
    const grid = container.firstChild as HTMLElement;
    expect(grid?.children.length).toBe(6);
  });
});

describe("TableSkeleton Component", () => {
  it("renders table skeleton with specified rows", () => {
    const { container } = render(<TableSkeleton rows={5} columns={4} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("uses default row and column count", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("FormSkeleton Component", () => {
  it("renders form skeleton with specified fields", () => {
    const { container } = render(<FormSkeleton fields={4} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(4);
  });
});

describe("DetailSkeleton Component", () => {
  it("renders detail page skeleton", () => {
    const { container } = render(<DetailSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("PageSkeleton Component", () => {
  it("renders full page skeleton", () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
