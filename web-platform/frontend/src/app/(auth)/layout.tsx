"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8" />
          <span className="text-2xl font-bold">CrewAI Platform</span>
        </div>
        <div>
          <blockquote className="text-lg">
            "Build, deploy, and manage AI agent crews with ease. The most
            powerful platform for orchestrating autonomous AI agents."
          </blockquote>
          <footer className="mt-4 text-sm opacity-80">
            Powered by CrewAI
          </footer>
        </div>
        <div className="text-sm opacity-60">
          &copy; {new Date().getFullYear()} CrewAI Platform. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CrewAI Platform</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
