"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { toast } from "sonner";
import { useGetRequest } from "@/lib/hooks/useGetRequest";
import { useGetResponse } from "@/lib/hooks/useGetResponse";
import { useGetSessionMetadata } from "@/lib/hooks/useGetSessionMetadata";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [copySuccess, setCopySuccess] = useState(false);

  // Use hooks for data fetching in sequence
  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useGetSessionMetadata(sessionId);

  // Get chat ID from metadata
  const chatId = metadata?.chatId ? parseInt(metadata.chatId, 10) : null;

  // Use hooks to get request and response data based on chatId
  // Pass the sessionId to enable access through shared_sessions RLS policy
  const {
    data: requestData,
    isLoading: isLoadingRequest,
    error: requestError,
  } = useGetRequest(chatId, sessionId);

  const { data: responseData } = useGetResponse(chatId, sessionId);

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
  if (isLoadingMetadata || isLoadingRequest) {
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
  if (metadataError || requestError) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="text-red-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              {requestError?.toString() ||
                metadataError?.toString() ||
                "Failed to load transformation details"}
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
  if (!metadata || !chatId) {
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

  // Get source images from request data or metadata
  const sourceImages =
    requestData?.image_url ||
    (metadata.imagesUrl && Array.isArray(metadata.imagesUrl)
      ? metadata.imagesUrl
      : Object.entries(metadata)
          .filter(([key]) => key.startsWith("imageUrl_"))
          .map(([, value]) => value as string));

  return (
    <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Image Transformation</h1>
                <p className="text-muted-foreground">
                  <span className="font-medium">Order ID:</span>{" "}
                  {sessionId.slice(0, 10)}...
                </p>
              </div>
            </div>
            <div>
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 ${
                  responseData
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }`}
              >
                {responseData ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Processing
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Prompt Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Transformation Prompt</h2>
          <Separator className="mb-4" />
          <div className="bg-secondary/10 rounded-md p-4 mb-4">
            <p className="italic">{metadata.prompt || requestData?.prompt}</p>
          </div>
          {requestData && (
            <div className="text-sm text-muted-foreground">
              Requested on: {new Date(requestData.created_at).toLocaleString()}
            </div>
          )}
        </Card>

        {/* Before & After Images */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Before & After</h2>
          <Separator className="mb-6" />

          {responseData &&
          responseData.image_url &&
          responseData.image_url.length > 0 ? (
            <div>
              {/* Show before/after pairs for each image */}
              {sourceImages.map((sourceUrl, index) => {
                const resultUrl = responseData.image_url[index];

                // Only show pairs where we have both source and result
                if (!resultUrl) return null;

                return (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-medium mb-4">
                      Image {index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Before Image */}
                      <div className="space-y-2">
                        <Badge variant="outline" className="mb-2">
                          Before
                        </Badge>
                        <div className="border rounded-md overflow-hidden">
                          <div className="relative">
                            <Image
                              src={sourceUrl}
                              alt={`Source image ${index + 1}`}
                              width={500}
                              height={400}
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      {/* After Image */}
                      <div className="space-y-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 mb-2"
                        >
                          After
                        </Badge>
                        <div className="border rounded-md overflow-hidden">
                          <div className="relative group">
                            <Image
                              src={resultUrl}
                              alt={`Transformed image ${index + 1}`}
                              width={500}
                              height={400}
                              className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => downloadImage(resultUrl, index)}
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={copyLinkToClipboard}
                >
                  <Share2 className="h-4 w-4" />
                  {copySuccess ? "Copied!" : "Share this transformation"}
                </Button>
              </div>
            </div>
          ) : (
            // Processing - No Results Yet
            <div className="text-center py-12 bg-secondary/5 rounded-lg border border-dashed border-gray-300">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">
                Your images are being transformed
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Our AI is working on your transformation. This process may take
                up to 24 hours. You&apos;ll receive an email when your results
                are ready.
              </p>

              {/* Preview of source images */}
              <div className="my-8">
                <h4 className="text-md font-medium mb-4">Your Source Images</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {sourceImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="border rounded-md overflow-hidden"
                    >
                      <Image
                        src={imageUrl}
                        alt={`Source image ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={copyLinkToClipboard}
                >
                  <Share2 className="h-4 w-4" />
                  {copySuccess ? "Copied!" : "Bookmark or share this page"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info Card - Only show if no response yet */}
        {!responseData && (
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium mb-1">
                  We&apos;ll notify you when your transformation is ready
                </h3>
                <p className="text-muted-foreground text-sm">
                  This page will automatically update when your results are
                  ready. You can bookmark it or come back later. We&apos;ll also
                  send you an email notification.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Create Another Transformation
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">View All Transformations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
