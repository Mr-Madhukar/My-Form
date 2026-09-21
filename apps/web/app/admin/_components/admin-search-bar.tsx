"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";

interface AdminSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search…",
}: AdminSearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 bg-zinc-950/60 border-zinc-800/80 text-xs h-9 text-zinc-200 placeholder:text-zinc-500 rounded-xl"
      />
    </div>
  );
}
