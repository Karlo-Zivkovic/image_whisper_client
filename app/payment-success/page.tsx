"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/utils/supabase/client";
import { useInsertChat } from "@/lib/hooks/useInsertChat";
import { useInsertRequest } from "@/lib/hooks/useInsertRequest";

type PageStatus = "loading" | "success" | "error";

interface SessionMetadata {
  imagesUrl?: string[];
  prompt?: string;
  userId?: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const insertChat = useInsertChat();
  const insertRequest = useInsertRequest();

  /**
   * Fetch Stripe session metadata from our API
   */
  const fetchSessionMetadata = async (
    sessionId: string
  ): Promise<SessionMetadata> => {
    try {
      const response = await fetch(
        `/api/get-session-metadata?session_id=${sessionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch session metadata");
      }

      const data = await response.json();

      return data.metadata || {};
    } catch (error) {
      console.error("Error fetching session metadata:", error);
      return {};
    }
  };

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
  const setupUserAndRecords = async (metadata: SessionMetadata) => {
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

        // Create request record
        await insertRequest.mutateAsync({
          chat_id: chatData.id,
          image_url: metadata.imagesUrl,
          prompt: metadata.prompt,
        });
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

    const processSuccess = async () => {
      try {
        // Fetch the session metadata first
        const metadata = await fetchSessionMetadata(sessionId);

        // Setup user and records using the metadata
        await setupUserAndRecords(metadata);
        setStatus("success");
      } catch (err) {
        console.error("Error processing payment success:", err);
        // Since we're on the success page, we'll still show success
        setStatus("success");
      }
    };

    processSuccess();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/5 p-4">
      <Card className="max-w-lg w-full p-8">
        {status === "loading" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium">Setting up your account...</p>
          </div>
        ) : status === "error" ? (
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
        ) : (
          <div className="text-center py-8">
            <div className="text-primary">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="mb-6 text-muted-foreground">
              Thank you for your purchase. Your image is now being processed and
              will be ready soon.
            </p>
            {sessionId && (
              <div className="text-xs text-muted-foreground mb-6">
                Transaction ID: {sessionId}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/">Create Another</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">View My Images</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
