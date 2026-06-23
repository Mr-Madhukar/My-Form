"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";

const bezelClass =
  "animate-fade-up rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]";
const cardClass =
  "gap-6 rounded-[1.4rem] border-0 bg-[#111] py-7 text-[#F2F2F2] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04]";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const code = searchParams.get("code");
  const called = useRef(false);

  const exchangeMutation = trpc.auth.exchangeTempCode.useMutation({
    onSuccess: () => {
      utils.auth.me.reset();
      toast.success("Successfully signed in with Google!");
      router.push("/forms");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to complete Google Sign-in.");
      router.push("/login?error=oauth_failed");
    },
  });

  useEffect(() => {
    if (code && !called.current) {
      called.current = true;
      exchangeMutation.mutate({ code });
    } else if (!code && !called.current) {
      called.current = true;
      router.push("/login");
    }
  }, [code, router, exchangeMutation]);

  return (
    <div className={bezelClass}>
      <Card className={`${cardClass} min-h-[300px] flex flex-col items-center justify-center`}>
        <div className="flex flex-col items-center gap-4 text-center px-6">
          {exchangeMutation.isError ? (
            <>
              <span className="size-10 flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl font-bold">
                ✕
              </span>
              <p className="text-sm text-[#E8854A]">Google Sign-in failed. Redirecting to login...</p>
            </>
          ) : (
            <>
              <span className="size-6 animate-spin rounded-full border-2 border-[#E8854A] border-t-transparent" />
              <h2 className="text-xl font-semibold">Completing Sign-in</h2>
              <p className="text-sm text-[#6B6B6B]">Please wait while we secure your session...</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className={bezelClass}>
          <Card className={`${cardClass} min-h-[300px] flex flex-col items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
              <span className="size-6 animate-spin rounded-full border-2 border-[#E8854A] border-t-transparent" />
              <p className="text-sm text-[#6B6B6B]">Loading...</p>
            </div>
          </Card>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
