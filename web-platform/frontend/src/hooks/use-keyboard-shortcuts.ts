"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export const shortcuts: Omit<Shortcut, "action">[] = [
  { key: "k", ctrl: true, description: "Open search" },
  { key: "b", ctrl: true, description: "Toggle sidebar" },
  { key: "/", description: "Focus search" },
  { key: "?", shift: true, description: "Show keyboard shortcuts" },
  { key: "g", description: "Go to Dashboard (press twice)" },
  { key: "a", alt: true, description: "Go to Agents" },
  { key: "t", alt: true, description: "Go to Tasks" },
  { key: "c", alt: true, description: "Go to Crews" },
  { key: "f", alt: true, description: "Go to Flows" },
  { key: "e", alt: true, description: "Go to Executions" },
  { key: "s", alt: true, description: "Go to Settings" },
  { key: "Escape", description: "Close dialog/modal" },
];

export function useKeyboardShortcuts(
  onOpenSearch?: () => void,
  onOpenShortcuts?: () => void
) {
  const router = useRouter();
  const { toggleSidebar } = useUIStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape to blur the input
        if (event.key === "Escape") {
          target.blur();
        }
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      const alt = event.altKey;
      const shift = event.shiftKey;

      // Ctrl+K - Open search
      if (ctrl && event.key === "k") {
        event.preventDefault();
        onOpenSearch?.();
        return;
      }

      // Ctrl+B - Toggle sidebar
      if (ctrl && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // / - Focus search
      if (event.key === "/" && !ctrl && !alt && !shift) {
        event.preventDefault();
        onOpenSearch?.();
        return;
      }

      // Shift+? - Show shortcuts
      if (shift && event.key === "?") {
        event.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      // Alt+Key navigation shortcuts
      if (alt && !ctrl && !shift) {
        const routes: Record<string, string> = {
          a: "/agents",
          t: "/tasks",
          c: "/crews",
          f: "/flows",
          e: "/executions",
          s: "/settings",
          k: "/knowledge",
          m: "/marketplace",
        };

        const route = routes[event.key.toLowerCase()];
        if (route) {
          event.preventDefault();
          router.push(route);
          return;
        }
      }
    },
    [router, toggleSidebar, onOpenSearch, onOpenShortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function formatShortcut(shortcut: Omit<Shortcut, "action">): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push("⇧");
  }

  // Format special keys
  let key = shortcut.key;
  if (key === "Escape") key = "Esc";
  if (key === "/") key = "/";
  if (key === "?") key = "?";

  parts.push(key.toUpperCase());

  return parts.join(" + ");
}
