"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean | null;
  role: string;
  isBanned: boolean;
  formsCount: number;
  responsesCount: number;
  createdAt: Date | string;
};

function UserRow({
  user,
  onSelectAction,
}: {
  readonly user: AdminUser;
  readonly onSelectAction: (user: AdminUser, type: "role" | "ban") => void;
}) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0 ring-1 ring-zinc-800">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200 truncate">
                {user.fullName}
              </span>
              {user.emailVerified ? (
                <span title="Email Verified">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                </span>
              ) : (
                <span title="Email Unverified">
                  <XCircle className="size-3 text-zinc-500 shrink-0" />
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-zinc-500 block truncate">
              {user.email}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          {user.role === "admin" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/20">
              <ShieldCheck className="size-3" />
              Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/40">
              User
            </span>
          )}

          {user.isBanned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-300 border border-red-500/20">
              Banned
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 font-mono text-zinc-300">
        {user.formsCount}
      </td>

      <td className="px-4 py-3.5 font-mono text-zinc-300">
        {user.responsesCount.toLocaleString()}
      </td>

      <td className="px-4 py-3.5 text-zinc-400">
        {format(new Date(user.createdAt), "MMM d, yyyy")}
      </td>

      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectAction(user, "role")}
            className="h-8 px-2.5 text-xs text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
          >
            {user.role === "admin" ? "Demote" : "Promote"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectAction(user, "ban")}
            className={`h-8 px-2.5 text-xs ${
              user.isBanned
                ? "text-emerald-400 hover:bg-emerald-500/10"
                : "text-red-400 hover:bg-red-500/10"
            }`}
          >
            {user.isBanned ? "Unban" : "Ban"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function UserActionDialog({
  user,
  actionType,
  isPending,
  onClose,
  onConfirm,
}: {
  readonly user: AdminUser | null;
  readonly actionType: "role" | "ban" | null;
  readonly isPending: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}) {
  if (!user || !actionType) return null;

  const isRoleAction = actionType === "role";
  const targetRole = user.role === "admin" ? "user" : "admin";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-[#101014] border-zinc-800 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            {isRoleAction ? (
              <>
                <ShieldAlert className="size-4 text-amber-400" />
                {user.role === "admin" ? "Demote Admin to User" : "Promote User to Super Admin"}
              </>
            ) : (
              <>
                <Ban className="size-4 text-red-400" />
                {user.isBanned ? "Unsuspend User Account" : "Suspend User Account"}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 pt-2">
            {isRoleAction ? (
              <span>
                Are you sure you want to change the role of{" "}
                <strong className="text-zinc-200">{user.fullName}</strong> ({user.email}) to{" "}
                <strong className="text-[#E8854A]">{targetRole}</strong>? Admin users have full access
                to platform moderation and analytics.
              </span>
            ) : (
              <span>
                Are you sure you want to {user.isBanned ? "unsuspend" : "suspend"}{" "}
                <strong className="text-zinc-200">{user.fullName}</strong> ({user.email})?
                Suspended users will be immediately logged out and blocked from accessing their forms
                and dashboard.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="border-zinc-800 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className={`text-xs font-semibold ${
              actionType === "ban" && !user.isBanned
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#E8854A] hover:bg-[#E8854A]/90 text-black"
            }`}
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<"role" | "ban" | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.listUsers.useQuery(
    {
      page,
      limit: 15,
      search: search.trim() || undefined,
      role: roleFilter,
      status: statusFilter,
    },
    { placeholderData: (prev) => prev },
  );

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      utils.admin.listUsers.invalidate();
      utils.admin.getPlatformStats.invalidate();
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  const toggleBanMutation = trpc.admin.toggleUserBan.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isBanned ? "User account suspended" : "User account unsuspended");
      utils.admin.listUsers.invalidate();
      utils.admin.getPlatformStats.invalidate();
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update ban status");
    },
  });

  function handleActionSelect(user: AdminUser, type: "role" | "ban") {
    setSelectedUser(user);
    setActionType(type);
  }

  function handleConfirmAction() {
    if (!selectedUser || !actionType) return;

    if (actionType === "role") {
      const newRole = selectedUser.role === "admin" ? "user" : "admin";
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    } else {
      toggleBanMutation.mutate({
        userId: selectedUser.id,
        isBanned: !selectedUser.isBanned,
      });
    }
  }

  function renderTableBody() {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
          <Loader2 className="size-6 animate-spin text-[#E8854A]" />
          <span className="text-xs font-mono text-zinc-500">Fetching users directory…</span>
        </div>
      );
    }

    if (!data || data.users.length === 0) {
      return (
        <div className="p-12 text-center">
          <Users className="size-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400 font-medium">No users found</p>
          <p className="text-xs text-zinc-600 mt-1">Try changing your search or filters.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/60 border-b border-zinc-800/60 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Forms</th>
              <th className="px-4 py-3">Responses</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data.users.map((u) => (
              <UserRow key={u.id} user={u} onSelectAction={handleActionSelect} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Users className="size-6 text-blue-400" />
          Users & Access Management
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Inspect registered accounts, manage administrative roles, and enforce moderation.
        </p>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/60 backdrop-blur-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="pl-9 bg-zinc-950/60 border-zinc-800/80 text-xs h-9 text-zinc-200 placeholder:text-zinc-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-0.5 text-xs">
            {(["all", "admin", "user"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  roleFilter === r
                    ? "bg-[#E8854A] text-black font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r === "all" ? "All Roles" : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-0.5 text-xs">
            {(["all", "active", "banned"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden backdrop-blur-xs">
        {renderTableBody()}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/40 text-xs">
            <span className="text-zinc-500">
              Page {data.currentPage} of {data.totalPages} ({data.total} users)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs border-zinc-800"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs border-zinc-800"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <UserActionDialog
        user={selectedUser}
        actionType={actionType}
        isPending={updateRoleMutation.isPending || toggleBanMutation.isPending}
        onClose={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
