import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, formatShortcut, shortcuts } from "@/hooks/use-keyboard-shortcuts";

// Mock the dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/stores", () => ({
  useUIStore: () => ({
    toggleSidebar: vi.fn(),
  }),
}));

describe("useKeyboardShortcuts", () => {
  let events: Record<string, EventListener> = {};

  beforeEach(() => {
    events = {};
    vi.spyOn(document, "addEventListener").mockImplementation((event, handler) => {
      events[event] = handler as EventListener;
    });
    vi.spyOn(document, "removeEventListener").mockImplementation((event) => {
      delete events[event];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createKeyboardEvent(key: string, options: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}) {
    const event = new KeyboardEvent("keydown", {
      key,
      ...options,
      bubbles: true,
    });
    // Set a non-input target (like document.body)
    const div = document.createElement("div");
    Object.defineProperty(event, "target", { value: div, writable: false });
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: false });
    return event;
  }

  it("registers keydown event listener on mount", () => {
    renderHook(() => useKeyboardShortcuts());
    expect(document.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("removes keydown event listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("calls onOpenSearch when Ctrl+K is pressed", () => {
    const onOpenSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts(onOpenSearch));

    const event = createKeyboardEvent("k", { ctrlKey: true });
    events["keydown"]?.(event);

    expect(onOpenSearch).toHaveBeenCalled();
  });

  it("calls onOpenShortcuts when Shift+? is pressed", () => {
    const onOpenShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts(undefined, onOpenShortcuts));

    const event = createKeyboardEvent("?", { shiftKey: true });
    events["keydown"]?.(event);

    expect(onOpenShortcuts).toHaveBeenCalled();
  });

  it("does not trigger shortcuts when typing in input fields", () => {
    const onOpenSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts(onOpenSearch));

    const input = document.createElement("input");
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input, writable: false });
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: false });

    events["keydown"]?.(event);
    expect(onOpenSearch).not.toHaveBeenCalled();
  });
});

describe("formatShortcut", () => {
  it("formats single key shortcut", () => {
    const result = formatShortcut({ key: "/", description: "Focus search" });
    expect(result).toBe("/");
  });

  it("formats Ctrl key combination", () => {
    const result = formatShortcut({ key: "k", ctrl: true, description: "Open search" });
    expect(result).toContain("K");
    expect(result.toLowerCase()).toContain("ctrl");
  });

  it("formats Shift key combination", () => {
    const result = formatShortcut({ key: "?", shift: true, description: "Show shortcuts" });
    expect(result).toContain("?");
  });

  it("formats Alt key combination", () => {
    const result = formatShortcut({ key: "a", alt: true, description: "Go to Agents" });
    expect(result).toContain("A");
  });
});

describe("shortcuts array", () => {
  it("contains expected shortcuts", () => {
    expect(shortcuts).toBeInstanceOf(Array);
    expect(shortcuts.length).toBeGreaterThan(0);

    // Check for common shortcuts
    const searchShortcut = shortcuts.find((s) => s.key === "k" && s.ctrl);
    expect(searchShortcut).toBeDefined();
    expect(searchShortcut?.description).toContain("search");

    const sidebarShortcut = shortcuts.find((s) => s.key === "b" && s.ctrl);
    expect(sidebarShortcut).toBeDefined();
    expect(sidebarShortcut?.description.toLowerCase()).toContain("sidebar");
  });

  it("has navigation shortcuts", () => {
    const navShortcuts = shortcuts.filter((s) => s.description.startsWith("Go to"));
    expect(navShortcuts.length).toBeGreaterThan(0);
  });
});
