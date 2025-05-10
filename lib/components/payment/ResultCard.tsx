"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, Download, Share2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Response } from "@/lib/supabase/entity.types";

interface ResultCardProps {
  responseDetails: Response | null | undefined;
  copyLinkToClipboard: () => void;
  copySuccess: boolean;
}

export default function ResultCard({
  responseDetails,
  copyLinkToClipboard,
  copySuccess,
}: ResultCardProps) {
  console.log(responseDetails);
  // If we have a response with images, show the completed results
  if (
    responseDetails &&
    responseDetails.image_url &&
    responseDetails.image_url.length > 0
  ) {
    return (
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Results</h2>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        </div>
        <Separator className="mb-4" />

        <div className="mb-6">
          <h3 className="text-md font-medium text-muted-foreground mb-2">
            Transformed Images ({responseDetails.image_url.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {responseDetails.image_url.map((imageUrl, i) => {
              // Create a dedicated download handler for each image
              const downloadImage = () => {
                try {
                  const link = document.createElement("a");
                  link.href = imageUrl;
                  link.download = `transformed-image-${i + 1}.jpg`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`Image ${i + 1} downloaded successfully`);
                } catch (err) {
                  console.error("Error downloading image:", err);
                  toast.error("Failed to download image");
                }
              };

              return (
                <div
                  key={i}
                  className="border rounded-md overflow-hidden relative group"
                >
                  <Image
                    src={imageUrl}
                    alt={`Transformed image ${i + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={downloadImage}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Completed on: {new Date(responseDetails.created_at).toLocaleString()}
        </div>
      </Card>
    );
  }

  // Empty state / processing
  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Results</h2>
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Coming Soon
        </Badge>
      </div>
      <Separator className="mb-6" />

      <div className="text-center py-12 bg-secondary/5 rounded-lg border border-dashed border-gray-300">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">
          Your images are being processed
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Our team is working on your request. This could take up to 24 hours.
          We&apos;ll send you an email when your transformed images are ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={copyLinkToClipboard}
          >
            <Share2 className="h-4 w-4" />
            {copySuccess ? "Copied!" : "Copy This Link"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
