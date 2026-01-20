"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function CaseLawPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const caseLaws = [
    {
      title: "State v. Kumar",
      court: "HC Mumbai",
      year: 2023,
      verdict: "acquitted" as const,
      summary: "Defendant was found not guilty due to lack of evidence and procedural irregularities.",
      tags: ["Criminal", "Evidence"],
    },
    {
      title: "Sharma v. State",
      court: "Supreme Court",
      year: 2024,
      verdict: "convicted" as const,
      summary: "Conviction upheld for theft under BNS Sec 303. Sentenced to 5 years imprisonment.",
      tags: ["Criminal", "Theft"],
    },
    {
      title: "Union of India v. Patel",
      court: "Delhi HC",
      year: 2023,
      verdict: "mixed" as const,
      summary: "Partial relief granted. Matter remanded back to lower court for fresh consideration.",
      tags: ["Constitutional", "Administrative"],
    },
  ];

  const verdictColors = {
    acquitted: { dot: "bg-[#34A853]", badge: "bg-green-100 text-green-800" },
    convicted: { dot: "bg-[#EA4335]", badge: "bg-red-100 text-red-800" },
    mixed: { dot: "bg-[#FBBC04]", badge: "bg-yellow-100 text-yellow-800" },
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Case Law" },
        ]}
      />
      
      <div className="p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Case Law Database</h1>
            <p className="text-[#6B7280]">Browse and search recent court judgments</p>
          </div>

          {/* Search */}
          <form className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Search case laws..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pr-12 border-[#E2E8F0] focus:border-[#1A73E8] focus-visible:ring-[#1A73E8]"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 bg-[#1A73E8] hover:bg-[#1557B0]"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Case List */}
          <div className="space-y-4">
            {caseLaws.map((caselaw, index) => {
              const verdictStyle = verdictColors[caselaw.verdict];
              
              return (
                <Card key={index} className="shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 h-3 w-3 rounded-full ${verdictStyle.dot}`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-[#1A73E8] hover:underline cursor-pointer">
                              {caselaw.title}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {caselaw.court}, {caselaw.year}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="icon" className="text-[#1A73E8]">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#6B7280] mb-4">
                      {caselaw.summary}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={verdictStyle.badge}>
                        {caselaw.verdict.charAt(0).toUpperCase() + caselaw.verdict.slice(1)}
                      </Badge>
                      {caselaw.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[#6B7280]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
