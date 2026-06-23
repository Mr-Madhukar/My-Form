"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "~/trpc/client";
import { useAuthStore } from "~/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { _setUser, _setLoading, _setLogout, _setLogoutAll } = useAuthStore();
  const [hasLoggedInCookie, setHasLoggedInCookie] = useState<boolean | null>(null);

  useEffect(() => {
    const exists = typeof document !== "undefined" && document.cookie.includes("logged_in=true");
    setHasLoggedInCookie(exists);
    if (!exists) {
      _setUser(null);
      _setLoading(false);
    }
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: hasLoggedInCookie === true,
  });

  const refreshMutation = trpc.auth.refreshToken.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const logoutAllMutation = trpc.auth.logoutAll.useMutation();
  const refreshAttempted = useRef(false);

  useEffect(() => {
    if (!meQuery.data) return;
    refreshAttempted.current = false;
    _setUser(meQuery.data);
    _setLoading(false);
  }, [meQuery.data]);

  // On 401, attempt a silent token refresh once then re-fetch
  useEffect(() => {
    if (!meQuery.error) return;
    if (refreshAttempted.current || refreshMutation.isPending) {
      _setUser(null);
      _setLoading(false);
      return;
    }
    refreshAttempted.current = true;
    refreshMutation.mutate(undefined, {
      onSuccess: () => meQuery.refetch(),
      onError: () => {
        _setUser(null);
        _setLoading(false);
      },
    });
  }, [meQuery.error]);

  useEffect(() => {
    if (hasLoggedInCookie === false) {
      _setLoading(false);
      return;
    }
    _setLoading(meQuery.isLoading || refreshMutation.isPending);
  }, [hasLoggedInCookie, meQuery.isLoading, refreshMutation.isPending]);

  useEffect(() => {
    _setLogout(async () => {
      await logoutMutation.mutateAsync(undefined);
      _setUser(null);
      window.location.href = "/login";
    });
    _setLogoutAll(async () => {
      await logoutAllMutation.mutateAsync(undefined);
      _setUser(null);
      window.location.href = "/login";
    });
  }, []);

  return <>{children}</>;
}
