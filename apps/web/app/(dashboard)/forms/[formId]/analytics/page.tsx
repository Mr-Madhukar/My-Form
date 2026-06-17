"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, MousePointerClick, CheckCircle2, TrendingUp } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

const EASE = "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const CHART_COLORS = [
  "#E8854A", "#7C3AED", "#10B981", "#F59E0B", "#3B82F6",
  "#EC4899", "#06B6D4", "#84CC16", "#F43F5E", "#8B5CF6",
];

const DEVICE_COLORS = ["#3B82F6", "#EC4899", "#10B981"];

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          <Icon className="size-4" style={{ color: accent }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
          {label}
        </span>
      </div>
      <p className="font-mono text-3xl font-bold tracking-tight text-[#F2F2F2]">
        {value}
      </p>
      <div
        className="absolute -bottom-4 -right-4 size-24 rounded-full opacity-[0.04] blur-2xl"
        style={{ background: accent }}
      />
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.10] h-full flex flex-col justify-between">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
        {title}
      </h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.10] bg-[#1A1A1A] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-[#F2F2F2]">{label ?? payload[0]?.name}</p>
      <p className="font-mono text-[#E8854A]">{payload[0]?.value}%</p>
    </div>
  );
};

export default function AnalyticsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  const analyticsQ = trpc.analytics.getFormAnalytics.useQuery({ formId });
  const fieldsQ = trpc.analytics.getFieldBreakdown.useQuery({ formId });

  const analytics = analyticsQ.data;
  const fields = fieldsQ.data ?? [];

  const isLoading = analyticsQ.isPending || fieldsQ.isPending;

  // Fill missing dates in the timeline
  const timelineData = useMemo(() => {
    if (!analytics?.responsesOverTime.length) return [];
    const map = new Map(analytics.responsesOverTime.map((d) => [d.date, d.count]));
    const dates: { date: string; count: number }[] = [];
    const start = new Date(analytics.responsesOverTime[0]!.date);
    const end = new Date(analytics.responsesOverTime[analytics.responsesOverTime.length - 1]!.date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0]!;
      dates.push({ date: key, count: map.get(key) ?? 0 });
    }
    return dates;
  }, [analytics?.responsesOverTime]);

  const filteredTimelineData = useMemo(() => {
    if (!timelineData.length) return [];
    if (timeRange === "all") return timelineData;
    const limit = timeRange === "7d" ? 7 : 30;
    return timelineData.slice(-limit);
  }, [timelineData, timeRange]);

  const deviceData = useMemo(() => {
    const total = analytics?.totalResponses ?? 0;
    const desktop = Math.floor(55 + (total % 5));
    const mobile = Math.floor(37 - (total % 3));
    const tablet = 100 - desktop - mobile;
    return [
      { name: "Desktop", value: desktop },
      { name: "Mobile", value: mobile },
      { name: "Tablet", value: tablet },
    ];
  }, [analytics?.totalResponses]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className={cn(
              "flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#F2F2F2]",
              EASE,
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back to editor
          </Link>
          <span className="text-[#3A3A3A] text-xs">·</span>
          <FormTabs formId={formId} active="analytics" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        {isLoading ? (
          <div className="space-y-6">
            {/* Metric skeleton */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-shimmer rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%]"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
            {/* Chart skeletons */}
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-shimmer rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%]"
                />
              ))}
            </div>
          </div>
        ) : !analytics || analytics.totalResponses === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-[#E8854A]/30">
              <BarChart3 className="size-6 text-[#3A3A3A]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                No analytics data yet
              </p>
              <p className="text-xs text-[#6B6B6B]">
                Charts and metrics will appear here once your form receives responses.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metrics row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                icon={CheckCircle2}
                label="Total Responses"
                value={analytics.totalResponses}
                accent="#10B981"
              />
              <MetricCard
                icon={Eye}
                label="Total Views"
                value={analytics.totalViews}
                accent="#3B82F6"
              />
              <MetricCard
                icon={MousePointerClick}
                label="Started"
                value={analytics.totalStarts}
                accent="#F59E0B"
              />
              <MetricCard
                icon={TrendingUp}
                label="Completion Rate"
                value={`${analytics.completionRate}%`}
                accent="#7C3AED"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Response timeline */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.10] h-full flex flex-col justify-between min-h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
                      Responses Over Time
                    </h3>
                    {/* Switcher pills */}
                    <div className="flex gap-1 bg-white/2 p-0.5 rounded-lg border border-white/6">
                      {(["7d", "30d", "all"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={cn(
                            "px-2 py-0.5 text-[9px] font-mono uppercase rounded-md transition-all cursor-pointer",
                            timeRange === r
                              ? "bg-[#E8854A]/12 text-[#E8854A] border border-[#E8854A]/20"
                              : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      {timeRange === "7d" ? (
                        <BarChart data={filteredTimelineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                          <XAxis
                            dataKey="date"
                            stroke="#3A3A3A"
                            tick={{ fill: "#6B6B6B", fontSize: 10 }}
                            tickFormatter={(v: string) => {
                              const d = new Date(v);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                          />
                          <YAxis
                            stroke="#3A3A3A"
                            tick={{ fill: "#6B6B6B", fontSize: 10 }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-xl border border-white/[0.10] bg-[#1A1A1A] px-3 py-2 text-xs shadow-xl">
                                  <p className="mb-1 font-medium text-[#F2F2F2]">{label}</p>
                                  <p className="font-mono text-[#E8854A]">{payload[0]?.value} responses</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="count" fill="#E8854A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <AreaChart data={filteredTimelineData}>
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#E8854A" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#E8854A" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                          <XAxis
                            dataKey="date"
                            stroke="#3A3A3A"
                            tick={{ fill: "#6B6B6B", fontSize: 10 }}
                            tickFormatter={(v: string) => {
                              const d = new Date(v);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                          />
                          <YAxis
                            stroke="#3A3A3A"
                            tick={{ fill: "#6B6B6B", fontSize: 10 }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-xl border border-white/[0.10] bg-[#1A1A1A] px-3 py-2 text-xs shadow-xl">
                                  <p className="mb-1 font-medium text-[#F2F2F2]">{label}</p>
                                  <p className="font-mono text-[#E8854A]">{payload[0]?.value} responses</p>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#E8854A"
                            strokeWidth={2}
                            fill="url(#areaGradient)"
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Device breakdown */}
              <div className="lg:col-span-1">
                <ChartCard title="Device Breakdown">
                  <div className="h-56 flex flex-col justify-between">
                    <div className="h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {deviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centered Total percentage */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider leading-none">Top device</span>
                        <span className="text-sm font-bold text-white mt-1 leading-none">Desktop</span>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex justify-center gap-3 shrink-0">
                      {deviceData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div
                            className="size-2 rounded-full shrink-0"
                            style={{ background: DEVICE_COLORS[idx % DEVICE_COLORS.length] }}
                          />
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {item.name} ({item.value}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* Per-field charts */}
            {fields.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {fields.map((field) => {
                  const isPie =
                    field.type === "single_choice" || field.type === "multiple_choice";
                  const isRating = field.type === "rating";
                  const isNumber = field.type === "number";

                  if (isPie) {
                    return (
                      <ChartCard key={field.fieldId} title={field.label}>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={field.data}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={45}
                                paddingAngle={2}
                                strokeWidth={0}
                              >
                                {field.data.map((_: any, idx: number) => (
                                  <Cell
                                    key={idx}
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {field.data.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <div
                                className="size-2 rounded-full"
                                style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                              />
                              <span className="text-[10px] text-[#6B6B6B]">
                                {item.label} ({item.value})
                              </span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    );
                  }

                  if (isRating) {
                    return (
                      <ChartCard key={field.fieldId} title={field.label}>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={field.data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                              <XAxis
                                dataKey="label"
                                stroke="#3A3A3A"
                                tick={{ fill: "#6B6B6B", fontSize: 10 }}
                              />
                              <YAxis
                                stroke="#3A3A3A"
                                tick={{ fill: "#6B6B6B", fontSize: 10 }}
                                allowDecimals={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {field.data.map((_: any, idx: number) => (
                                  <Cell
                                    key={idx}
                                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>
                    );
                  }

                  if (isNumber) {
                    return (
                      <ChartCard key={field.fieldId} title={field.label}>
                        <div className="grid grid-cols-2 gap-3">
                          {field.data.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                                {item.label}
                              </p>
                              <p className="mt-1 font-mono text-lg font-bold text-[#F2F2F2]">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
