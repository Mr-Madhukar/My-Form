"use client";

import { useState } from "react";
import { Zap, Plus, Trash2, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { FieldCondition, ConditionOperator, ConditionAction } from "@repo/forms";

type Field = {
  id: string;
  label: string;
  type: string;
  config: Record<string, unknown>;
};

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
];

const ACTIONS: { value: ConditionAction; label: string; color: string }[] = [
  { value: "show", label: "Show this field", color: "#10B981" },
  { value: "hide", label: "Hide this field", color: "#F43F5E" },
  { value: "require", label: "Make required", color: "#F59E0B" },
];

const EASE = "transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]";

function generateId() {
  return `cond_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ConditionalPanel({
  currentFieldId,
  fields,
  conditions,
  onChange,
}: {
  currentFieldId: string;
  fields: Field[];
  conditions: FieldCondition[];
  onChange: (conditions: FieldCondition[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  // Fields that can be sources (all fields except the current one)
  const sourceFields = fields.filter((f) => f.id !== currentFieldId);

  const addCondition = () => {
    const first = sourceFields[0];
    if (!first) return;
    const newCondition: FieldCondition = {
      id: generateId(),
      sourceFieldId: first.id,
      operator: "equals",
      value: "",
      action: "show",
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FieldCondition>) => {
    onChange(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id));
  };

  const needsValue = (op: ConditionOperator) =>
    !["is_empty", "is_not_empty"].includes(op);

  return (
    <div className="border-t border-white/[0.06] pt-4">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-[#F59E0B]/10">
            <Zap className="size-3 text-[#F59E0B]" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
            Conditional Logic
          </span>
          {conditions.length > 0 && (
            <span className="rounded-full bg-[#F59E0B]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#F59E0B]">
              {conditions.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-[#4A4A4A]",
            EASE,
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3">
          {conditions.length === 0 && (
            <p className="text-[11px] text-[#4A4A4A] italic">
              No conditions set. This field is always visible.
            </p>
          )}

          {conditions.map((condition) => {
            const sourceField = sourceFields.find((f) => f.id === condition.sourceFieldId);
            return (
              <div
                key={condition.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2.5"
              >
                {/* Action selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={condition.action}
                    onChange={(e) =>
                      updateCondition(condition.id, { action: e.target.value as ConditionAction })
                    }
                    className="rounded-lg border border-white/[0.08] bg-[#141414] px-2 py-1 text-[11px] text-[#F2F2F2] outline-none focus:border-[#F59E0B]/40"
                  >
                    {ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#4A4A4A]">when</span>
                  <button
                    type="button"
                    onClick={() => removeCondition(condition.id)}
                    className="ml-auto rounded-md p-1 text-[#4A4A4A] hover:bg-white/[0.06] hover:text-[#F43F5E]"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>

                {/* Source field selector */}
                <select
                  value={condition.sourceFieldId}
                  onChange={(e) =>
                    updateCondition(condition.id, { sourceFieldId: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141414] px-2.5 py-1.5 text-[11px] text-[#F2F2F2] outline-none focus:border-[#F59E0B]/40"
                >
                  {sourceFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label || "Untitled field"}
                    </option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(condition.id, { operator: e.target.value as ConditionOperator })
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141414] px-2.5 py-1.5 text-[11px] text-[#F2F2F2] outline-none focus:border-[#F59E0B]/40"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value input (only for operators that need it) */}
                {needsValue(condition.operator) && (
                  <input
                    type="text"
                    value={String(condition.value ?? "")}
                    onChange={(e) =>
                      updateCondition(condition.id, { value: e.target.value })
                    }
                    placeholder="Enter value..."
                    className="w-full rounded-lg border border-white/[0.08] bg-[#141414] px-2.5 py-1.5 text-[11px] text-[#F2F2F2] placeholder-[#3A3A3A] outline-none focus:border-[#F59E0B]/40"
                  />
                )}
              </div>
            );
          })}

          {/* Add condition button */}
          {sourceFields.length > 0 && (
            <button
              type="button"
              onClick={addCondition}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] py-2 text-[11px] text-[#4A4A4A]",
                EASE,
                "hover:border-[#F59E0B]/30 hover:text-[#F59E0B]",
              )}
            >
              <Plus className="size-3" />
              Add condition
            </button>
          )}
        </div>
      )}
    </div>
  );
}
