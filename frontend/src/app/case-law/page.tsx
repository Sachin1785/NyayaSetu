"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface CaseLaw {
  id: number;
  title: string;
  court: string;
  date: string;
  cite_count: number;
  link: string;
}

export default function CaseLawPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [caseLaws, setCaseLaws] = useState<CaseLaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter states
  const [courtFilter, setCourtFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  const searchCases = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch("http://localhost:8000/case-law/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          court: courtFilter || null,
          from_date: fromDate || null,
          to_date: toDate || null,
          sort_by: sortBy,
          max_results: 20,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to search cases");
      }

      const data = await response.json();
      setCaseLaws(data.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCaseLaws([]);
    } finally {
      setLoading(false);
    }
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

          {/* Filters */}
          <div className="bg-[#F9FAFB] border border-[#E2E8F0] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B7280]">Court</label>
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm focus:border-[#1A73E8] focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                >
                  <option value="">All Courts</option>
                  <option value="supremecourt">Supreme Court</option>
                  <option value="highcourts">High Courts</option>
                  <option value="tribunals">Tribunals</option>
                  <option value="supremecourtofindiaservicematters">SC Service Matters</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B7280]">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 border-[#E2E8F0] focus:border-[#1A73E8]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B7280]">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 border-[#E2E8F0] focus:border-[#1A73E8]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B7280]">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#E2E8F0] bg-white text-sm focus:border-[#1A73E8] focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Most Recent</option>
                  <option value="citations">Most Cited</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={searchCases} className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Search case laws... (e.g., 'murder', 'Section 302 IPC', 'defamation')"  
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pr-12 border-[#E2E8F0] focus:border-[#1A73E8] focus-visible:ring-[#1A73E8]"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading}
              className="absolute right-1 top-1 h-10 w-10 bg-[#1A73E8] hover:bg-[#1557B0]"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-2xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-[#6B7280]">Searching case laws...</p>
            </div>
          )}

          {/* Case List */}
          {!loading && hasSearched && caseLaws.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#6B7280]">No cases found. Try a different search query.</p>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="text-center py-12">
              <p className="text-[#6B7280]">Enter a search query to find relevant case laws from Indian Kanoon database.</p>
            </div>
          )}

          {!loading && caseLaws.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-[#6B7280]">Found {caseLaws.length} cases</p>
              {caseLaws.map((caselaw) => (
                <Card key={caselaw.id} className="shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-[#1A73E8] hover:underline cursor-pointer">
                              <a href={caselaw.link} target="_blank" rel="noopener noreferrer">
                                {caselaw.title}
                              </a>
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {caselaw.court} • {caselaw.date}
                            </CardDescription>
                          </div>
                          <a
                            href={caselaw.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="text-[#1A73E8]">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[#6B7280]">
                        ID: {caselaw.id}
                      </Badge>
                      <Badge variant="outline" className="text-[#6B7280]">
                        {caselaw.cite_count} citations
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
