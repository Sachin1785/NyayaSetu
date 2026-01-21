"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";

// Utility to strip HTML tags from a string
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

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
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#4285F4] to-[#34A853] p-8 text-white">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3">Case Law Search</h1>
              {/* <p className="text-blue-100 text-lg">Browse and search recent court judgments from Indian Kanoon</p> */}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FBBC04]/20 rounded-full translate-y-8 -translate-x-8"></div>
          </div>

          {/* Search - moved up and more prominent */}
          <div className="relative">
            <form onSubmit={searchCases} className="relative max-w-3xl mx-auto">
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Search case laws... (e.g., 'murder', 'Section 302 IPC', 'defamation')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-6 pr-16 text-lg border-2 border-[#E2E8F0] focus:border-[#4285F4] focus-visible:ring-[#4285F4] rounded-full shadow-lg group-hover:shadow-xl transition-all"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading}
                  className="absolute right-2 top-2 h-10 w-10 bg-[#4285F4] hover:bg-[#3367D6] rounded-full shadow-md"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

{/* Compact Filters */}
          <div className="bg-gradient-to-r from-[#F8F9FA] to-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FBBC04] rounded-full"></div>
                Filters
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <div className="w-2 h-2 bg-[#4285F4] rounded-full"></div>
                  <span>Court</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <div className="w-2 h-2 bg-[#34A853] rounded-full"></div>
                  <span>Date Range</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <div className="w-2 h-2 bg-[#EA4335] rounded-full"></div>
                  <span>Sort</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#4285F4]">Court</label>
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:border-[#4285F4] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                >
                  <option value="">All Courts</option>
                  <option value="supremecourt">Supreme Court</option>
                  <option value="highcourts">High Courts</option>
                  <option value="tribunals">Tribunals</option>
                  <option value="supremecourtofindiaservicematters">SC Service Matters</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#34A853]">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 border-[#E2E8F0] focus:border-[#34A853] focus:ring-[#34A853]/20 rounded-lg transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#34A853]">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 border-[#E2E8F0] focus:border-[#34A853] focus:ring-[#34A853]/20 rounded-lg transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#EA4335]">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm focus:border-[#EA4335] focus:outline-none focus:ring-2 focus:ring-[#EA4335]/20 transition-all"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Most Recent</option>
                  <option value="citations">Most Cited</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2] border-l-4 border-[#EA4335] text-[#B91C1C] px-6 py-4 rounded-lg shadow-sm max-w-3xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#EA4335] rounded-full"></div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-lg border border-[#E2E8F0]">
                <div className="animate-spin">
                  <div className="w-6 h-6 border-3 border-[#4285F4] border-t-transparent rounded-full"></div>
                </div>
                <p className="text-[#4285F4] font-medium">Searching case laws...</p>
              </div>
            </div>
          )}

          {/* Case List */}
          {!loading && hasSearched && caseLaws.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-[#F8F9FA] to-[#E8F0FE] rounded-xl p-8 max-w-md mx-auto border border-[#E2E8F0]">
                <div className="w-16 h-16 bg-[#FBBC04] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <p className="text-[#6B7280] text-lg">No cases found. Try a different search query.</p>
              </div>
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-[#E8F0FE] to-[#F1F5F9] rounded-xl p-8 max-w-lg mx-auto border border-[#E2E8F0]">
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-[#4285F4] rounded-full"></div>
                  <div className="w-3 h-3 bg-[#34A853] rounded-full"></div>
                  <div className="w-3 h-3 bg-[#FBBC04] rounded-full"></div>
                  <div className="w-3 h-3 bg-[#EA4335] rounded-full"></div>
                </div>
                <p className="text-[#6B7280] text-lg mb-2">Welcome to Case Law Search</p>
                <p className="text-[#9CA3AF]">Enter a search query to find relevant case laws from Indian Kanoon database.</p>
              </div>
            </div>
          )}

          {!loading && caseLaws.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[#6B7280] font-medium">Found {caseLaws.length} cases</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#34A853] rounded-full"></div>
                  <span className="text-sm text-[#6B7280]">Active results</span>
                </div>
              </div>
              {caseLaws.map((caselaw, index) => (
                <Card key={caselaw.id} className="shadow-sm hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#4285F4] hover:border-l-[#34A853] bg-gradient-to-r from-white to-[#FAFBFF]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-[#4285F4] hover:text-[#3367D6] transition-colors">
                              <a href={caselaw.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {stripHtml(caselaw.title)}
                              </a>
                            </CardTitle>
                            <CardDescription className="text-sm mt-2 flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[#34A853]" />
                              <span className="text-[#6B7280]">{caselaw.court}</span>
                              <span className="text-[#9CA3AF]">•</span>
                              <span className="text-[#6B7280]">{caselaw.date}</span>
                            </CardDescription>
                          </div>
                          <a
                            href={caselaw.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <Button variant="ghost" size="icon" className="text-[#4285F4] hover:text-[#3367D6] hover:bg-[#E8F0FE] transition-all">
                              <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[#6B7280] border-[#E2E8F0] bg-[#F8F9FA]">
                        <span className="text-[#FBBC04] mr-1">#</span>
                        {caselaw.id}
                      </Badge>
                      <Badge variant="outline" className="text-[#34A853] border-[#34A853]/20 bg-[#34A853]/5">
                        <span className="mr-1">📊</span>
                        {caselaw.cite_count} citations
                      </Badge>
                      {index < 3 && (
                        <Badge className="bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white text-xs">
                          Top Result
                        </Badge>
                      )}
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
