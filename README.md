# My Form — AI-Native Form Builder SaaS

A production-ready conversational form builder (Typeform alternative) built with a modern TypeScript monorepo stack. Features conversational form runtimes, AI-driven follow-up questions, streaming response summaries, and natural language form generation.

---

## 🚀 Live Demo

- **Live Web App:** [https://my-form-web.vercel.app](https://my-form-web.vercel.app)
- **API Documentation:** [https://my-form-api-j20y.onrender.com/docs](https://my-form-api-j20y.onrender.com/docs)
- **Public Form Gallery:** `/explore`

### Test Credentials
* **Demo Email:** `rithb8981@gmail.com`
* **Demo Password:** `Rithb@8981`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo, pnpm |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Recharts |
| **Backend** | Express.js, tRPC v11 (Typesafe APIs) |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Authentication** | JWT (Access + Refresh tokens), Google OAuth |
| **AI Integration** | Vercel AI SDK + Claude |
| **Rate Limiting** | Redis (Upstash) |
| **Validation** | Zod |
| **Documentation** | Scalar (OpenAPI 3.0) |

---

## 📦 Project Structure

```
my-form/
├── apps/
│   ├── web/          # Next.js 16 frontend (port 3000)
│   └── api/          # Express backend (port 8123)
└── packages/
    ├── database/     # Drizzle schema, migrations, seed script
    ├── trpc/         # Shared tRPC router definitions
    ├── services/     # Auth, email, token, Redis services
    ├── forms/        # Form field types, config schemas, Zod validators
    └── logger/       # Shared logging utility
```

---

## ✨ Features

- **Conversational Form Runner:** Interactive, keyboard-friendly full-page conversational forms at `/f/[slug]`.
- **AI-Powered Capabilities:**
  - Dynamic AI follow-up questions generated dynamically based on previous responses.
  - Streaming AI response summaries/analytics for creators.
  - Natural-language form generation from a simple text prompt.
- **Robust Creator Dashboard:** Full CRUD operations on forms, drag-and-drop form designer (dnd-kit), response browser, and graphical analytics dashboard (recharts).
- **Secure Authentication:** Cookie-based JWT auth with access & rotation refresh tokens, Resend-backed password resets, and Google Social Login.
- **Enterprise-Grade Security:** Redis-backed request rate limiting, honeypot spam protection, and CORS configuration.

---

## 💻 Local Setup

### Prerequisites
- Node.js 18+
- pnpm 9+
- PostgreSQL & Redis instances

### 1. Clone & Install
```bash
pnpm install
```

### 2. Environment Variables
Create a `.env` in the root (matching `.env.example`):
```env
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8123/auth/google/callback
RESEND_API_KEY=...
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8123
NEXT_PUBLIC_API_URL=http://localhost:8123
```

### 3. Database Migration & Seeding
```bash
pnpm db:migrate
pnpm db:seed
```
*Note: The seed script populates a default workspace, the demo user, and 3 rich demo forms (Anime Fan Survey, Startup Product Feedback, and Gamer Preferences Poll) with over 50 submissions and conversation history.*

### 4. Run Development Servers
```bash
pnpm dev
```
- **Web App:** `http://localhost:3000`
- **Backend API:** `http://localhost:8123`
- **Scalar Docs:** `http://localhost:8123/docs`

---

## 📜 Available Scripts

- `pnpm dev` - Start all workspaces in watch/dev mode
- `pnpm build` - Compile all apps and packages
- `pnpm db:generate` - Generate new schema migrations with Drizzle
- `pnpm db:migrate` - Apply pending migrations
- `pnpm db:seed` - Seed mock data for development
- `pnpm lint` - Run ESLint checks across packages
- `pnpm check-types` - Validate TypeScript types across the monorepo
