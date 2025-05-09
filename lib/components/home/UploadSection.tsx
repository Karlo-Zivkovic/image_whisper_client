"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function UploadSection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { uploadImage, isUploading: isUploadingToSupabase } = useImageUpload();
  const { user } = useCurrentUser();

  const handleFileProcessed = (file: File) => {
    if (selectedImage) {
      toast.info(
        "Only one image is supported. Previous image has been replaced."
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const {
    isDragging,
    isUploading,
    dropAreaRef,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
  } = useDragAndDrop({
    onFileProcessed: handleFileProcessed,
  });

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!selectedImage) {
        throw new Error("No image selected");
      }

      // Upload image to Supabase first
      const {
        url: imageUrl,
        path: imagePath,
        error: uploadError,
      } = await uploadImage(selectedImage);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      if (!imageUrl || !imagePath) {
        throw new Error("Failed to get image URL from Supabase");
      }

      // Extract image ID from the path
      const imageId = imagePath.split("/").pop()?.split(".")[0] || "";

      // Call our API to create a checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId,
          imagePath,
          imageUrl,
          prompt,
          userId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to the Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "There was an error processing your request"
      );
      setIsLoading(false);
    }
  };

  return (
    <section
      id="upload-section"
      className="py-16 px-4 md:px-6 lg:px-8 bg-secondary/5"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6">
          Create Your AI Image
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload your image and tell us what you want the AI to create based on
          it
        </p>

        <Card className="p-6 md:p-8 mb-8 h-[597px] flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            {/* Image Upload Section */}
            <div className="flex flex-col space-y-4">
              <div className="text-lg font-medium mb-2">Upload Your Image</div>

              {selectedImage ? (
                <div className="relative flex-1 flex items-center">
                  <Image
                    src={selectedImage}
                    alt="Selected"
                    className="w-full rounded-lg border-2 border-primary/30"
                    width={500}
                    height={500}
                    style={{ objectFit: "contain", maxHeight: "400px" }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 bg-background/80"
                    onClick={() => setSelectedImage(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label
                  ref={dropAreaRef}
                  className={`flex flex-col items-center justify-center w-full flex-1 rounded-lg border-2 border-dashed 
                    ${
                      isDragging
                        ? "border-primary bg-primary/10 scale-[1.02] transition-all duration-150"
                        : "border-primary/30 hover:border-primary/50 bg-secondary/10"
                    } 
                    cursor-pointer transition-colors`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload
                      className={`w-10 h-10 mb-3 ${
                        isDragging
                          ? "text-primary animate-bounce"
                          : "text-muted-foreground"
                      }`}
                    />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP (MAX. 10MB)
                    </p>
                    <p className="mt-2 text-xs text-primary">
                      You can also paste from clipboard (Ctrl+V)
                    </p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                  />
                </label>
              )}

              {/* {isDragging && !selectedImage && (
                <div className="fixed inset-0 pointer-events-none bg-primary/5 z-10 flex items-center justify-center">
                  <div className="text-xl font-medium text-primary bg-background/80 p-4 rounded-lg shadow-lg">
                    Drop your image here
                  </div>
                </div>
              )} */}
            </div>

            {/* Prompt Section */}
            <div className="flex flex-col space-y-4 flex-1">
              <div className="text-lg font-medium mb-2">
                Describe Your Vision
              </div>
              <div className="flex flex-col flex-1">
                <Textarea
                  placeholder="Tell us what you want the AI to create based on your image... For example: Transform this into a cyberpunk scene or Make this look like a watercolor painting."
                  className="flex-1 min-h-[300px] resize-none"
                  value={prompt}
                  onChange={handlePromptChange}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Be specific and creative for the best results. The more
                  details you provide, the better.
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="px-8 rounded-full"
              disabled={
                !selectedImage ||
                !prompt.trim() ||
                isUploading ||
                isLoading ||
                isUploadingToSupabase
              }
              onClick={handleSubmit}
            >
              {isUploading
                ? "Uploading..."
                : isUploadingToSupabase
                ? "Uploading to Cloud..."
                : isLoading
                ? "Processing..."
                : "Transform My Image"}
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>
            After clicking &quot;Transform My Image&quot; you&apos;ll be
            directed to a secure payment page.
          </p>
          <p>
            Your image will be processed immediately after payment is complete.
          </p>
        </div>
      </div>
    </section>
  );
}
