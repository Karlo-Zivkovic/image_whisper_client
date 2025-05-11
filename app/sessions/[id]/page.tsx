"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { toast } from "sonner";
import { useGetSessionMetadata } from "@/lib/hooks/useGetSessionMetadata";
import { useSessionData } from "@/lib/hooks/useSessionData";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [copySuccess, setCopySuccess] = useState(false);

  // Use hook for metadata fetching
  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useGetSessionMetadata(sessionId);

  // Parse chatId as a number if it exists
  const chatId = metadata?.chatId ? parseInt(metadata.chatId, 10) : null;

  const {
    data: sessionData,
    isLoading: isLoadingSessionData,
    error: sessionDataError,
    refetch: refetchSessionData,
  } = useSessionData(chatId);

  // Extract request and response from session data
  const requestData = sessionData?.request || null;
  const responseData = sessionData?.response || null;

  const copyLinkToClipboard = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          setCopySuccess(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error("Failed to copy link");
        });
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `transformed-image-${index + 1}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Image ${index + 1} downloaded successfully`);
    } catch (err) {
      console.error("Error downloading image:", err);
      toast.error("Failed to download image");
    }
  };

  // Loading state
  if (isLoadingMetadata || isLoadingSessionData) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium">
              Loading your transformation details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (metadataError || sessionDataError) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="text-red-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              {metadataError
                ? `Metadata error: ${
                    metadataError.message || metadataError.toString()
                  }`
                : sessionDataError
                ? `Data error: ${
                    sessionDataError.message || sessionDataError.toString()
                  }`
                : "Failed to load transformation details"}
            </p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No metadata or chatId
  if (!metadata || !metadata.chatId) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="text-yellow-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              The session information could not be found or may have expired.
            </p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No request data available yet
  if (!requestData) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="text-yellow-500">
              <Clock className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Processing Request</h1>
            <p className="mb-6 text-muted-foreground">
              Your transformation request is being processed. Please check back
              later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => refetchSessionData()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 rotate-45" />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/dashboard">View All Transformations</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get source images only from request data
  const sourceImages = requestData.image_url || [];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Minimal header with status badge */}
      <header className="bg-white border-b px-4 py-2 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h1 className="text-sm font-medium">
              Transformation{" "}
              <span className="text-zinc-500">{sessionId.slice(0, 8)}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`h-6 px-2 text-xs ${
                responseData
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {responseData ? "Completed" : "Processing"}
            </Badge>

            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/dashboard">All Transformations</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/">New</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {responseData &&
      responseData.image_url &&
      responseData.image_url.length > 0 ? (
        <main className="max-w-6xl mx-auto p-4">
          {/* Small info bar with prompt and time */}
          <div className="bg-white border rounded-md p-3 mb-4 flex flex-wrap gap-4 items-center text-xs">
            <div className="flex-1 min-w-[200px]">
              <span className="font-medium text-zinc-500 mr-2">Prompt:</span>
              <span className="italic">
                {requestData?.prompt || "No prompt available"}
              </span>
            </div>
            {requestData && (
              <div className="text-zinc-500 whitespace-nowrap">
                Processed: {new Date(requestData.created_at).toLocaleString()}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={copyLinkToClipboard}
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              {copySuccess ? "Copied" : "Share"}
            </Button>
          </div>

          {/* Image pairs in cards */}
          <div className="grid gap-4">
            {sourceImages.map((sourceUrl: string, index: number) => {
              const resultUrl = responseData.image_url[index];
              if (!resultUrl) return null;

              return (
                <div
                  key={index}
                  className="bg-white border rounded-md overflow-hidden"
                >
                  <div className="border-b p-2 px-3 flex justify-between items-center">
                    <h3 className="text-sm font-medium">Image {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => downloadImage(resultUrl, index)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2">
                    {/* Before image */}
                    <div className="relative border-r">
                      <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 text-xs z-10"
                      >
                        Before
                      </Badge>
                      <div className="aspect-video w-full flex items-center justify-center">
                        <Image
                          src={sourceUrl}
                          alt={`Original image ${index + 1}`}
                          width={600}
                          height={400}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>

                    {/* After image */}
                    <div className="relative">
                      <Badge className="absolute top-2 left-2 text-xs z-10 bg-green-100 text-green-800 border-green-200">
                        After
                      </Badge>
                      <div className="aspect-video w-full flex items-center justify-center">
                        <Image
                          src={resultUrl}
                          alt={`Transformed image ${index + 1}`}
                          width={600}
                          height={400}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : !requestData ? (
        // Loading state
        <div className="h-[90vh] flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-medium">
              Loading transformation data...
            </p>
          </div>
        </div>
      ) : (
        // Processing state
        <main className="max-w-6xl mx-auto p-4">
          {/* Info bar with prompt */}
          <div className="bg-white border rounded-md p-3 mb-4 flex flex-wrap gap-4 items-center text-xs">
            <div className="flex-1 min-w-[200px]">
              <span className="font-medium text-zinc-500 mr-2">Prompt:</span>
              <span className="italic">
                {requestData.prompt || "No prompt available"}
              </span>
            </div>
            {requestData && (
              <div className="text-zinc-500 whitespace-nowrap">
                Requested: {new Date(requestData.created_at).toLocaleString()}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={copyLinkToClipboard}
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />
                {copySuccess ? "Copied" : "Share"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => refetchSessionData()}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1 rotate-45" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Status message */}
          <div className="bg-white border rounded-md p-6 text-center mb-4">
            <Clock className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h2 className="text-base font-medium mb-2">
              Processing Your Images
            </h2>
            <p className="text-sm text-zinc-600 mb-0 max-w-md mx-auto">
              Your transformation is in progress. You&apos;ll receive an email
              when complete.
            </p>
          </div>

          {/* Source images */}
          {sourceImages.length > 0 && (
            <div className="bg-white border rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Source Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sourceImages.map((imageUrl: string, index: number) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <div className="aspect-video flex items-center justify-center bg-zinc-50">
                      <Image
                        src={imageUrl}
                        alt={`Source image ${index + 1}`}
                        width={300}
                        height={200}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
