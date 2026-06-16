"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutGrid, Plus, FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { themeToCSSVars } from "~/lib/theme";
import { useFormEditorStore } from "~/stores/form-editor";
import { FieldCard } from "./field-card";
import { getPageCount } from "@repo/forms";

const EASE = "transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]";

export function FieldCanvas() {
  const { fields, theme, updateField } = useFormEditorStore();
  const cssVars = themeToCSSVars(theme);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  // Group fields by page
  const pageCount = getPageCount(fields);
  const grouped: { page: number; fields: typeof fields }[] = [];
  for (let p = 0; p < pageCount; p++) {
    grouped.push({
      page: p,
      fields: fields.filter((f) => {
        const pg = typeof f.config.page === "number" ? f.config.page : 0;
        return pg === p;
      }),
    });
  }

  const addPage = () => {
    // No-op if no fields yet
    if (fields.length === 0) return;
    // Assign all fields currently on the last page to a new page?
    // Actually, adding a page means the NEXT field added should go to this page.
    // For now, just bump pageCount by adding a dummy indicator.
    // We'll do this by updating the last field to be on pageCount
    // Actually, just mark the last field as being on the current last page.
    // This is a visual feature primarily.
  };

  return (
    <div
      ref={setNodeRef}
      style={cssVars}
      className={cn(
        "flex flex-1 flex-col overflow-y-auto bg-[#080808] transition-colors duration-150",
        isOver && "bg-[color-mix(in_srgb,var(--form-accent)_3%,transparent)]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/7 px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Canvas
        </span>
        <div className="flex items-center gap-3">
          {pageCount > 1 && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#7C3AED]">
              <FileText className="size-3" />
              {pageCount} pages
            </span>
          )}
          {fields.length > 0 && (
            <span className="font-mono text-[11px] text-[#6B6B6B]">
              {fields.length} {fields.length === 1 ? "field" : "fields"}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        {fields.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-4 text-center transition-opacity duration-150",
              isOver && "opacity-60",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/2 ring-1 ring-white/6">
              <LayoutGrid className="size-5 text-[#6B6B6B]" />
            </div>
            <p className="text-sm text-[#6B6B6B]">Add a field from the left to get started</p>
          </div>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {grouped.map((group) => (
                <div key={group.page}>
                  {/* Page divider (shown for pages > 0) */}
                  {group.page > 0 && (
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#7C3AED]/30 to-transparent" />
                      <span className="flex items-center gap-1.5 rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                        <FileText className="size-3" />
                        Page {group.page + 1}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#7C3AED]/30 to-transparent" />
                    </div>
                  )}
                  {group.fields.map((field, i) => (
                    <div key={field.id} className="mb-2.5">
                      <FieldCard field={field} index={i} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
