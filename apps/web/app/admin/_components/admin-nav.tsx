"use client";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";

type AdminHeaderNavProps = {
  readonly user: {
    readonly fullName: string;
    readonly email: string;
  };
};

export function AdminHeaderNav({ user }: AdminHeaderNavProps) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2.5">

      <div className="flex items-center gap-2 pl-2 border-l border-zinc-800/80">
        <Avatar className="size-7 ring-1 ring-amber-500/40">
          <AvatarFallback className="bg-amber-500/15 text-[11px] font-bold text-amber-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-medium text-zinc-200 leading-tight">
            {user.fullName}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 leading-tight">
            Admin
          </span>
        </div>
      </div>
    </div>
  );
}
