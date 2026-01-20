"use client";

import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface CitationBadgeProps {
  citation: string;
  fullText: string;
}

export function CitationBadge({ citation, fullText }: CitationBadgeProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant="default"
          className="cursor-pointer bg-blue-100 text-[#1A73E8] hover:bg-blue-200 border-0"
        >
          {citation}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#1F2937]">{citation}</h4>
          <p className="text-sm text-[#6B7280]">{fullText}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
