"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ComparisonData {
  ipc: {
    title: string;
    content: string;
    deletions: string[];
  };
  bns: {
    title: string;
    content: string;
    additions: string[];
  };
}

export function ComparatorView() {
  const [viewMode, setViewMode] = useState("badges");

  // Sample data - replace with actual data
  const comparisonData: ComparisonData = {
    ipc: {
      title: "IPC - Old",
      content: "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
      deletions: ["shamans or minor"],
    },
    bns: {
      title: "BNS - New",
      content: "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
      additions: ["and shall also be liable to fine"],
    },
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] p-4">
        <h2 className="text-xl font-semibold text-[#1F2937] mb-3">IPC vs BNS Comparison</h2>
        
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="badher">Badher</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Split Comparison */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* IPC - Old (Left Panel) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto">
              <Card className="m-4 border-t-4 border-t-[#EA4335] shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#1F2937]">{comparisonData.ipc.title}</h3>
                    <Badge variant="destructive" className="bg-[#EA4335]">Old</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[#1F2937] leading-relaxed">
                      Whoever commits murder shall be punished with{" "}
                      <span className="bg-red-100 text-red-700 line-through px-1">
                        death, shamans or minor
                      </span>{" "}
                      in case ending alfius or processins, whoever commits murder shall be deathed
                      in murder and non-deathement or punished with...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* BNS - New (Right Panel) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto">
              <Card className="m-4 border-t-4 border-t-[#34A853] shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#1F2937]">{comparisonData.bns.title}</h3>
                    <Badge className="bg-[#34A853] hover:bg-[#2D8F46]">New</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[#1F2937] leading-relaxed">
                      Whoever commits murder shall be punished with{" "}
                      <span className="bg-green-100 text-green-700 px-1">
                        death or imprisonment for life, and shall also be liable to fine
                      </span>
                      .
                    </p>
                    
                    <div className="mt-6 rounded-lg bg-green-50 p-4">
                      <h4 className="text-sm font-semibold text-[#34A853] mb-2">Key Additions</h4>
                      <ul className="list-disc list-inside text-sm text-[#6B7280] space-y-1">
                        <li>Clarified punishment structure</li>
                        <li>Added fine provisions</li>
                        <li>Removed archaic terminology</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
