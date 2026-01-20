"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, FolderOpen } from "lucide-react";

export default function DocumentsPage() {
  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Documents" },
        ]}
      />
      
      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-[#1F2937] mb-6">Document Analysis</h1>
          
          {/* Upload Section */}
          <Card className="mb-8 border-2 border-dashed border-[#E2E8F0] shadow-sm hover:border-[#1A73E8] transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                <Upload className="h-8 w-8 text-[#1A73E8]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
                Upload Legal Document
              </h3>
              <p className="text-sm text-[#6B7280] mb-4 text-center max-w-md">
                Drag and drop your PDF, DOCX, or TXT files here, or click to browse
              </p>
              <Button className="bg-[#1A73E8] hover:bg-[#1557B0]">
                <FolderOpen className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <div>
            <h2 className="text-xl font-semibold text-[#1F2937] mb-4">Recent Documents</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-sm hover:shadow-md transition-all hover-lift cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                        <FileText className="h-5 w-5 text-[#1F2937]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">Document {i}</CardTitle>
                        <CardDescription className="text-sm">
                          Uploaded 2 days ago
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#6B7280]">
                      Legal document analysis completed
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
