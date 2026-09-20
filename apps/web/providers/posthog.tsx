"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuthStore } from "~/stores/auth";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

function UserIdentifier() {
  const user = useAuthStore((s) => s.user);
  const ph = usePostHog();

  useEffect(() => {
    if (user) {
      ph.identify(user.id, {
        email: user.email,
        name: user.fullName,
      });
    } else {
      ph.reset();
    }
  }, [user, ph]);

  return null;
}

export function PostHogProvider({ children }: { readonly children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <UserIdentifier />
      {children}
    </PHProvider>
  );
}
