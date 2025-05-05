"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/supabase";

type PaymentStatus = "loading" | "success" | "error";

interface SessionData {
  userId: string;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isInitializingUser, setIsInitializingUser] = useState(true);

  /**
   * Fetches the user session data from the API
   */
  const fetchSessionUser = async (
    sessionId: string
  ): Promise<SessionData | null> => {
    const userResponse = await fetch(
      `/api/auth/get-session-user?session_id=${sessionId}`
    );

    if (!userResponse.ok) {
      console.warn("Could not retrieve session user, but continuing anyway");
      return null;
    }

    return await userResponse.json();
  };

  /**
   * Sets the user session in Supabase
   */
  const setUserSession = async (userData: SessionData): Promise<boolean> => {
    if (!userData.userId || !userData.session) {
      console.warn("No valid session data found");
      return false;
    }

    const { error: signInError } = await supabase.auth.setSession({
      access_token: userData.session.access_token,
      refresh_token: userData.session.refresh_token,
    });

    if (signInError) {
      console.error("Error setting session:", signInError);
      return false;
    }

    console.log("Successfully set session for user");
    return true;
  };

  /**
   * Handles the initialization of the user after payment
   */
  const initializeUser = async (sessionId: string): Promise<void> => {
    try {
      // Get the user for this session
      const userData = await fetchSessionUser(sessionId);

      // If we have user data, set the session
      if (userData) {
        await setUserSession(userData);
      }
    } catch (userError) {
      console.error("Error initializing user:", userError);
    } finally {
      setIsInitializingUser(false);
    }
  };

  // Check if the payment is successful and initialize the user
  useEffect(() => {
    // Handle missing session ID
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found. Something went wrong.");
      setIsInitializingUser(false);
      return;
    }

    const processPayment = async () => {
      try {
        // Assume payment is successful since we've reached this page
        setStatus("success");

        // Initialize the user
        await initializeUser(sessionId);
      } catch (err) {
        console.error("Error processing payment success:", err);
        // Fallback to success in case of errors since we're already on the success page
        setStatus("success");
        setIsInitializingUser(false);
      }
    };

    processPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/5 p-4">
      <Card className="max-w-lg w-full p-8">
        {status === "loading" || isInitializingUser ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-medium">
              {status === "loading"
                ? "Verifying your payment..."
                : "Setting up your account..."}
            </p>
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
