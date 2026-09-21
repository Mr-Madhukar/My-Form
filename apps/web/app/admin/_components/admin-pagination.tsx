"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface AdminPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly itemLabel: string;
  readonly onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60 bg-zinc-950/40 text-xs">
      <span className="text-zinc-500">
        Page {page} of {totalPages} ({total} {itemLabel})
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 text-xs border-zinc-800"
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 text-xs border-zinc-800"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
