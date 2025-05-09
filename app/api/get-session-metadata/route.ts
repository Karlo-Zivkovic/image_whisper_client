import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

export async function GET(request: Request) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // // Extract metadata from the session
    // const metadata = session.metadata || {};

    // // Parse images JSON if it exists
    // let images: ImageData[] = [];
    // try {
    //   if (metadata.images_json) {
    //     images = JSON.parse(metadata.images_json as string) as ImageData[];
    //   } else {
    //     console.log(
    //       "No images_json found in metadata, checking for single image data"
    //     );
    //     // For backwards compatibility, check for single image data
    //     if (metadata.imageUrl) {
    //       images = [
    //         {
    //           imageId: (metadata.imageId as string) || "",
    //           imagePath: (metadata.imagePath as string) || "",
    //           imageUrl: (metadata.imageUrl as string) || "",
    //         },
    //       ];
    //     }
    //   }
    // } catch (error) {
    //   console.error("Error parsing images JSON:", error);
    // }

    // // Create a properly formatted metadata object
    // const formattedMetadata = {
    //   images,
    //   prompt: metadata.prompt as string,
    //   imageCount: metadata.imageCount
    //     ? parseInt(metadata.imageCount as string, 10)
    //     : images.length,
    //   userId: metadata.userId as string,
    // };

    // Return the metadata
    const filteredMetadata = { ...session.metadata };
    const imageUrlKeys = Object.keys(filteredMetadata || {}).filter((key) =>
      key.startsWith("imageUrl_")
    );

    // Extract image URLs into an array
    const imagesUrl = imageUrlKeys.map((key) => filteredMetadata[key]);

    // Remove individual imageUrl_ entries from metadata
    imageUrlKeys.forEach((key) => {
      delete filteredMetadata[key];
    });

    return NextResponse.json({
      success: true,
      metadata: {
        ...filteredMetadata,
        imagesUrl,
      },
    });
  } catch (error) {
    console.error("Error retrieving session metadata:", error);
    const err = error as Error;

    return NextResponse.json(
      {
        error: "Failed to retrieve session metadata",
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
