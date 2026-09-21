import React from "react";
import {
  Section,
  Text,
  Hr,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

export interface AnswerItem {
  readonly label: string;
  readonly value: string;
}

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  EUR: "€",
  GBP: "£",
  USD: "$",
};

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "$";
  return CURRENCY_SYMBOLS[currency] ?? "$";
}

// ---------------------------------------------------------------------------
// Shared Style Constants
// ---------------------------------------------------------------------------

/** Dark outer body wrapper */
export const baseBody = {
  backgroundColor: "#07080A",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: "24px 0",
  margin: 0,
};

/** Rounded card container */
export const baseContainer = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#111217",
  borderRadius: "16px",
  padding: "36px 32px",
  border: "1px solid #222530",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

export const baseHeaderSection = {
  marginBottom: "20px",
};

export const baseBrandBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "#1A1C24",
  border: "1px solid #2B2E3C",
  borderRadius: "20px",
  padding: "6px 14px",
};

export const baseBrandDot = {
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: "#E8854A",
  marginRight: "6px",
};

export const baseBrandText = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.05em",
};

export const baseHeroSection = {
  marginBottom: "24px",
};

export const baseH1 = {
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 8px 0",
  letterSpacing: "-0.02em",
};

export const baseSubtext = {
  color: "#9CA3AF",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};

export const baseMetaText = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "0",
  fontFamily: "monospace",
};

/** Answers card & row styles */
export const baseAnswersSection = {
  marginBottom: "24px",
};

export const baseSectionTitle = {
  color: "#9CA3AF",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 10px 0",
};

export const baseAnswersCard = {
  backgroundColor: "#161822",
  borderRadius: "12px",
  border: "1px solid #242736",
  overflow: "hidden",
};

export const baseAnswerRow = {
  padding: "12px 16px",
  borderBottom: "1px solid #1F2230",
};

export const baseAnswerRowLast = {
  padding: "12px 16px",
};

export const baseAnswerLabel = {
  color: "#9CA3AF",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 3px 0",
};

export const baseAnswerValue = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: "1.4",
  margin: 0,
};

/** CTA button */
export const baseCtaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

export const baseButtonPrimary = {
  display: "inline-block",
  backgroundColor: "#E8854A",
  color: "#080808",
  fontWeight: "700",
  fontSize: "14px",
  padding: "12px 28px",
  borderRadius: "10px",
  textDecoration: "none",
  boxShadow: "0 4px 14px rgba(232, 133, 74, 0.4)",
};

/** Footer */
export const baseFooterDivider = {
  borderTop: "1px solid #1F222F",
  margin: "24px 0 16px 0",
};

export const baseFooterSection = {
  textAlign: "center" as const,
};

export const baseFooterText = {
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};

export const baseFooterSubtext = {
  color: "#4B5563",
  fontSize: "11px",
  lineHeight: "1.4",
  margin: 0,
};

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

/** Reusable brand header badge (dot + label) */
export function BrandHeader({
  label,
  dotColor,
  badgeStyle,
  textStyle,
}: {
  readonly label: string;
  readonly dotColor?: string;
  readonly badgeStyle?: React.CSSProperties;
  readonly textStyle?: React.CSSProperties;
}) {
  return (
    <Section style={baseHeaderSection}>
      <div style={{ ...baseBrandBadge, ...badgeStyle }}>
        <span style={{ ...baseBrandDot, ...(dotColor ? { backgroundColor: dotColor } : {}) }} />
        <span style={{ ...baseBrandText, ...textStyle }}>{label}</span>
      </div>
    </Section>
  );
}

/** Reusable email footer with divider + two lines of text */
export function EmailFooter({
  mainText,
  subText,
}: {
  readonly mainText: React.ReactNode;
  readonly subText: React.ReactNode;
}) {
  return (
    <>
      <Hr style={baseFooterDivider} />
      <Section style={baseFooterSection}>
        <Text style={baseFooterText}>{mainText}</Text>
        <Text style={baseFooterSubtext}>{subText}</Text>
      </Section>
    </>
  );
}

/** Reusable answers list with label/value rows */
export function AnswersPreview({
  title,
  items,
  maxItems,
}: {
  readonly title: string;
  readonly items: readonly AnswerItem[];
  readonly maxItems?: number;
}) {
  if (items.length === 0) return null;

  const visibleItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <Section style={baseAnswersSection}>
      <Text style={baseSectionTitle}>{title}</Text>
      <div style={baseAnswersCard}>
        {visibleItems.map((item, idx) => (
          <div
            key={`${item.label}-${idx}`}
            style={idx === visibleItems.length - 1 ? baseAnswerRowLast : baseAnswerRow}
          >
            <Text style={baseAnswerLabel}>{item.label}</Text>
            <Text style={baseAnswerValue}>{item.value || "—"}</Text>
          </div>
        ))}
      </div>
    </Section>
  );
}
