"use client";

import { useState } from "react";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AuthGuard } from "@/components/auth";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(
    undefined, // onOpenSearch - could be implemented later
    () => setShowShortcuts(true)
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header title={title}>{actions}</Header>
        <main
          className={cn(
            "min-h-screen pt-16 transition-all duration-300",
            // Desktop: adjust for sidebar
            sidebarOpen ? "md:pl-64" : "md:pl-16",
            // Mobile: no left padding (sidebar is overlay)
            "pl-0"
          )}
        >
          <div className="p-4 md:p-6">{children}</div>
        </main>

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog
          open={showShortcuts}
          onOpenChange={setShowShortcuts}
        />
      </div>
    </AuthGuard>
  );
}
