# Event Lead Manager (AI-Native B2B Lead Hub)

A full-stack, AI-native application designed to help B2B sales and RevOps teams capture, organize, and follow up with contacts met at industry events and real-world conversations.

- **Live Demo:** `<add your Vercel deployment link>`
- **Demo Video:** `<optional Loom or screen recording link>`
- **Repository:** `<your GitHub repo link>`

---

## Features

- **Lead Management (CRUD):** Add, edit, delete leads with full fields (`name`, `company`, `email`, `event`, `notes`, `status`).
- **Pipeline & Impact Metrics:** Real-time KPI banner displaying total leads captured, follow-up conversion rate, meetings booked, and events tracked.
- **Search & Multi-Filter:**
  - Real-time debounced search (300ms) across name, company, email, and conversation notes.
  - Quick-filter status tabs (`All`, `New`, `Contacted`, `Replied`, `Meeting set`, `Closed`) with live item counts.
  - Dropdown filter by event name (dynamically aggregated).
- **AI-Powered Capabilities (Claude 3.7 Sonnet / Fallback):**
  - **Note Summarizer:** Distills rough conversational notes into 2–3 factual bullet points and an actionable `Next step:` recommendation.
  - **Follow-Up Email Drafter:** Generates personalized, warm B2B follow-up emails referencing specific discussion details with a low-pressure call-to-action.
  - **AI Resilience & Caching:** Persists AI outputs (`aiSummary`, `followUpDraft`) in the database to prevent duplicate API cost. Automatically invalidates cache when notes are modified. Includes smart contextual fallback when API credits or keys are unavailable.
- **One-Click CSV Export:** Export filtered or full lead lists directly to standard CSV format.
- **Responsive & Accessible UI:** Clean, modern interface adapting from a data table on desktop to stacked cards on mobile devices.

---

## Tech Stack & Architecture

| Layer | Technology | Choice Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Single codebase for React frontend and serverless API endpoints. |
| **Styling** | Tailwind CSS | Fast, consistent design system with customized typography and muted B2B color palette. |
| **Database & ORM** | SQLite (Local) / PostgreSQL (Production) + Prisma ORM | Type-safe queries, flexible migrations, and zero-setup local dev. |
| **Data Validation** | Zod | Unified schemas ensuring strict validation across all API routes (`POST` and `PATCH`). |
| **AI Integration** | Anthropic Claude API (`@anthropic-ai/sdk`) | Server-side prompt engineering strictly constrained to avoid hallucination. |

---

## Local Setup (Fast Start with SQLite)

1. **Clone the repository and enter directory:**
   ```bash
   git clone <your-repo-url>
   cd event-lead-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY (optional: fallback generator included)
   ```

4. **Initialize database & seed demo data:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

## Deployment (Vercel + Neon PostgreSQL)

1. Create a free PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. In `prisma/schema.prisma`, set `provider = "postgresql"` if deploying to Postgres.
3. Push your repository to GitHub.
4. Import into Vercel and set the following environment variables:
   - `DATABASE_URL`: Your connection string from Neon/Supabase.
   - `ANTHROPIC_API_KEY`: Your Anthropic API key.
5. In Vercel build settings, the build command runs `prisma generate && next build`.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/leads?search=&status=&event=` | Search and filter leads; returns leads and distinct events |
| `POST` | `/api/leads` | Create a new lead (validated with Zod) |
| `GET` | `/api/leads/:id` | Retrieve single lead details |
| `PATCH` | `/api/leads/:id` | Partial update; invalidates stale AI outputs if notes change |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/leads/:id/summarize` | Generate/cache AI summary of notes |
| `POST` | `/api/leads/:id/follow-up` | Generate/cache AI follow-up email draft |

---

## Key Design Decisions

1. **Server-Side AI Execution:** The Anthropic API key is strictly kept on the server to prevent exposure.
2. **Strict Prompt Constraints:** Prompts enforce that the model only uses facts present in the notes and never invents promises, links, or dates.
3. **Smart Cache Invalidation:** Generating AI summaries and emails can incur latency and token costs. Outputs are saved to the database. If a user modifies their interaction notes, the cached summary and draft are cleared automatically.
4. **Resilient AI Fallback:** If API credits or network availability issues arise, the system falls back gracefully to high-quality contextual output rather than blocking user workflow.
5. **Debounced Search:** 300ms debounce prevents API flooding while providing a snappy desktop search experience.

---

## How I Used AI Tools

I utilized agentic AI development tooling to scaffold the initial Next.js + Prisma structure, refine schema migrations, and test API error responses, while actively reviewing, auditing, and tailoring the business logic and user experience to match Even8's event intelligence domain.
