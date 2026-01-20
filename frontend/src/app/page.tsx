"use client";

import { Search, Scale, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/research?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickActions = [
    {
      title: "Compare Laws",
      description: "Side-by-side comparison of IPC vs BNS",
      icon: Scale,
      color: "green",
      href: "/comparator",
    },
    {
      title: "Analyze Document",
      description: "Upload and analyze legal documents",
      icon: FileText,
      color: "blue",
      href: "/documents",
    },
    {
      title: "Recent Judgments",
      description: "Browse latest court decisions",
      icon: Building2,
      color: "red",
      href: "/case-law",
    },
  ];

  const colorClasses = {
    green: "border-t-[#34A853]",
    blue: "border-t-[#1A73E8]",
    red: "border-t-[#EA4335]",
  };

  return (
    <>
      <Header breadcrumbs={[{ label: "Home" }]} />
      
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        {/* Hero Search Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-8 md:py-16">
          <div className="w-full max-w-3xl space-y-8 md:space-y-12">
            {/* Logo and Tagline */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-[#1A73E8]">Nyaya</span>
                <span className="text-[#EA4335]">S</span>
                <span className="text-[#FBBC04]">e</span>
                <span className="text-[#34A853]">t</span>
                <span className="text-[#1A73E8]">u</span>
              </h1>
              <p className="text-base md:text-lg text-[#6B7280]">
                AI-powered legal research for Indian law
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Ask a legal question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 md:h-14 rounded-full border-[#E2E8F0] pl-6 pr-12 md:pr-14 text-sm md:text-base shadow-google transition-all focus:shadow-google-hover focus:border-[#1A73E8] focus-visible:ring-[#1A73E8]"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1.5 md:top-2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#1A73E8] hover:bg-[#1557B0]"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </form>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className={`cursor-pointer border-t-4 ${colorClasses[action.color as keyof typeof colorClasses]} shadow-sm transition-all hover:shadow-google-hover hover-lift`}
                    onClick={() => router.push(action.href)}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
                        <Icon className="h-6 w-6 text-[#1F2937]" />
                      </div>
                      <CardTitle className="text-base md:text-lg">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-[#6B7280]">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="border-t border-[#E2E8F0] bg-gray-50 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-[#1A73E8]">10,000+</div>
                <div className="text-xs md:text-sm text-[#6B7280]">Legal Documents</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-[#34A853]">5,000+</div>
                <div className="text-xs md:text-sm text-[#6B7280]">Case Laws</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-[#EA4335]">AI-Powered</div>
                <div className="text-xs md:text-sm text-[#6B7280]">Research Assistant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


