"use client";

import { Button } from "@/components/ui/button";

export default function Hero() {
  const scrollToUploadSection = () => {
    const uploadSection = document.getElementById("upload-section");
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="flex flex-col items-center justify-center py-20 px-4 md:px-6 lg:px-8 text-center bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-chart-1 to-chart-3 bg-clip-text text-transparent animate-fade-in">
          Transform Your Images With AI Magic
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-muted-foreground animate-fade-in animate-delay-100">
          Upload an image, add your prompt, and watch as AI creates something
          extraordinary.
        </p>
        <Button
          size="lg"
          className="animate-bounce animate-delay-200 rounded-full text-lg px-8 py-6 h-auto"
          onClick={scrollToUploadSection}
        >
          Start Creating Now
        </Button>
      </div>
    </section>
  );
}
