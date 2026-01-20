"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PrimaryNode {
  id: string;
  text_clean: string;
}

interface RelatedNode {
  id: string;
  text_clean: string;
  heading?: string;
}

interface Analysis {
  summary: string;
  changes: string[];
}

interface ComparisonData {
  primary: PrimaryNode;
  related: RelatedNode[];
  analysis: Analysis;
}

export function ComparatorView() {
  const [viewMode, setViewMode] = useState("badges");
  const [lawType, setLawType] = useState<"IPC" | "BNS">("IPC");
  const [section, setSection] = useState("");
  const [subsection, setSubsection] = useState("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    if (!section.trim()) {
      setError("Please enter a section number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          law_type: lawType,
          section: section.trim(),
          subsection: subsection.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch comparison");
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] p-4">
        <h2 className="text-xl font-semibold text-[#1F2937] mb-4">IPC vs BNS Comparison</h2>
        
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="lawType">Law Type</Label>
            <Tabs value={lawType} onValueChange={(val) => setLawType(val as "IPC" | "BNS")}> 
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="IPC">IPC</TabsTrigger>
                <TabsTrigger value="BNS">BNS</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              placeholder="e.g., 302, 420"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>

          {lawType === "BNS" && (
            <div className="space-y-2">
              <Label htmlFor="subsection">Subsection (Optional)</Label>
              <Input
                id="subsection"
                placeholder="e.g., 1, a"
                value={subsection}
                onChange={(e) => setSubsection(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button 
              onClick={fetchComparison} 
              disabled={loading}
              className="w-full bg-[#4285F4] hover:bg-[#3367D6]"
            >
              {loading ? "Loading..." : "Compare"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Analysis on top, centered */}
      {comparisonData && (
        <div className="flex flex-col items-center justify-center w-full mt-6">
          <div className="w-full px-4">
            <Card className="border-t-4 border-t-[#FBBC04] shadow-sm w-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#1F2937] mb-4 text-center">Analysis</h3>
                <div className="space-y-4">
                  <div>
                    {/* <h4 className="text-sm font-semibold text-[#6B7280] mb-2 text-center">Summary</h4> */}
                    <p className="text-[#1F2937] leading-relaxed text-left px-2">
                      {comparisonData.analysis.summary}
                    </p>
                  </div>
                  {comparisonData.analysis.changes && comparisonData.analysis.changes.length > 0 && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-4">
                      <h4 className="text-sm font-semibold text-[#FBBC04] mb-2">Key Changes</h4>
                      <ul className="list-disc list-inside text-sm text-[#6B7280] space-y-1">
                        {comparisonData.analysis.changes.map((change, idx) => (
                          <li key={idx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Split Comparison below analysis */}
      <div className="flex-1 overflow-hidden mt-4">
        {!comparisonData && !loading && (
          <div className="flex items-center justify-center h-full text-[#6B7280]">
            <p>Enter a section number and click Compare to view comparison</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full text-[#6B7280]">
            <p>Loading comparison...</p>
          </div>
        )}

        {comparisonData && (
          <ResizablePanelGroup direction="horizontal">
            {/* Primary Law (Left Panel) */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto">
                <Card className="m-4 border-t-4 border-t-[#4285F4] shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1F2937]">
                        {comparisonData.primary.id}
                      </h3>
                      <Badge className="bg-[#4285F4]">Primary</Badge>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                        {comparisonData.primary.text_clean}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Related Laws (Right Panel) */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto">
                {comparisonData.related.map((node, index) => (
                  <Card key={index} className="m-4 border-t-4 border-t-[#34A853] shadow-sm">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#1F2937]">
                          {node.id}
                        </h3>
                        <Badge className="bg-[#34A853] hover:bg-[#2D8F46]">Related</Badge>
                      </div>
                      {node.heading && (
                        <div className="mb-3">
                          <Badge variant="outline" className="text-xs">
                            {node.heading}
                          </Badge>
                        </div>
                      )}
                      <div className="space-y-4">
                        <p className="text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                          {node.text_clean}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
