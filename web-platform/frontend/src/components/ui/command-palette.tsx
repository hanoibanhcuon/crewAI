"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  ListTodo,
  Users,
  GitBranch,
  Wrench,
  Database,
  Play,
  Zap,
  Store,
  Settings,
  Plus,
  ArrowRight,
  Keyboard,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  category: "navigation" | "actions" | "settings";
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "dashboard",
      title: "Go to Dashboard",
      icon: Search,
      action: () => navigate("/"),
      category: "navigation",
      keywords: ["home", "overview"],
    },
    {
      id: "agents",
      title: "Go to Agents",
      icon: User,
      action: () => navigate("/agents"),
      category: "navigation",
      keywords: ["ai", "assistant"],
    },
    {
      id: "tasks",
      title: "Go to Tasks",
      icon: ListTodo,
      action: () => navigate("/tasks"),
      category: "navigation",
    },
    {
      id: "crews",
      title: "Go to Crews",
      icon: Users,
      action: () => navigate("/crews"),
      category: "navigation",
      keywords: ["team", "group"],
    },
    {
      id: "flows",
      title: "Go to Flows",
      icon: GitBranch,
      action: () => navigate("/flows"),
      category: "navigation",
      keywords: ["workflow", "pipeline"],
    },
    {
      id: "tools",
      title: "Go to Tools",
      icon: Wrench,
      action: () => navigate("/tools"),
      category: "navigation",
    },
    {
      id: "knowledge",
      title: "Go to Knowledge",
      icon: Database,
      action: () => navigate("/knowledge"),
      category: "navigation",
      keywords: ["documents", "files", "rag"],
    },
    {
      id: "executions",
      title: "Go to Executions",
      icon: Play,
      action: () => navigate("/executions"),
      category: "navigation",
      keywords: ["runs", "history"],
    },
    {
      id: "triggers",
      title: "Go to Triggers",
      icon: Zap,
      action: () => navigate("/triggers"),
      category: "navigation",
      keywords: ["webhooks", "schedule", "automation"],
    },
    {
      id: "marketplace",
      title: "Go to Marketplace",
      icon: Store,
      action: () => navigate("/marketplace"),
      category: "navigation",
      keywords: ["templates", "store"],
    },
    {
      id: "settings",
      title: "Go to Settings",
      icon: Settings,
      action: () => navigate("/settings"),
      category: "navigation",
      keywords: ["preferences", "profile", "api keys"],
    },
    // Actions
    {
      id: "new-agent",
      title: "Create New Agent",
      icon: Plus,
      action: () => navigate("/agents/new"),
      category: "actions",
    },
    {
      id: "new-task",
      title: "Create New Task",
      icon: Plus,
      action: () => navigate("/tasks/new"),
      category: "actions",
    },
    {
      id: "new-crew",
      title: "Create New Crew",
      icon: Plus,
      action: () => navigate("/crews/new"),
      category: "actions",
    },
    {
      id: "new-flow",
      title: "Create New Flow",
      icon: Plus,
      action: () => navigate("/flows/new/edit"),
      category: "actions",
    },
    {
      id: "new-tool",
      title: "Create New Tool",
      icon: Plus,
      action: () => navigate("/tools/new"),
      category: "actions",
    },
    // Settings
    {
      id: "keyboard-shortcuts",
      title: "Keyboard Shortcuts",
      subtitle: "View all shortcuts",
      icon: Keyboard,
      action: () => {
        onOpenChange(false);
        onShowShortcuts?.();
      },
      category: "settings",
    },
    {
      id: "toggle-theme",
      title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: theme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        onOpenChange(false);
      },
      category: "settings",
      keywords: ["theme", "dark", "light"],
    },
    {
      id: "logout",
      title: "Log Out",
      icon: LogOut,
      action: () => {
        localStorage.removeItem("access_token");
        router.push("/login");
        onOpenChange(false);
      },
      category: "settings",
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  const groupedCommands = {
    navigation: filteredCommands.filter((c) => c.category === "navigation"),
    actions: filteredCommands.filter((c) => c.category === "actions"),
    settings: filteredCommands.filter((c) => c.category === "settings"),
  };

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      }
    },
    [filteredCommands, selectedIndex]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <>
              {groupedCommands.navigation.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Navigation
                  </div>
                  {groupedCommands.navigation.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <CommandItemRow
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === globalIdx}
                        onSelect={() => cmd.action()}
                        onHover={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {groupedCommands.actions.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Quick Actions
                  </div>
                  {groupedCommands.actions.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <CommandItemRow
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === globalIdx}
                        onSelect={() => cmd.action()}
                        onHover={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {groupedCommands.settings.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Settings
                  </div>
                  {groupedCommands.settings.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <CommandItemRow
                        key={cmd.id}
                        command={cmd}
                        isSelected={selectedIndex === globalIdx}
                        onSelect={() => cmd.action()}
                        onHover={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandItemRow({
  command,
  isSelected,
  onSelect,
  onHover,
}: {
  command: CommandItem;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const Icon = command.icon;

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      )}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 text-left">
        <div className="font-medium">{command.title}</div>
        {command.subtitle && (
          <div
            className={cn(
              "text-xs",
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {command.subtitle}
          </div>
        )}
      </div>
      <ArrowRight
        className={cn(
          "h-4 w-4 shrink-0 opacity-0 transition-opacity",
          isSelected && "opacity-100"
        )}
      />
    </button>
  );
}
