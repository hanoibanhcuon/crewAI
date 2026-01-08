"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, setAuth, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      // Check if we have a token in localStorage
      const token = localStorage.getItem("access_token");

      if (!token) {
        // No token, redirect to login
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // If we have user in state and token, we're authenticated
      if (isAuthenticated && user) {
        setIsVerified(true);
        setIsLoading(false);
        return;
      }

      // Verify the token with the server
      try {
        const response = await authApi.me();
        setAuth(response.data, token);
        setIsVerified(true);
      } catch (error) {
        // Token is invalid, clear auth state and redirect
        logout();
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, user, pathname, router, setAuth, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return null;
  }

  return <>{children}</>;
}
