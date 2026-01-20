"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CitationBadge } from "@/components/research/CitationBadge";
import { CaseLawCard } from "@/components/research/CaseLawCard";
import { Send, ChevronDown, ChevronUp, Sparkles, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ParsedResponse {
  legalAnswer: string;
  statutes: string[];
  precedents: Array<{ title: string; date: string; link: string }>;
}

interface ConversationEntry {
  query: string;
  response: ParsedResponse;
  timestamp: Date;
}

export default function ResearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [newQuery, setNewQuery] = useState("");
  const [showRelevantLaws, setShowRelevantLaws] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ParsedResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);

  // Parse the structured response
  const parseResponse = (rawResponse: string): ParsedResponse => {
    const legalAnswerMatch = rawResponse.match(/<LEGAL_ANSWER>([\s\S]*?)<\/LEGAL_ANSWER>/);
    const citationsMatch = rawResponse.match(/<CITATIONS>([\s\S]*?)<\/CITATIONS>/);
    
    const legalAnswer = legalAnswerMatch ? legalAnswerMatch[1].trim() : rawResponse;
    const citationsText = citationsMatch ? citationsMatch[1].trim() : "";
    
    // Parse statutes - handle multiple formats: [Statutes], **Statutes**, ### Statutes
    const statuteSection = citationsText.match(/(?:\[Statutes\]|\*\*Statutes\*\*|###\s*Statutes)([\s\S]*?)(?=\[Precedents\]|\*\*Precedents\*\*|###\s*Precedents|$)/);
    const statutes = statuteSection 
      ? statuteSection[1].trim().split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : [];
    
    // Parse precedents - handle multiple formats: [Precedents], **Precedents**, ### Precedents
    const precedentSection = citationsText.match(/(?:\[Precedents\]|\*\*Precedents\*\*|###\s*Precedents)([\s\S]*?)$/);
    const precedents: Array<{ title: string; date: string; link: string }> = [];
    
    if (precedentSection) {
      const lines = precedentSection[1].trim().split('\n').filter(line => line.trim().startsWith('-'));
      lines.forEach(line => {
        const cleaned = line.replace(/^-\s*/, '').trim();
        const linkMatch = cleaned.match(/\[Read Judgment\]\((.*?)\)/);
        const dateMatch = cleaned.match(/\((\d{4})\)/);
        const titleMatch = cleaned.match(/^\*?(.*?)\*?\s*\(/);
        
        if (titleMatch) {
          precedents.push({
            title: titleMatch[1].trim().replace(/\*/g, ''),
            date: dateMatch ? dateMatch[1] : 'N/A',
            link: linkMatch ? linkMatch[1] : ''
          });
        }
      });
    }
    
    return { legalAnswer, statutes, precedents };
  };

  const fetchResearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch research");
      }

      const data = await res.json();
      const parsed = parseResponse(data.response);
      setResponse(parsed);
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        query: searchQuery,
        response: parsed,
        timestamp: new Date()
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchResearch(initialQuery);
    }
  }, [initialQuery]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuery.trim()) {
      setQuery(newQuery);
      fetchResearch(newQuery);
      setNewQuery("");
    }
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Research", href: "/research" },
        ]}
      />

      <div className="h-[calc(100vh-4rem)]">
        <div className="flex w-full h-full">
          {/* Main Content Area - Dynamic width */}
          <div className={`flex flex-col border-r border-[#E2E8F0] transition-all ${selectedMessageIndex !== null ? 'w-[60%]' : 'w-full'}`}>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6 pb-24">
                {/* Empty State */}
                {!loading && conversationHistory.length === 0 && !error && (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-[#E8F0FE] to-[#F1F5F9] rounded-xl p-8 max-w-lg mx-auto border border-[#E2E8F0]">
                      <div className="flex justify-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-[#4285F4] rounded-full"></div>
                        <div className="w-3 h-3 bg-[#34A853] rounded-full"></div>
                        <div className="w-3 h-3 bg-[#FBBC04] rounded-full"></div>
                        <div className="w-3 h-3 bg-[#EA4335] rounded-full"></div>
                      </div>
                      <p className="text-[#6B7280] text-lg mb-2">Start Your Legal Research</p>
                      <p className="text-[#9CA3AF]">Enter a query below to get AI-powered legal analysis with citations.</p>
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                {conversationHistory.map((entry, idx) => (
                  <div key={idx} className="space-y-4">
                    {/* User Query */}
                    <div className="flex justify-end">
                      <div className="bg-[#4285F4] text-white rounded-lg px-4 py-3 max-w-[80%] shadow-sm">
                        <p className="text-sm font-medium">{entry.query}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <Card className="shadow-lg border-l-4 border-l-[#4285F4]">
                      <CardHeader className="bg-gradient-to-r from-[#F8F9FA] to-white">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-[#1F2937]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4285F4]">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            Legal Analysis
                          </CardTitle>
                          {(entry.response.statutes.length > 0 || entry.response.precedents.length > 0) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMessageIndex(idx)}
                              className="flex items-center gap-2 border-[#4285F4] text-[#4285F4] hover:bg-[#E8F0FE]"
                            >
                              <Eye className="h-4 w-4" />
                              View References
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1 pt-1">
                        <div className="prose prose-sm max-w-none text-[#1F2937] leading-relaxed markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {entry.response.legalAnswer}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white rounded-full px-8 py-4 shadow-lg">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <p className="font-medium">Researching your query...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2] border-l-4 border-[#EA4335] text-[#B91C1C] px-6 py-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#EA4335] rounded-full"></div>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Input at Bottom of Main Area */}
            <div className="border-t border-[#E2E8F0] bg-white p-4">
              <form onSubmit={handleAsk} className="relative">
                <Input
                  type="text"
                  placeholder="Ask a legal research question..."
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  className="h-12 pr-12 border-[#E2E8F0] focus:border-[#1A73E8] focus-visible:ring-[#1A73E8]"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 bg-[#1A73E8] hover:bg-[#1557B0]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* References Sidebar - 40% - Only shown when message is selected */}
          {selectedMessageIndex !== null && conversationHistory[selectedMessageIndex] && (
            <div className="w-[40%] bg-gradient-to-br from-[#F8F9FA] to-[#F1F5F9]">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FBBC04] rounded-full"></div>
                      <h3 className="text-lg font-semibold text-[#1F2937]">References</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMessageIndex(null)}
                      className="text-[#6B7280] hover:text-[#1F2937]"
                    >
                      Close
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Statutes */}
                    {conversationHistory[selectedMessageIndex].response.statutes.length > 0 && (
                      <Card className="shadow-sm border-l-4 border-l-[#4285F4]">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#4285F4] rounded-full"></div>
                            Statutes Referenced
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {conversationHistory[selectedMessageIndex].response.statutes.map((statute, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-[#E2E8F0]">
                                <p className="text-[#1F2937] font-medium">{statute}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Precedents */}
                    {conversationHistory[selectedMessageIndex].response.precedents.length > 0 && (
                      <Card className="shadow-sm border-l-4 border-l-[#FBBC04]">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#FBBC04] rounded-full"></div>
                            Related Cases
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {conversationHistory[selectedMessageIndex].response.precedents.map((precedent, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-[#E2E8F0] hover:shadow-md transition-all">
                                <h5 className="font-semibold text-[#1F2937] text-sm mb-2">{precedent.title}</h5>
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <Badge variant="outline" className="text-[#6B7280]">
                                    {precedent.date}
                                  </Badge>
                                  {precedent.link && (
                                    <a
                                      href={precedent.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#4285F4] hover:text-[#3367D6] font-medium"
                                    >
                                      Read →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {conversationHistory[selectedMessageIndex].response.statutes.length === 0 && conversationHistory[selectedMessageIndex].response.precedents.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-[#9CA3AF] text-sm">No citations found in this response</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
