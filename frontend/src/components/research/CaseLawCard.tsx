"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface CaseLawCardProps {
  title: string;
  court: string;
  year: number;
  verdict: "acquitted" | "convicted" | "mixed";
  summary: string;
  onViewCase: () => void;
}

export function CaseLawCard({ title, court, year, verdict, summary, onViewCase }: CaseLawCardProps) {
  const verdictColors = {
    acquitted: { dot: "bg-[#34A853]", text: "text-[#34A853]", label: "Acquitted" },
    convicted: { dot: "bg-[#EA4335]", text: "text-[#EA4335]", label: "Convicted" },
    mixed: { dot: "bg-[#FBBC04]", text: "text-[#FBBC04]", label: "Mixed" },
  };

  const verdictStyle = verdictColors[verdict];

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <div className={`mt-1 h-3 w-3 rounded-full ${verdictStyle.dot}`} />
          <div className="flex-1">
            <CardTitle className="text-base">
              <button
                onClick={onViewCase}
                className="text-[#1A73E8] hover:underline text-left"
              >
                {title}
              </button>
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {court}, {year}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">
          {summary}
        </p>
        <Badge variant="outline" className={`${verdictStyle.text} border-current`}>
          {verdictStyle.label}
        </Badge>
      </CardContent>
    </Card>
  );
}
