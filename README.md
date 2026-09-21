# My Form — AI-Native Conversational Form Builder SaaS

A production-grade, AI-native conversational form builder (Typeform alternative) built with a modern TypeScript monorepo architecture. Features distraction-free conversational form runtimes, intelligent real-time AI follow-ups, streaming qualitative response summaries, natural language form generation, Google Sheets live sync, Razorpay subscriptions, and an administrative control suite.

---

## 🚀 Live Demo & Links

- **Live Web Application:** [https://my-form.mrmadhukar.in](https://my-form.mrmadhukar.in)
- **Backend API Service:** [https://my-form-api.mrmadhukar.in](https://my-form-api.mrmadhukar.in)
- **Interactive API Documentation (Scalar):** [https://my-form-api.mrmadhukar.in/docs](https://my-form-api.mrmadhukar.in/docs)
- **Public Form Gallery:** [https://my-form.mrmadhukar.in/explore](https://my-form.mrmadhukar.in/explore)

<!-- ### Test Credentials
* **Demo Email:** `mrmadhukar@gmail.com`
* **Demo Password:** `Madhukar@2002` -->

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo, pnpm workspaces |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion (Framer Motion v12), Radix UI / Base UI, Recharts |
| **Backend** | Express.js 5, tRPC v11 (End-to-End Typesafe API), tRPC-to-OpenAPI |
| **Database & ORM** | PostgreSQL (Neon Serverless), Drizzle ORM, Drizzle Kit |
| **Authentication** | Stateless JWT (HTTP-Only Secure Access & Refresh Tokens), Google OAuth 2.0 |
| **AI Integration** | Vercel AI SDK, OpenAI & Groq (Dynamic Follow-ups, Form Generation, Summaries) |
| **Payments & Billing** | Razorpay (Subscriptions, Plan Management, Webhooks) |
| **Third-Party Integrations** | Google Sheets API (Real-time Service Account Sync) |
| **Rate Limiting & Cache** | Redis (Upstash) via `ioredis` & `rate-limit-redis` |
| **Email Service** | Resend (Transactional emails, Password resets) |
| **Validation** | Zod (v4) |
| **API Documentation** | Scalar (OpenAPI 3.0 via tRPC OpenAPI) |
| **Telemetry & Analytics** | PostHog & Vercel Analytics |

---

## 📦 Project Structure

```
my-form/
├── apps/
│   ├── web/          # Next.js 16 frontend (Dashboard, Form Runner, Admin, Billing)
│   └── api/          # Express 5 backend & tRPC v11 server (port 8123 / 3001)
└── packages/
    ├── database/     # Drizzle schema, migrations, client & rich seed data
    ├── trpc/         # Typesafe tRPC router definitions & OpenAPI mappings
    ├── services/     # Auth, Resend email, JWT tokens, Redis cache, Google Sheets & Razorpay
    ├── forms/        # Form field types, config schemas, Zod validation models
    └── logger/       # Shared structured logger
```

---

## ✨ Features

- **Conversational Form Runner:** Interactive, keyboard-accessible full-page form runner at `/f/[slug]` with smooth animations, progress indicators, and mobile-friendly layouts.
- **AI-Powered Capabilities:**
  - **Dynamic AI Follow-Ups:** Intelligently asks contextual follow-up questions when respondents provide open-text answers.
  - **Streaming AI Response Summaries:** Synthesizes qualitative feedback into concise, actionable summaries for creators.
  - **Natural-Language Form Generation:** Generates complete, multi-field form schemas directly from simple text prompts.
- **Creator Studio & Form Designer:** 3-pane visual builder with drag-and-drop field reordering (`@dnd-kit`), field configuration, validation rules, and live preview.
- **Google Sheets Real-Time Sync:** Automatically appends form submissions directly into designated Google Spreadsheets using Google Service Account integration.
- **Subscriptions & Billing:** Complete Razorpay integration featuring Free, Pro, and Scale subscription tiers with webhook lifecycle handlers.
- **Admin Management Portal:** Dedicated dashboard at `/admin` for tracking platform metrics, registered users, workspaces, and system-wide forms.
- **Analytics & Drop-Off Tracking:** Visual funnel conversion charts (`recharts`), submission logs, answer distributions, and CSV export.
- **Public Form Gallery:** Community discovery at `/explore` allowing users to view, share, and test public templates.
- **Enterprise-Grade Security:** HTTP-only secure cookie authentication, Redis rate limiting, honeypot spam protection, and CORS policies.

---

## 💻 Local Setup

### Prerequisites
- **Node.js** 18+
- **pnpm** 9+
- **PostgreSQL** (e.g. Neon, Supabase, or local Postgres)
- **Redis** (e.g. Upstash or local Redis)

### 1. Clone & Install
```bash
git clone https://github.com/Mr-Madhukar/My-Form.git
cd My-Form
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database & Redis
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
REDIS_URL=rediss://default:token@host:6379

# JWT Authentication Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Server & Application URLs
PORT=8123
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8123
NEXT_PUBLIC_API_URL=http://localhost:8123
CORS_ORIGIN=http://localhost:3000

# Admin Access
ADMIN_EMAILS=admin@example.com

# Google OAuth 2.0 (Social Login)
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8123/auth/google/callback

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="My-Form <no-reply@yourdomain.com>"

# AI Integrations
OPENAI_API_KEY=sk-your_openai_api_key
GROQ_API_KEY=gsk_your_groq_api_key

# Payments & Billing (Razorpay - Optional for local dev)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PRO_PLAN_ID=plan_...
RAZORPAY_SCALE_PLAN_ID=plan_...

# Google Sheets Sync (Service Account - Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Database Migration & Seeding
```bash
# Push database migrations
pnpm db:migrate

# Seed database with sample workspace, demo forms, and submissions
pnpm db:seed
```

### 4. Run Development Servers
```bash
pnpm dev
```

- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8123](http://localhost:8123)
- **Scalar API Docs:** [http://localhost:8123/docs](http://localhost:8123/docs)
- **Drizzle Database Studio:** `pnpm db:studio`

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts all applications (frontend & backend) concurrently in watch mode |
| `pnpm build` | Builds all packages and applications for production |
| `pnpm db:generate` | Generates new Drizzle schema migrations |
| `pnpm db:migrate` | Runs pending database migrations |
| `pnpm db:seed` | Populates database with sample workspaces, forms, and responses |
| `pnpm db:studio` | Launches Drizzle Studio GUI for inspecting database tables |
| `pnpm lint` | Runs ESLint across all packages and apps |
| `pnpm format` | Formats code repository-wide using Prettier |
| `pnpm check-types` | Executes TypeScript typecheck across all workspaces |
| `pnpm test` | Runs automated test suites |
| `pnpm clean` | Cleans build caches, dist outputs, and `.turbo` directories |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
