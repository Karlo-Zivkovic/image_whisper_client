import { Card } from "@/components/ui/card";

export default function Features() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M15 8H15.01M9 16L12 12L15 16M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
            <p className="text-muted-foreground">
              Select any image from your gallery or take a photo on the spot.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-chart-1"
              >
                <path
                  d="M12 5.5V7.5M12 11.5V13.5M8 3H16C17.1046 3 18 3.89543 18 5V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V5C6 3.89543 6.89543 3 8 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Your Prompt</h3>
            <p className="text-muted-foreground">
              Describe what you&apos;d like the AI to do with your image. Be
              creative!
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
            <div className="w-16 h-16 rounded-full bg-chart-3/10 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-chart-3"
              >
                <path
                  d="M8 16.5714L12 20L16 16.5714M12 4V20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Amazing Results</h3>
            <p className="text-muted-foreground">
              Receive an AI-transformed image based on your prompt in seconds.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
