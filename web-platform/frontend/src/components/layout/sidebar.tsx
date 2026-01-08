"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Layers,
  GitBranch,
  Wrench,
  Play,
  Zap,
  Store,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Crews", href: "/crews", icon: Layers },
  { name: "Flows", href: "/flows", icon: GitBranch },
  { name: "Tools", href: "/tools", icon: Wrench },
  { name: "Knowledge", href: "/knowledge", icon: Database },
  { name: "Executions", href: "/executions", icon: Play },
  { name: "Triggers", href: "/triggers", icon: Zap },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, mobileMenuOpen, toggleSidebar, setMobileMenuOpen } = useUIStore();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [setMobileMenuOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r bg-card transition-all duration-300",
          // Desktop: controlled by sidebarOpen
          "hidden md:block",
          sidebarOpen ? "md:w-64" : "md:w-16",
          // Mobile: controlled by mobileMenuOpen
          mobileMenuOpen && "block w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {(sidebarOpen || mobileMenuOpen) && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  C
                </div>
                <span className="font-semibold">CrewAI</span>
              </Link>
            )}
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn("hidden md:flex", !sidebarOpen && "mx-auto")}
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const showLabel = sidebarOpen || mobileMenuOpen;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !showLabel && "justify-center px-2"
                  )}
                  title={!showLabel ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {showLabel && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !(sidebarOpen || mobileMenuOpen) && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {(sidebarOpen || mobileMenuOpen) && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
