"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

// Simple resizable implementation without external dependencies
const ResizablePanelGroup = ({
  direction = "horizontal",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: "horizontal" | "vertical"
}) => (
  <div
    className={cn(
      "flex h-full w-full",
      direction === "vertical" ? "flex-col" : "flex-row",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const ResizablePanel = ({
  defaultSize,
  minSize,
  maxSize,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}) => (
  <div
    className={cn("flex-1", className)}
    style={{ flex: defaultSize ? `${defaultSize} 1 0%` : undefined }}
    {...props}
  >
    {children}
  </div>
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  withHandle?: boolean
}) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-[#E2E8F0]",
      "hover:bg-[#1A73E8] transition-colors cursor-col-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-[#E2E8F0]">
        <GripVertical className="h-2.5 w-2.5 text-[#6B7280]" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
