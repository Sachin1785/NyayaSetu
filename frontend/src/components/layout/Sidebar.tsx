"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scale, FileText, Gavel, Settings, User, X, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Research", href: "/research", icon: Scale },
  { name: "Comparator", href: "/comparator", icon: GitCompare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Case Law", href: "/case-law", icon: Gavel },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-60 border-r border-[#E2E8F0] bg-white transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-6">
            <div className="flex items-center">
              <Scale className="mr-3 h-6 w-6 text-[#1A73E8]" />
              <span className="text-xl font-bold">
                <span className="text-[#1A73E8]">Nyaya</span>
                <span className="text-[#EA4335]">S</span>
                <span className="text-[#FBBC04]">e</span>
                <span className="text-[#34A853]">t</span>
                <span className="text-[#1A73E8]">u</span>
              </span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onMobileClose}
              className="lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-50 text-[#1A73E8]"
                      : "text-[#6B7280] hover:bg-gray-50 hover:text-[#1F2937]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Avatar */}
          <div className="border-t border-[#E2E8F0] p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A73E8] text-white">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#1F2937]">User Name</div>
                <div className="text-xs text-[#6B7280]">user@example.com</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
