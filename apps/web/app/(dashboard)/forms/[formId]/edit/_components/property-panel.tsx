"use client";

import { useFormEditorStore } from "~/stores/form-editor";
import { ShortTextPanel } from "./panels/short-text-panel";
import { LongTextPanel } from "./panels/long-text-panel";
import { EmailPanel } from "./panels/email-panel";
import { NumberPanel } from "./panels/number-panel";
import { SingleChoicePanel } from "./panels/single-choice-panel";
import { MultipleChoicePanel } from "./panels/multiple-choice-panel";
import { RatingPanel } from "./panels/rating-panel";
import { DatePanel } from "./panels/date-panel";
import { FileUploadPanel } from "./panels/file-upload-panel";
import { TimePanel } from "./panels/time-panel";
import { UrlPanel } from "./panels/url-panel";
import { ConditionalPanel } from "./panels/conditional-panel";
import { ThemePanel } from "./theme-panel";
import type { FieldCondition } from "@repo/forms";
import type { EditorField } from "~/stores/form-editor";

const PANEL_COMPONENTS: Record<
  string,
  React.ComponentType<{ readonly field: EditorField }>
> = {
  short_text: ShortTextPanel,
  long_text: LongTextPanel,
  email: EmailPanel,
  number: NumberPanel,
  single_choice: SingleChoicePanel,
  multiple_choice: MultipleChoicePanel,
  rating: RatingPanel,
  date: DatePanel,
  file_upload: FileUploadPanel,
  time: TimePanel,
  url: UrlPanel,
};

function renderFieldPanel(field: EditorField | undefined): React.ReactNode {
  if (!field) return null;
  const Component = PANEL_COMPONENTS[field.type];
  return Component ? <Component field={field} /> : null;
}

export function PropertyPanel() {
  const { fields, selectedFieldId, updateField } = useFormEditorStore();
  const field = fields.find((f) => f.id === selectedFieldId);

  // Extract conditions from the field config (stored in config.conditions)
  const conditions: FieldCondition[] =
    field && Array.isArray(field.config.conditions)
      ? (field.config.conditions as FieldCondition[])
      : [];

  const handleConditionsChange = (newConditions: FieldCondition[]) => {
    if (!field) return;
    updateField(field.id, {
      config: { ...field.config, conditions: newConditions },
    });
  };

  const fieldPanel = renderFieldPanel(field);

  return (
    <aside className="flex h-full w-70 shrink-0 flex-col border-l border-white/[0.07] bg-[#0d0d0d]">
      <div className="flex h-14 shrink-0 items-center border-b border-white/[0.07] px-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          {field ? "Properties" : "Theme"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!field ? (
          <ThemePanel />
        ) : (
          <>
            {fieldPanel}
            {/* Conditional logic section — shown for all field types */}
            <ConditionalPanel
              currentFieldId={field.id}
              fields={fields.map((f) => ({
                id: f.id,
                label: f.label,
                type: f.type,
                config: f.config,
              }))}
              conditions={conditions}
              onChange={handleConditionsChange}
            />
          </>
        )}
      </div>
    </aside>
  );
}
