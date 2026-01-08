import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    const condition = true;
    const result = cn("base", condition && "conditional");
    expect(result).toBe("base conditional");

    const falseCondition = false;
    const result2 = cn("base", falseCondition && "conditional");
    expect(result2).toBe("base");
  });

  it("handles undefined and null values", () => {
    const result = cn("class1", undefined, null, "class2");
    expect(result).toBe("class1 class2");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class1", "class2"]);
    expect(result).toBe("class1 class2");
  });

  it("handles objects with boolean values", () => {
    const result = cn({
      active: true,
      disabled: false,
      primary: true,
    });
    expect(result).toBe("active primary");
  });

  it("merges Tailwind classes correctly (tailwind-merge)", () => {
    // tailwind-merge should dedupe conflicting classes
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles complex combinations", () => {
    const variant = "primary";
    const size = "large";
    const isDisabled = false;

    const result = cn(
      "base-class",
      variant === "primary" && "bg-primary text-white",
      size === "large" && "text-lg p-4",
      isDisabled && "opacity-50 cursor-not-allowed"
    );

    expect(result).toContain("base-class");
    expect(result).toContain("bg-primary");
    expect(result).toContain("text-lg");
    expect(result).not.toContain("opacity-50");
  });
});
