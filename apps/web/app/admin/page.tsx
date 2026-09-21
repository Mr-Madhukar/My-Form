"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  FileText,
  MessageSquare,
  Building2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { trpc } from "~/trpc/client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

export default function AdminOverviewPage() {
  const { data: stats, isLoading, error } = trpc.admin.getPlatformStats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: health } = trpc.admin.getSystemHealth.useQuery(undefined, {
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-7 animate-spin text-[#E8854A]" />
        <span className="text-sm font-mono text-zinc-500">Loading platform metrics…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm text-red-400">Failed to load platform stats: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Platform Analytics & Health
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global metrics, registered creators, forms activity, and infrastructure status.
          </p>
        </div>

        {health && (
          <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-300 font-mono">DB {health.database.latencyMs}ms</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-300 font-mono">Redis {health.redis.latencyMs}ms</span>
            </div>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400 font-mono">{health.uptimeSeconds}s uptime</span>
          </div>
        )}
      </div>

      {/* Top Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-xs relative overflow-hidden group hover:border-zinc-700/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Users</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-medium font-mono">+{stats.newUsersThisMonth}</span>
            <span>in the last 30 days</span>
          </div>
        </div>

        {/* Total Workspaces */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-xs relative overflow-hidden group hover:border-zinc-700/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Workspaces</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {stats.totalWorkspaces.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Active creator organizations
          </div>
        </div>

        {/* Total Forms */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-xs relative overflow-hidden group hover:border-zinc-700/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Created Forms</span>
            <div className="p-2 rounded-xl bg-[#E8854A]/10 text-[#E8854A]">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {stats.totalForms.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
            <span className="text-[#E8854A] font-medium font-mono">{stats.publishedForms}</span>
            <span>published & live</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur-xs relative overflow-hidden group hover:border-zinc-700/60 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Responses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-white">
            {stats.totalResponses.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Completed form submissions
          </div>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="size-4 text-[#E8854A]" />
              Platform Activity Trend (Last 14 Days)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Daily trajectory of new creator signups vs form submissions
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#E8854A]" />
              <span className="text-zinc-300">Responses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-400" />
              <span className="text-zinc-300">New Signups</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="submissionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8854A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E8854A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => {
                  try {
                    return format(new Date(val), "MMM d");
                  } catch {
                    return val;
                  }
                }}
              />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f4f4f5",
                }}
              />
              <Area
                type="monotone"
                dataKey="submissions"
                stroke="#E8854A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#submissionsGrad)"
                name="Responses"
              />
              <Area
                type="monotone"
                dataKey="signups"
                stroke="#60A5FA"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#signupsGrad)"
                name="Signups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Recent Signups & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="size-4 text-blue-400" />
              Recent Creator Signups
            </h2>
            <Link
              href="/admin/users"
              className="text-xs text-[#E8854A] hover:underline flex items-center gap-1 font-medium"
            >
              <span>View all users</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {stats.recentSignups.map((u) => {
              const initials = u.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-8 shrink-0 ring-1 ring-zinc-800">
                      <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300 font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {u.fullName}
                        </span>
                        {u.role === "admin" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            Admin
                          </span>
                        )}
                        {u.isBanned && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/15 text-red-300 border border-red-500/20">
                            Banned
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 block truncate">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-zinc-400 block">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick System Navigation */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="size-4 text-amber-400" />
              Administrative Portals
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Direct access to platform-level administrative tools.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Users className="size-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-zinc-200 block">User Management</span>
                    <span className="text-[10px] text-zinc-400">Roles, accounts, and suspensions</span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </Link>

              <Link
                href="/admin/forms"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#E8854A]/10 text-[#E8854A]">
                    <FileText className="size-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-zinc-200 block">Forms Moderation</span>
                    <span className="text-[10px] text-zinc-400">Audit, inspect, & toggle platform forms</span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </Link>

              <Link
                href="/admin/system"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Activity className="size-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-zinc-200 block">System Diagnostics</span>
                    <span className="text-[10px] text-zinc-400">Database, Redis & server health</span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center">
            <span className="text-[11px] text-zinc-400">
              Admin session secured with encrypted HttpOnly tokens
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
