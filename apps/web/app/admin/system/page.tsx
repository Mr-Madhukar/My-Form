"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  HardDrive,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";

export default function AdminSystemPage() {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: health, isLoading, error } = trpc.admin.getSystemHealth.useQuery(undefined, {
    refetchInterval: 10000,
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    await utils.admin.getSystemHealth.invalidate();
    setTimeout(() => setIsRefreshing(false), 500);
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="size-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono text-zinc-500">Checking system infrastructure…</span>
        </div>
      );
    }

    if (error || !health) {
      return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400 text-xs">
          Failed to load system diagnostics: {error?.message}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Service Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PostgreSQL DB */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Database className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">PostgreSQL Database</h2>
                  <span className="text-[11px] text-zinc-500">Neon Serverless Cloud</span>
                </div>
              </div>

              {health.database.status === "connected" ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="size-3.5" />
                  <span>Operational</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  <AlertCircle className="size-3.5" />
                  <span>Unreachable</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Ping Latency</span>
                <span className="font-mono text-zinc-200 font-semibold text-sm">
                  {health.database.latencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">ORM Engine</span>
                <span className="font-mono text-zinc-200 text-xs">Drizzle ORM</span>
              </div>
            </div>
          </div>

          {/* Redis Cache */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <HardDrive className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Redis Cache & Rate Limiter</h2>
                  <span className="text-[11px] text-zinc-500">Upstash Serverless Redis</span>
                </div>
              </div>

              {health.redis.status === "connected" ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="size-3.5" />
                  <span>Operational</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  <AlertCircle className="size-3.5" />
                  <span>Disconnected</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Ping Latency</span>
                <span className="font-mono text-zinc-200 font-semibold text-sm">
                  {health.redis.latencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Features</span>
                <span className="font-mono text-zinc-200 text-xs">Rate Limit & Session Revocation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Node Runtime Metrics */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xs">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Server className="size-4 text-amber-400" />
            API Server Runtime Diagnostics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-xl">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Server Uptime
              </span>
              <span className="text-xl font-bold font-mono text-zinc-200 mt-1 block">
                {Math.floor(health.uptimeSeconds / 60)} min {health.uptimeSeconds % 60}s
              </span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-xl">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Node.js Version
              </span>
              <span className="text-xl font-bold font-mono text-zinc-200 mt-1 block">
                {health.nodeVersion}
              </span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-xl">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Memory (Heap Used)
              </span>
              <span className="text-xl font-bold font-mono text-zinc-200 mt-1 block">
                {health.memoryHeapUsedMb} MB
              </span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-xl">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-semibold">
                Environment
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400 capitalize mt-1 block">
                {health.environment}
              </span>
            </div>
          </div>

          <div className="mt-5 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/50 pt-3">
            <span>Last health check timestamp:</span>
            <span className="font-mono text-zinc-400">
              {format(new Date(health.checkedAt), "PPpp")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="size-6 text-emerald-400" />
            System & Infrastructure Health
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time latency metrics for database clusters, Redis cache, and Node.js process runtime.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isRefreshing || isLoading}
          onClick={handleRefresh}
          className="h-8 border-zinc-800 text-xs text-zinc-300 hover:text-white"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Run Health Diagnostic
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}
