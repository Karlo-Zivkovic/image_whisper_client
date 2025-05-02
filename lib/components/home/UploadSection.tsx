"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import Image from "next/image";

export default function UploadSection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = () => {
    // This is where we'll eventually handle the submission and redirect to payment
    console.log("Image and prompt submitted:", { selectedImage, prompt });
    // For now, we'll just show an alert
    alert("This would typically take you to the payment page");
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

        <Card className="p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div className="flex flex-col space-y-4">
              <div className="text-lg font-medium mb-2">Upload Your Image</div>

              {selectedImage ? (
                <div className="relative">
                  <Image
                    src={selectedImage}
                    alt="Selected"
                    className="w-full aspect-square object-cover rounded-lg border-2 border-primary/30"
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
                <label className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer bg-secondary/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP (MAX. 10MB)
                    </p>
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/webp"
                  />
                </label>
              )}
            </div>

            {/* Prompt Section */}
            <div className="flex flex-col space-y-4">
              <div className="text-lg font-medium mb-2">
                Describe Your Vision
              </div>
              <Textarea
                placeholder="Tell us what you want the AI to create based on your image... For example: Transform this into a cyberpunk scene or Make this look like a watercolor painting."
                className="flex-1 min-h-[200px] resize-none"
                value={prompt}
                onChange={handlePromptChange}
              />
              <div className="text-xs text-muted-foreground">
                Be specific and creative for the best results. The more details
                you provide, the better.
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="px-8 rounded-full"
              disabled={!selectedImage || !prompt.trim() || isUploading}
              onClick={handleSubmit}
            >
              {isUploading ? "Uploading..." : "Transform My Image"}
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
