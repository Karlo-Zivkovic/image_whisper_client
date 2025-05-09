"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, X, Plus } from "lucide-react";
import Image from "next/image";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Define interfaces for image data
interface UploadedImage {
  dataUrl: string;
  file?: File;
}

interface UploadedImageWithMeta extends UploadedImage {
  imageUrl?: string;
}

const MAX_IMAGES = 3;

export default function UploadSection() {
  const [selectedImages, setSelectedImages] = useState<UploadedImageWithMeta[]>(
    []
  );
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { uploadImage, isUploading: isUploadingToSupabase } = useImageUpload();
  const { user } = useCurrentUser();

  const handleFileProcessed = (file: File) => {
    if (selectedImages.length >= MAX_IMAGES) {
      toast.warning(
        `Maximum of ${MAX_IMAGES} images allowed. Please remove an image first.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImages((prev) => [
        ...prev,
        { dataUrl: reader.result as string, file },
      ]);
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

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (selectedImages.length === 0) {
        throw new Error("No images selected");
      }

      // Upload all images to Supabase
      const uploadPromises = selectedImages.map(async (img) => {
        if (!img.dataUrl) return null;

        const { url, error } = await uploadImage(img.dataUrl);

        if (error) {
          throw new Error(`Failed to upload image: ${error.message}`);
        }

        if (!url) {
          throw new Error("Failed to get image URL from Supabase");
        }

        return {
          ...img,
          imageUrl: url,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const validUploadedImages = uploadedImages.filter(
        Boolean
      ) as UploadedImageWithMeta[];

      if (validUploadedImages.length === 0) {
        throw new Error("Failed to upload any images");
      }

      // Call our API to create a checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: validUploadedImages.map((img) => ({
            imageUrl: img.imageUrl,
          })),
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
          Create Your AI Images
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload up to 3 images and tell us what you want the AI to create based
          on them
        </p>

        <Card className="p-6 md:p-8 mb-8 h-auto flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            {/* Image Upload Section */}
            <div className="flex flex-col space-y-4">
              <div className="text-lg font-medium mb-2">
                Upload Your Images (Max {MAX_IMAGES})
              </div>

              {/* Show selected images */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {selectedImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative border border-primary/30 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={img.dataUrl}
                        alt={`Selected image ${index + 1}`}
                        width={500}
                        height={300}
                        className="w-full object-contain h-[150px]"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Show upload area if less than max images */}
              {selectedImages.length < MAX_IMAGES && (
                <label
                  ref={dropAreaRef}
                  className={`flex flex-col items-center justify-center w-full min-h-[200px] rounded-lg border-2 border-dashed 
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
                    {selectedImages.length > 0 ? (
                      <Plus
                        className={`w-10 h-10 mb-3 ${
                          isDragging
                            ? "text-primary animate-bounce"
                            : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <Upload
                        className={`w-10 h-10 mb-3 ${
                          isDragging
                            ? "text-primary animate-bounce"
                            : "text-muted-foreground"
                        }`}
                      />
                    )}
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
                    {selectedImages.length > 0 && (
                      <p className="mt-2 text-sm font-medium">
                        {selectedImages.length} of {MAX_IMAGES} images selected
                      </p>
                    )}
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
            </div>

            {/* Prompt Section */}
            <div className="flex flex-col space-y-4 flex-1">
              <div className="text-lg font-medium mb-2">
                Describe Your Vision
              </div>
              <div className="flex flex-col flex-1">
                <Textarea
                  placeholder="Tell us what you want the AI to create based on your images... For example: Transform these into cyberpunk scenes or Make these look like watercolor paintings."
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
                selectedImages.length === 0 ||
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
                : "Transform My Images"}
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>
            After clicking &quot;Transform My Images&quot; you&apos;ll be
            directed to a secure payment page.
          </p>
          <p>
            Your images will be processed immediately after payment is complete.
          </p>
        </div>
      </div>
    </section>
  );
}
