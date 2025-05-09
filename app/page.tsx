"use client";

import {
  Hero,
  Features,
  Examples,
  CTA,
  Footer,
  UploadSection,
} from "@/lib/components/home";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/utils/supabase/client";

interface SessionMetadata {
  imageUrl?: string;
  prompt?: string;
  imageId?: string;
  imagePath?: string;
}

export default function Home() {
  const handleGetSessionMetadata = async (): Promise<SessionMetadata> => {
    const sessionId =
      "cs_test_a118pE7EfO1n5FNqN9ApekjDUZqRRYORdjesC3dmojpEqsgBOnAW5hlHC0";

    try {
      const response = await fetch(
        `/api/get-session-metadata?session_id=${sessionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch session metadata");
      }

      const data = await response.json();
      console.log("Session metadata:", data);
      return data.metadata || {};
    } catch (error) {
      console.error("Error fetching session metadata:", error);
      return {};
    }
  };

  const handleCreateAnonymous = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Error signing in anonymously:", error);
    } else {
      console.log("Signed in anonymously:", data);
    }
  };
  const handleGetSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (data?.session?.expires_at) {
      console.log(
        "Session expires at:",
        new Date(data?.session?.expires_at * 1000)
      );
      console.log(
        "Time remaining:",
        data?.session?.expires_at - Math.floor(Date.now() / 1000),
        "seconds"
      );
    }
    if (error) {
      console.error("Error getting session:", error);
    } else {
      console.log("Session:", data);
    }
  };

  const handleGetUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log("User data:", data.user);
    if (error) {
      console.error("Error getting user:", error);
    } else {
      console.log("User:", data);
    }
  };

  const handleGetUserFromServer = async () => {
    const response = await fetch("/api/auth/get-user");
    const data = await response.json();
    console.log("User data from server:", data);
  };
  const handleRefreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
    } else {
      console.log("Refreshed Session:", data);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Button onClick={handleCreateAnonymous}>Create Anonymous</Button>
      <Button onClick={handleGetUser}>Get User</Button>
      <Button onClick={handleGetUserFromServer}>Get User From Server</Button>
      <Button onClick={handleGetSession}>Get Session</Button>
      <Button onClick={handleRefreshSession}>Refresh Session</Button>
      <Button onClick={handleGetSessionMetadata}>Get Session Metadata</Button>
      <Hero />
      <Features />
      <UploadSection />
      <Examples />
      <CTA />
      <Footer />
    </main>
  );
}
