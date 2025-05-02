// import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Examples() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-secondary/5">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          See What&apos;s Possible
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Check out these amazing transformations created by our users
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* We'll place example cards here - normally would fetch from backend */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden group cursor-pointer">
              <div className="relative aspect-square overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-chart-1/20 group-hover:opacity-0 transition-opacity z-10" />
                <div className="relative h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-20"
                  >
                    <path
                      d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-1">Example Transformation {i}</h4>
                <p className="text-sm text-muted-foreground">
                  &ldquo;Turn my photo into a{" "}
                  {i === 1
                    ? "cyberpunk scene"
                    : i === 2
                    ? "watercolor painting"
                    : "fantasy landscape"}
                  &rdquo;
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          {/* <Button size="lg" className="rounded-full">
            Try It Yourself
          </Button> */}
        </div>
      </div>
    </section>
  );
}
