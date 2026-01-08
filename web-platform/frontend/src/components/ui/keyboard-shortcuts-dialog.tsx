"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortcuts, formatShortcut } from "@/hooks/use-keyboard-shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  // Group shortcuts by category
  const navigationShortcuts = shortcuts.filter((s) =>
    s.description.startsWith("Go to")
  );
  const actionShortcuts = shortcuts.filter(
    (s) => !s.description.startsWith("Go to")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Shortcuts */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Actions
            </h3>
            <div className="space-y-2">
              {actionShortcuts.map((shortcut) => (
                <div
                  key={shortcut.key + (shortcut.ctrl ? "-ctrl" : "")}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {navigationShortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">
                    {shortcut.description.replace("Go to ", "")}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd>{" "}
            anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
