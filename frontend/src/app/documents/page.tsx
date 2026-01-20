"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Send,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UploadedDocument = {
  name: string;
  uploadedAt: Date;
  chunks: number;
};

export default function DocumentsPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [hasDocuments, setHasDocuments] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Append new files to existing selected files
      setSelectedFiles(prev => [...prev, ...files]);
      setUploadStatus("idle");
    }
    // Reset the input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = () => {
    setIsNewChat(true);
    setMessages([]);
    setHasDocuments(false);
    setUploadedDocuments([]);
    setUploadMessage("");
    setUploadStatus("idle");
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
    if (uploadedDocuments.length <= 1) {
      setHasDocuments(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadStatus("uploading");
    setUploadMessage("");

    let successCount = 0;
    let failCount = 0;
    let totalChunks = 0;

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress(
        `Uploading ${i + 1}/${selectedFiles.length}: ${file.name}`,
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);
      formData.append("id", Date.now().toString());
      // Reset DB on first file only if this is a new chat
      formData.append("reset_db", (i === 0 && isNewChat).toString());

      try {
        const response = await fetch("http://localhost:8001/docingest", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && !data.error) {
          successCount++;
          setDocumentId(data.id);
          // Extract chunk count from message like "10 chunks ingested successfully"
          const match = data.data?.match(/(\d+)\s+chunks?/);
          const chunkCount = match ? parseInt(match[1]) : 0;
          if (match) {
            totalChunks += chunkCount;
          }
          
          // Add to uploaded documents list
          setUploadedDocuments(prev => [...prev, {
            name: file.name,
            uploadedAt: new Date(),
            chunks: chunkCount
          }]);
        } else {
          failCount++;
        }
      } 
      catch(error){
        failCount++;
      }
    }

    setUploadProgress("");

    if (failCount === 0) {
      setUploadStatus("success");
      setUploadMessage(
        `${successCount} file(s) uploaded successfully!`,
      );
      setHasDocuments(true);
      setIsNewChat(false); // No longer a new chat after first upload
    } else {
      setUploadStatus("error");
      setUploadMessage(`${successCount} succeeded, ${failCount} failed`);
      if (successCount > 0) {
        setHasDocuments(true);
        setIsNewChat(false);
      }
    }

    // Clear selection
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendQuery = async () => {
    if (!query.trim() || queryLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setQueryLoading(true);

    try {
      const response = await fetch("http://localhost:8001/docquery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: documentId || Date.now().toString(),
          query: query,
        }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.data || "No response",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: "assistant",
          content: `Error: ${data.error || "Failed to get response"}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Failed to connect to server",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  return (
    <>
      <Header
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Documents" }]}
      />

      <div className="h-[calc(100vh-4rem)]">
        <div className="flex w-full h-full">
          {/* Main Chat Area - 70% */}
          <div className="w-[70%] flex flex-col">
            <ScrollArea className="flex-1">
              <div className="h-full flex flex-col">
                {/* Empty State */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-[#E8F0FE] to-[#F1F5F9] rounded-xl p-12 border border-[#E2E8F0]">
                        <div className="flex justify-center gap-2 mb-6">
                          <div className="w-3 h-3 bg-[#4285F4] rounded-full"></div>
                          <div className="w-3 h-3 bg-[#34A853] rounded-full"></div>
                          <div className="w-3 h-3 bg-[#FBBC04] rounded-full"></div>
                          <div className="w-3 h-3 bg-[#EA4335] rounded-full"></div>
                        </div>
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white mb-6 mx-auto shadow-md">
                          <FileText className="h-10 w-10 text-[#4285F4]" />
                        </div>
                        <p className="text-[#1F2937] text-xl font-semibold mb-3">
                          {hasDocuments ? "Ready to Analyze" : "Start Your Document Analysis"}
                        </p>
                        <p className="text-[#6B7280] text-base">
                          {hasDocuments
                            ? "Ask questions about your uploaded documents"
                            : "Upload documents from the sidebar to begin"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 p-8">
                    {/* Messages */}
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" ? (
                          <Card className="max-w-[80%] shadow-lg border-l-4 border-l-[#4285F4]">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4285F4] flex-shrink-0">
                                  <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-sm text-[#1F2937] whitespace-pre-wrap leading-relaxed">
                                  {message.content}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="max-w-[80%] bg-[#4285F4] text-white rounded-lg px-4 py-3 shadow-md">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading State */}
                    {queryLoading && (
                      <div className="flex justify-start">
                        <Card className="shadow-lg border-l-4 border-l-[#4285F4]">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4285F4]">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                              <span className="text-sm text-[#6B7280]">Analyzing document...</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Fixed Input at Bottom */}
            <div className="border-t border-[#E2E8F0] bg-white p-6">
              <div className="flex gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    hasDocuments
                      ? "Ask a question about your documents..."
                      : "Upload documents first..."
                  }
                  disabled={!hasDocuments || queryLoading}
                  className="flex-1 h-12 border-[#E2E8F0] focus:border-[#4285F4] focus-visible:ring-[#4285F4]"
                />
                <Button
                  onClick={handleSendQuery}
                  disabled={!query.trim() || !hasDocuments || queryLoading}
                  className="h-12 px-6 bg-[#4285F4] hover:bg-[#3367D6]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - 30% */}
          <div className="w-[30%] border-l border-[#E2E8F0] bg-gradient-to-br from-[#F8F9FA] to-[#F1F5F9]">
            <ScrollArea className="h-full p-6">
              <div className="space-y-6">
                {/* New Chat Button */}
                <Button
                  onClick={handleNewChat}
                  className="w-full h-12 bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-md text-base"
                >
                  <MessageSquarePlus className="mr-2 h-5 w-5" />
                  New Chat
                </Button>

                {/* Upload Section */}
                <Card className="shadow-sm border-l-4 border-l-[#4285F4]">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-[#1F2937] mb-5 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#4285F4] rounded-full"></div>
                      Upload Documents
                    </h3>
                    
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        className="cursor-pointer text-sm h-10"
                        multiple
                      />
                      
                      {selectedFiles.length > 0 && (
                        <div className="space-y-3">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 bg-white rounded-md px-3 py-3 text-sm border border-[#E2E8F0]"
                            >
                              <FileText className="h-4 w-4 text-[#4285F4] flex-shrink-0 mt-0.5" />
                              <span className="flex-1 break-all text-xs leading-relaxed">{file.name}</span>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-[#6B7280] hover:text-red-600 flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploadStatus === "uploading"}
                        className="w-full h-11 bg-[#34A853] hover:bg-[#2D8E47] text-white text-sm"
                      >
                        {uploadStatus === "uploading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                          </>
                        )}
                      </Button>

                      {uploadProgress && (
                        <div className="flex items-center gap-2 text-sm text-[#4285F4] py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="break-all text-xs">{uploadProgress}</span>
                        </div>
                      )}

                      {uploadMessage && (
                        <div
                          className={`flex items-center gap-2 text-sm py-2 ${uploadStatus === "success" ? "text-[#34A853]" : "text-[#EA4335]"}`}
                        >
                          {uploadStatus === "success" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <span>{uploadMessage}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <Card className="shadow-sm border-l-4 border-l-[#FBBC04]">
                    <CardContent className="p-6">
                      <h3 className="text-base font-semibold text-[#1F2937] mb-5 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#FBBC04] rounded-full"></div>
                        Documents ({uploadedDocuments.length})
                      </h3>
                      <div className="space-y-3">
                        {uploadedDocuments.map((doc, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 border border-[#E2E8F0] hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-[#4285F4] flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-medium text-[#1F2937] break-all leading-relaxed">
                                  {doc.name}
                                </span>
                              </div>
                              <button
                                onClick={() => removeDocument(index)}
                                className="text-[#6B7280] hover:text-[#EA4335] flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-[#6B7280] pl-7">
                              {doc.chunks} chunks • {doc.uploadedAt.toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
