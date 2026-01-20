"use client";

import { ChevronRight, User, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onMenuClick?: () => void;
}

export function Header({ breadcrumbs, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-8">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-2 h-4 w-4 text-[#6B7280]" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[#1A73E8] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#6B7280] truncate max-w-[200px] md:max-w-none">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Avatar */}
      <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1A73E8] text-white hover:bg-[#1557B0] transition-colors">
        <User className="h-5 w-5" />
      </div>
    </header>
  );
}
