"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/utils/supabase/client";
import { useInsertChat } from "@/lib/hooks/useInsertChat";
import { useInsertRequest } from "@/lib/hooks/useInsertRequest";
import { useGetSessionMetadata } from "@/lib/hooks/useGetSessionMetadata";
import { useUpdateSessionMetadata } from "@/lib/hooks/useUpdateSessionMetadata";
import { useRegisterSharedSession } from "@/lib/hooks/useRegisterSharedSession";

type PageStatus = "loading" | "success" | "error";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const insertChat = useInsertChat();
  const insertRequest = useInsertRequest();
  const registerSharedSession = useRegisterSharedSession();
  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useGetSessionMetadata(sessionId);
  const updateSessionMetadata = useUpdateSessionMetadata();

  /**
   * Create an anonymous user if no user ID was passed
   */
  const createAnonymousUserIfNeeded = async (
    userId: string | null
  ): Promise<string> => {
    try {
      // If user_id was passed in URL, use that (assumes session managed by Supabase)
      if (userId) {
        return userId;
      }

      // Check if there's an existing session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log("Using existing session user ID");
        return sessionData.session.user.id;
      }

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error || !data.user) {
        console.error("Error creating anonymous user:", error);
        throw error || new Error("No user returned from signInAnonymously");
      }

      console.log("Anonymous user created successfully");
      return data.user.id;
    } catch (error) {
      console.error("Error in user authentication:", error);
      throw error;
    }
  };

  /**
   * Setup user with chat and request records
   */
  const setupUserAndRecords = async () => {
    if (!metadata || !sessionId) {
      console.warn("No metadata or sessionId available");
      return false;
    }

    try {
      // Make sure we have the required data
      if (!metadata?.imagesUrl || !metadata?.prompt) {
        console.warn("Missing images URL or prompt in session metadata");
        // We'll still continue since we're in success page
      }

      // Create user if needed
      const userId = await createAnonymousUserIfNeeded(metadata.userId || null);

      // Only create records if we have the necessary data
      if (
        metadata.imagesUrl &&
        Array.isArray(metadata.imagesUrl) &&
        metadata.imagesUrl.length > 0 &&
        metadata.prompt
      ) {
        // Create chat record
        const chatData = await insertChat.mutateAsync({
          user_id: userId,
          status: "pending",
          updated_at: new Date().toISOString(),
        });

        // Update session metadata with chat ID and user ID
        if (!metadata.userId || !metadata.chatId) {
          try {
            await updateSessionMetadata.mutateAsync({
              sessionId,
              userId,
              chatId: chatData.id,
            });
          } catch (updateError) {
            console.error("Failed to update session metadata:", updateError);
            // Continue anyway - the main records are already created
          }
        }

        // Create request record
        await insertRequest.mutateAsync({
          chat_id: chatData.id,
          image_url: metadata.imagesUrl,
          prompt: metadata.prompt,
        });

        // Register the shared session immediately for later access
        // This ensures the session is always accessible via the shared link
        try {
          await registerSharedSession.mutateAsync({
            sessionId,
            chatId: chatData.id,
          });
        } catch (registerError) {
          console.error("Failed to register shared session:", registerError);
          // Continue anyway - this is not critical for the user at this stage
        }
      } else {
        console.log(
          "User created but no records were created due to missing metadata"
        );
      }

      return true;
    } catch (error) {
      console.error("Error setting up user after payment:", error);
      // Don't throw - we'll show success anyway
      return false;
    }
  };

  useEffect(() => {
    // Handle missing session ID
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found. Something went wrong.");
      return;
    }

    // When metadata is loaded and not in error state, process the setup
    if (!isLoadingMetadata && metadata && !metadataError) {
      const processSuccess = async () => {
        try {
          // Setup user and records using the metadata
          await setupUserAndRecords();
          setStatus("success");
        } catch (err) {
          console.error("Error processing payment success:", err);
          // Since we're on the success page, we'll still show success
          setStatus("success");
        }
      };

      processSuccess();
    } else if (metadataError) {
      console.error("Error fetching session metadata:", metadataError);
      setStatus("error");
      setError("Failed to load session details. Please try again.");
    }
  }, [sessionId, metadata, isLoadingMetadata, metadataError]);

  // Show loading state while either explicitly in loading state or while metadata is loading
  if (status === "loading" || isLoadingMetadata) {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium">Setting up your request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="text-red-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-8">
          <div className="text-green-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
          <p className="mb-6 text-muted-foreground">
            Your payment has been processed. Your images are now being
            transformed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Create Another Request</Link>
            </Button>
            <Button asChild>
              <Link href={`/sessions/${sessionId}`}>View Order Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
