"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CitationBadge } from "@/components/research/CitationBadge";
import { CaseLawCard } from "@/components/research/CaseLawCard";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [showRelevantLaws, setShowRelevantLaws] = useState(true);

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle follow-up question
    console.log("Follow-up:", followUpQuery);
    setFollowUpQuery("");
  };

  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Research", href: "/research" },
          { label: `Query: ${query}` },
        ]}
      />

      <div className="h-[calc(100vh-4rem)]">
        {/* Research Chat */}
        <div className="flex w-full flex-col h-full">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 pb-24">
              {/* Summary Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#1F2937]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <span className="text-sm font-bold text-[#1A73E8]">✓</span>
                    </div>
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#1F2937] leading-relaxed">
                    Whoever intending to take dishonestly, the new laws if the value is small? 
                    meanest to the punishment for theft under and laccined and! enoloments for punishment{" "}
                    <CitationBadge
                      citation="BNS Sec 303(2)"
                      fullText="Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property, commits theft."
                    />
                    .
                  </p>
                </CardContent>
              </Card>

              {/* Relevant Laws */}
              <Card className="shadow-sm">
                <CardHeader>
                  <button
                    onClick={() => setShowRelevantLaws(!showRelevantLaws)}
                    className="flex w-full items-center justify-between"
                  >
                    <CardTitle className="text-[#1F2937]">Relevant Laws</CardTitle>
                    {showRelevantLaws ? (
                      <ChevronUp className="h-5 w-5 text-[#6B7280]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#6B7280]" />
                    )}
                  </button>
                </CardHeader>
                {showRelevantLaws && (
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1A73E8]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CitationBadge
                              citation="BNS Sec 303(2)"
                              fullText="Whoever, intending to take dishonestly any movable property..."
                            />
                            <span className="text-sm text-[#6B7280]">
                              : Whoever, intending to take a punishment new law in
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="destructive" className="text-xs">NON-BAILABLE</Badge>
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs">
                              COGNIZABLE
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1A73E8]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CitationBadge
                              citation="BNS Sec 303(3)"
                              fullText="Whoever, dishonestly, shall be punished with thalt..."
                            />
                            <span className="text-sm text-[#6B7280]">
                              : Whoever, dishonestly, shall be punished with thalt
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                              BAILABLE
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1A73E8]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CitationBadge
                              citation="BNS Sec 303(3)"
                              fullText="Another relevant provision of the BNS..."
                            />
                            <span className="text-sm text-[#6B7280]">
                              : In severe et an imprisonment
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Analysis Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#1F2937]">Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold text-[#1F2937]">
                      Form a more serious theft form, conviction of theft viaim inured and or emissary possessions:
                    </h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      such se other a theft form,{" "}
                      <span className="font-medium text-[#1F2937]">Non-Bailable</span>{" "}
                      in sevenitare a serious croclle the genëral bettion.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#1F2937]">Situations of clenvant:</h4>
                    <ul className="space-y-2 text-sm text-[#6B7280]">
                      <li className="flex items-start gap-2">
                        <CitationBadge citation="IPC Sec 379 (Repealed)" fullText="Intending shall be punished with imprisonment..." />
                        <span>: intending shall be punished with imprisonment and intent laws leme for this so unpaoced.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CitationBadge citation="IPC Sec 379 (Repealed)" fullText="I moriyent temporary possession..." />
                        <span>: I moriyent temporary possession, shall imprisonment with</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Fixed Input at Bottom */}
          <div className="border-t border-[#E2E8F0] bg-white p-4">
            <form onSubmit={handleFollowUp} className="relative">
              <Input
                type="text"
                placeholder="Ask follow-up question..."
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
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
      </div>
    </>
  );
}
