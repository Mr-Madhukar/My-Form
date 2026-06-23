import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const isServer = typeof window === "undefined";
  const url = isServer
    ? (env.NEXT_PUBLIC_API_URL ? `${env.NEXT_PUBLIC_API_URL}/trpc` : "/trpc")
    : "/trpc";
  return c({
    url,
    headers: opts?.headers,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
