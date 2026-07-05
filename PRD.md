# Product Requirements Document (PRD)
## Project Name: My Form — AI-Native Conversational Form Builder SaaS
**Version:** 1.0 (MVP)  
**Author:** Product Manager Agent  
**Date:** July 6, 2026  

---

## 1. Problem Statement

### What problem does this solve?
Traditional form builders (e.g., Google Forms) are static, rigid, and result in low engagement rates. They present an interrogation-like experience rather than a natural conversation, leading to high drop-off rates. Conversely, interactive platforms like Typeform are expensive, and while they offer a better design, they are still fundamentally static—once a form is built, it cannot adapt or ask clarifying follow-up questions based on interesting user input in real-time.

**My Form** solves this by combining the simplicity of Google Forms' creator workflow with an AI-native conversational runtime. It dynamically adapts, "asks back" when users provide incomplete or interesting open-text answers, and automates form creation via natural language prompts.

### Who experiences this problem?
- **Start-up Founders & Product Managers:** Who need deep, qualitative feedback from beta testers or early users but get surface-level answers on static forms.
- **Researchers & Marketers:** Who want high-completion survey tools that feel premium but don't cost a fortune.
- **HR & Operations Managers:** Who want a clean, keyboard-friendly tool to onboard employees or collect feedback.

### Why does this problem matter now?
With the rise of LLMs, users expect software to be interactive and context-aware. Static text fields feel outdated. Creators need structured data but want the rich qualitative depth of a conversational interview. Combining these into a single, high-performance, typesafe web app is now possible at a low cost.

---

## 2. Target User

### Primary User: The Creator
- **Role:** Product Managers, Start-up Founders, Marketers, Community Managers.
- **Context:** Building client onboarding surveys, feedback collectors, lead capture forms, and research polls.
- **Frustrations:**
  - Flat, uninformative "yes/no" or single-sentence answers to critical open-ended questions.
  - Low completion rates on longer forms.
  - Tedious form editors that require dragging, nesting, and styling dozens of fields.
- **Goals:** Quickly spin up a beautiful, professional, conversational form and gather deep, actionable qualitative insight automatically summarized by AI.

### Secondary User: The Respondent
- **Context:** Answering a survey on mobile or desktop.
- **Frustrations:** Clunky input fields, too many questions visible at once, and lack of clarity.
- **Goals:** Complete the form quickly, ideally with a keyboard-driven, fast, single-focus conversational interface.

---

## 3. Core Features (MVP)

### Feature 1: 3-Pane Drag-and-Drop Form Designer
- **Description:** A visual creator dashboard containing a fields palette (Short text, Rating, Toggle, Select, etc.), an active canvas workspace (drag-and-drop powered by `dnd-kit`), and a settings/preview side pane.
- **Priority:** Must-Have.

### Feature 2: Keyboard-Friendly Conversational Runner
- **Description:** A distraction-free, full-page responsive form runner accessible via `/f/[slug]`. Users answer one question at a time with smooth animations and full keyboard control (e.g., Pressing `Enter` to submit, using arrows for selects).
- **Priority:** Must-Have.

### Feature 3: AI Auto-Follow Up (Forms that "Ask Back")
- **Description:** When a respondent inputs an open-text answer, the runner uses an LLM (Claude via Vercel AI SDK) to dynamically generate a single relevant follow-up question (e.g., "You mentioned X, can you expand on Y?"). This gathers deeper qualitative data without cluttering the initial form schema.
- **Priority:** Must-Have.

### Feature 4: Natural Language Prompt to Form Generator
- **Description:** Creators can type a prompt (e.g., *"Create a startup feedback form for gamers"*), and the AI automatically generates a complete structured JSON form schema ready to edit or publish.
- **Priority:** Must-Have.

### Feature 5: Real-Time Funnel Analytics & Streaming AI Summaries
- **Description:** A creator analytics dashboard containing step-by-step funnel drop-off metrics (powered by `recharts`) and a streaming AI-generated text summary of all qualitative survey responses.
- **Priority:** Must-Have.

### Feature 6: Google Sheets Live Sync [NEW FEATURE]
- **Description:** A real-time integration where every form submission is instantly appended to a designated Google Sheet. This bridges the gap for users migrating from Google Forms who rely on spreadsheets for their downstream workflows.
- **Priority:** Must-Have (New Core Feature).

### Nice-to-Have (Future Releases)
- **Voice-to-Text Dictation:** Let respondents click a microphone to speak their answers.
- **Custom Branding/CSS:** Custom font uploads, logo placement, and background videos.
- **Multi-Tenant Workspaces:** Team collaboration, role-based access control (RBAC), and shared templates.
- **Paid Subscriptions Integration:** Stripe billing for high-volume creator plans.

---

## 4. Out of Scope (for MVP v1)
- **Offline Submission Queue:** Forms will require a live internet connection to submit.
- **Self-Hosting / Custom Domain Names:** All forms will reside on the `myform.app/f/[slug]` path.
- **Native iOS/Android Apps:** The application will be a progressive, responsive web app optimized for mobile browsers, but no native app stores deployment.
- **Complex Enterprise Integrations:** Salesforce, HubSpot, or Zapier integrations are excluded from v1 (Google Sheets is the single focus).

---

## 5. Success Metrics
- **Form Completion Rate (CR):** Achieve an average of >65% completion rate across all public conversational forms (compared to the industry average of ~30-40% on static forms).
- **AI Clarification Engagement:** Over 40% of users respond to the AI-generated follow-up questions rather than skipping them.
- **Creator Time-to-Publish:** Average time taken to create and publish a form from scratch (or via prompt) is under 2 minutes.
- **Retention Rate (WAU):** 30% of creators who publish a form return to build a second form within 30 days.

---

## 6. Technical Assumptions

### Tech Stack
- **Monorepo Management:** Turborepo, pnpm
- **Frontend Framework:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts
- **Backend API:** Express.js with typesafe tRPC v11
- **Database Layer:** PostgreSQL (Neon Serverless) with Drizzle ORM
- **In-Memory Cache & Rate Limiting:** Redis (Upstash)
- **AI Integrations:** Vercel AI SDK (accessing Claude Models)
- **Authentication:** JWT (Access + Rotate Refresh Tokens in HTTP-Only Cookies) + Google OAuth 2.0
- **Email Service:** Resend (for password resets and verification links)

### Infrastructure
- **Hosting:** Vercel (Frontend), Render/Fly.io (Backend API), Neon (Postgres), Upstash (Redis).

---

## 7. Open Questions

1. **AI Follow-up Rate Limiting:** How do we protect the LLM api endpoint from abuse/high bills on forms that go viral? (Currently handled via basic Upstash rate limits, but may need stricter constraints).
2. **Google OAuth Permissions Scope:** For Google Sheets sync, do we ask for full Google Drive access (higher risk/friction) or narrow sheets-only permissions?
3. **Data Residency & Privacy:** Since Claude processes respondent answers to generate follow-up questions, do we need explicit user consent checkboxes for GDPR compliance?
4. **AI Follow-up Frequency:** Should creators be able to configure *which* specific open-ended questions trigger an AI follow-up, or does the AI run globally on all text inputs?
