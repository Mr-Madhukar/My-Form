"use client";

interface FilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface AdminFilterPillsProps<T extends string> {
  readonly options: readonly FilterOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly activeClassName?: string;
}

export function AdminFilterPills<T extends string>({
  options,
  value,
  onChange,
  activeClassName = "bg-[#E8854A] text-black font-semibold shadow-xs",
}: AdminFilterPillsProps<T>) {
  return (
    <div className="flex items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
            value === opt.value
              ? activeClassName
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
