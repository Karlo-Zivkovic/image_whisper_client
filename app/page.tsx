import {
  Hero,
  Features,
  Examples,
  CTA,
  Footer,
  UploadSection,
} from "@/lib/components/home";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <Features />
      <UploadSection />
      <Examples />
      <CTA />
      <Footer />
    </main>
  );
}
