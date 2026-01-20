"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Send,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquarePlus,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function DocumentsPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isNewChat, setIsNewChat] = useState(true); // Auto-reset DB for new chats
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
      setSelectedFiles(files);
      setUploadStatus("idle");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = () => {
    setIsNewChat(true);
    setMessages([]);
    setHasDocuments(false);
    setUploadMessage("");
    setUploadStatus("idle");
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
        const response = await fetch("http://localhost:8000/docingest", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && !data.error) {
          successCount++;
          setDocumentId(data.id);
          // Extract chunk count from message like "10 chunks ingested successfully"
          const match = data.data?.match(/(\d+)\s+chunks?/);
          if (match) {
            totalChunks += parseInt(match[1]);
          }
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
      const response = await fetch("http://localhost:8000/docquery", {
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

      <div className="p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#1F2937]">
              Document Analysis
            </h1>
            {hasDocuments && (
              <Button
                onClick={handleNewChat}
                variant="outline"
                className="border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>

          {/* Upload Section */}
          <Card className="mb-6 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="cursor-pointer"
                      multiple
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      selectedFiles.length === 0 || uploadStatus === "uploading"
                    }
                    className="bg-[#1A73E8] hover:bg-[#1557B0]"
                  >
                    {uploadStatus === "uploading" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload{" "}
                        {selectedFiles.length > 0 &&
                          `(${selectedFiles.length})`}
                      </>
                    )}
                  </Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-[#F1F3F4] rounded-md px-3 py-1.5 text-sm text-[#1F2937]"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="max-w-[200px] truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-[#6B7280] hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isNewChat && !hasDocuments }

                {uploadProgress && (
                  <div className="flex items-center gap-2 text-sm text-[#1A73E8]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                {uploadMessage && (
                  <div
                    className={`flex items-center gap-2 text-sm ${uploadStatus === "success" ? "text-green-600" : "text-red-600"}`}
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

          {/* Chat Interface */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                      <FileText className="h-8 w-8 text-[#1A73E8]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
                      No messages yet
                    </h3>
                    <p className="text-sm text-[#6B7280] max-w-md">
                      {hasDocuments
                        ? "Start asking questions about your documents"
                        : "Upload documents to begin analysis"}
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-[#1A73E8] text-white"
                            : "bg-[#F1F3F4] text-[#1F2937]"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {queryLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#F1F3F4] rounded-lg px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-[#1A73E8]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-[#E2E8F0] p-4">
                <div className="flex gap-2">
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
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendQuery}
                    disabled={!query.trim() || !hasDocuments || queryLoading}
                    className="bg-[#1A73E8] hover:bg-[#1557B0]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
