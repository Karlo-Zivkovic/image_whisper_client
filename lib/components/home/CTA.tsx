"use client";
import { Button } from "@/components/ui/button";

export default function CTA() {
  console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const scrollToUploadSection = () => {
    const uploadSection = document.getElementById("upload-section");
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-chart-1/10 to-chart-3/10">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Images?
        </h2>
        <p className="text-xl mb-8 text-muted-foreground">
          Start creating amazing AI transformations in seconds.
        </p>
        <Button
          size="lg"
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 h-auto text-lg"
          onClick={scrollToUploadSection}
        >
          Get Started Now
        </Button>
      </div>
    </section>
  );
}
