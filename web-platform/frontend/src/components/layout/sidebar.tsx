"use client";

import { useEffect, memo, useCallback } from "react";
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
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Bảng điều khiển", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tác nhân", href: "/agents", icon: Users },
  { name: "Nhiệm vụ", href: "/tasks", icon: ListTodo },
  { name: "Đội nhóm", href: "/crews", icon: Layers },
  { name: "Quy trình", href: "/flows", icon: GitBranch },
  { name: "Công cụ", href: "/tools", icon: Wrench },
  { name: "Kiến thức", href: "/knowledge", icon: Database },
  { name: "Thực thi", href: "/executions", icon: Play },
  { name: "Kích hoạt", href: "/triggers", icon: Zap },
  { name: "Chợ ứng dụng", href: "/marketplace", icon: Store },
  { name: "Cài đặt", href: "/settings", icon: Settings },
] as const;

// Memoized navigation item to prevent re-renders
const NavItem = memo(function NavItem({
  name,
  href,
  icon: Icon,
  isActive,
  showLabel,
}: {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  showLabel: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        !showLabel && "justify-center px-2"
      )}
      title={!showLabel ? name : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {showLabel && <span>{name}</span>}
    </Link>
  );
});

function SidebarComponent() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const mobileMenuOpen = useUIStore((state) => state.mobileMenuOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setMobileMenuOpen = useUIStore((state) => state.setMobileMenuOpen);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeMobileMenu]);

  const showLabel = sidebarOpen || mobileMenuOpen;

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
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
            {showLabel && (
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
              onClick={closeMobileMenu}
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
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
                showLabel={showLabel}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !showLabel && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {showLabel && <span>Đăng xuất</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);
