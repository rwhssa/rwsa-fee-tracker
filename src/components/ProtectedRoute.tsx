"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Only act after authentication state is determined
      if (user === null) {
        router.push("/login");
        return;
      }

      const authorizedEmails = (
        process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || ""
      ).split(",");
      if (user && user.email && authorizedEmails.includes(user.email)) {
        // User is authorized, do nothing (allow children to render)
      } else {
        router.push("/unauthorized"); // Redirect to an unauthorized page
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner size="lg" text="載入中" variant="dots" />
      </div>
    );
  }

  // If not loading and user is null or unauthorized, the useEffect will handle redirection.
  // Otherwise, render children.
  if (
    user &&
    (process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || "")
      .split(",")
      .includes(user.email || "")
  ) {
    return <>{children}</>;
  } else {
    return null; // Or a more specific message/component for unauthorized state before redirect
  }
}
