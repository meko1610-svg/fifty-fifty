# Fifty-Fifty — Agent Reference

**Purpose:** This file is the authoritative reference for AI agents working on this codebase.
Read it completely before writing any code. It describes the system architecture, each agent's
contract, data flow, constraints, and what is planned but not yet implemented.

---

## System Overview

Fifty-Fifty is an **AI-orchestrated site generator**. A user describes an idea in natural language;
a pipeline of specialized AI agents transforms that description into a complete, functional,
standalone HTML landing page — in under 60 seconds.

The pipeline is sequential with one parallel stage:

```
User Vision
     │
     ▼
[Lacuna Detector]  ──── needs clarification? ──→  GuidingQuestion → user
     │ no lacuna
     ▼
[Team Selector]    ──── picks 1-2 agents per phase from DB registry
     │
     ▼
[Brand Agent]      ──── extracts brand DNA
     │
     ▼
[Copy Agent] ──┐
               ├── parallel ──→ merge
[Design Agent]─┘
     │
     ▼
[Engineering Agent]  ──── generates standalone HTML
     │
     ▼
[Score Agent]        ──── scores HTML quality, rejects if below threshold (retry loop)
     │
     ▼
[Security Agent]     ──── sanitizes HTML before delivery
     │
     ▼
Supabase DB (projects table) → SSE stream → browser
```

---

## Repository Structure

```
fifty-fifty/
├── app/                          # Next.js App Router (frontend only)
│   ├── api/orchestrate/route.ts  # Thin SSE proxy → Supabase Edge Function
│   ├── landing/page.tsx          # Public marketing page
│   ├── login/page.tsx            # Magic link auth
│   ├── new/page.tsx              # Vision input UI
│   ├── project/[id]/page.tsx     # Project result viewer
│   └── projects/page.tsx         # User project history
│
├── components/                   # React components (UI only, no agent logic)
│   ├── vision/VisionInput.tsx    # Main input + SSE stream consumer
│   ├── vision/OrchestrationDisplay.tsx
│   └── project/ProjectView.tsx
│
├── lib/
│   ├── supabase/                 # Supabase client helpers (client/server/admin)
│   ├── types.ts                  # Frontend-only types (UI state, orchestration phases)
│   └── utils.ts
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/              # Shared Deno modules (all agent logic lives here)
│   │   │   ├── types.ts          # Agent contract types (BrandOutput, CopyOutput, etc.)
│   │   │   ├── anthropic.ts      # Anthropic SDK client (reads ANTHROPIC_API_KEY secret)
│   │   │   ├── registry.ts       # Agent DB queries (fetchAgentsBySquads, extractExpertise)
│   │   │   ├── team-selector.ts  # Team selection logic + formatTeamContext
│   │   │   ├── orchestrator.ts   # Pipeline orchestration + ProgressEvent types
│   │   │   └── agents/
│   │   │       ├── brand-agent.ts
│   │   │       ├── copy-agent.ts
│   │   │       ├── design-agent.ts
│   │   │       ├── engineering-agent.ts
│   │   │       ├── security-agent.ts
│   │   │       └── score-agent.ts
│   │   └── orchestrate/
│   │       └── index.ts          # Edge Function entry point (HTTP + SSE)
│   └── migrations/               # SQL migrations (RLS, schema)
│
├── middleware.ts                 # Session refresh + route protection
├── AGENTS.md                     # This file
└── CLAUDE.md                     # Claude Code instructions (points to this file)
```

**Critical rule:** All agent logic lives exclusively in `supabase/functions/`. The `app/` directory
and `lib/` directory must never import from `supabase/functions/`. The Next.js project does not
know what agents exist — it only knows the SSE event types.

---

## Infrastructure

| Concern | Technology |
|---------|-----------|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS |
| Agent runtime | Supabase Edge Functions (Deno) |
| AI model | Anthropic Claude API — Haiku 4.5 for fast agents, Sonnet 4.6 for Engineering |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth — magic link OTP, JWT session |
| Streaming | SSE via `ReadableStream` in Edge Function, proxied by Next.js |
| Secrets | `ANTHROPIC_API_KEY` in Supabase secrets. Never in `.env` or Next.js |

**Deno import conventions (Edge Functions only):**
```ts
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'
import { something } from '../_shared/file.ts'  // always include .ts extension
```

**Node.js import conventions (Next.js only):**
```ts
import { something } from '@/lib/something'  // @/ alias maps to project root
```

---

## Data Flow — Types

All agent contracts are defined in `supabase/functions/_shared/types.ts`.

```ts
// Input to the pipeline
interface OrchestrateInput {
  vision: string         // raw user description
  clarification?: string // answer to a GuidingQuestion
  questionId?: string    // id of the question that was answered
}

// Brand Agent output — DNA of the brand
interface BrandOutput {
  projectName: string
  personality: string[]       // ["direto", "confiável", "sem frescura"]
  tone: string                // "informal mas competente"
  audience: string            // "universitários que dividem apartamento"
  coreProblem: string         // "controlar gastos sem estresse"
  emotionalKeywords: string[] // ["clareza", "paz", "controle"]
  archetype: string           // "O Simplificador"
}

// Copy Agent output
interface CopyOutput {
  headline: string            // max 8 words
  subheadline: string         // max 15 words
  cta: string                 // max 3 words
  valueProposition: string    // 2-3 sentences
  supportingCopy: string      // 1 supporting line
}

// Design Agent output
interface DesignOutput {
  palette: {
    background: string        // "#hex"
    surface: string
    primary: string
    primaryForeground: string
    foreground: string
    muted: string
    border: string
  }
  typography: {
    headingFont: string       // Google Fonts name
    bodyFont: string
    headingWeight: string     // "700"
  }
  style: {
    borderRadius: string      // "none" | "sm" | "lg" | "full"
    spacing: string           // "compact" | "comfortable" | "spacious"
    mood: string              // "dark" | "light"
  }
}

// Final pipeline result
interface PipelineResult {
  brand: BrandOutput
  copy: CopyOutput
  design: DesignOutput
  html: string                // complete standalone HTML
}
```

---

## Agent Contracts

### Lacuna Detector
**Location:** `supabase/functions/_shared/orchestrator.ts` → `detectsLacuna()`
**Model:** none (pure heuristic)
**Receives:** `vision: string`
**Delivers:** `GuidingQuestion | null`

**Logic:**
- Fires if vision has fewer than 6 words AND lacks audience signals (`para`, `quem`)
- Fires if vision has no audience signals regardless of length
- Returns `null` if vision is sufficient
- There is only one question type today: `q-audience`

**Constraints:**
- Never ask technical questions — only human, conversational ones
- If `clarification` or `questionId` is present, skip detection entirely
- Only one clarification round is allowed per generation

---

### Team Selector
**Location:** `supabase/functions/_shared/team-selector.ts`
**Model:** `claude-haiku-4-5-20251001`
**Receives:** `vision: string`, `clarification?: string`
**Delivers:** `TeamSelection` — 4 phases, each with 1-2 `SelectedAgent[]`

**Process:**
1. Queries Supabase `agents` table for candidates per phase (parallel, 4 queries)
2. Sends all candidates + vision to Claude Haiku for selection
3. Claude returns JSON picks `{ brand: [{id, role}], copy: [...], design: [...], engineering: [...] }`
4. Fetches selected agent records, extracts expertise section (max 800 chars)
5. Returns `TeamSelection` with full agent context

**Squad map (which DB squads are searched per phase):**
```ts
brand:       ['brand', 'brand-squad', 'brand-identity', 'movement', 'advisory-board']
copy:        ['copy', 'copy-squad', 'hormozi', 'storytelling']
design:      ['design', 'design-squad']
engineering: ['engineering', 'tech-product', 'specialized']
```

**Constraints:**
- Select 1-2 agents per phase, never more
- `extractExpertise()` extracts Mission/Identity/Focus sections first; falls back to first 800 chars
- If an agent ID from Claude's pick is not found in candidates, it is silently dropped
- `formatTeamContext()` formats selected agents into markdown for injection into downstream prompts

---

### Brand Agent
**Location:** `supabase/functions/_shared/agents/brand-agent.ts`
**Model:** `claude-haiku-4-5-20251001`
**Receives:** `vision`, `clarification?`, `teamContext?` (formatted team markdown)
**Delivers:** `BrandOutput` (JSON)

**Constraints:**
- Never use generic words: "inovador", "moderno", "revolucionário"
- `personality[]` must be specific and memorable, not adjective soup
- `archetype` format: "O [Nome]" — exactly two words after "O"
- Response must be valid JSON only — no markdown, no explanation
- Extract JSON with `/\{[\s\S]*\}/` regex — discard everything outside braces

---

### Copy Agent
**Location:** `supabase/functions/_shared/agents/copy-agent.ts`
**Model:** `claude-haiku-4-5-20251001`
**Receives:** `BrandOutput`, `teamContext?`
**Delivers:** `CopyOutput` (JSON)

**Constraints:**
- `headline`: max 8 words, immediate impact, zero cliché
- `subheadline`: max 15 words, complements headline
- `cta`: max 3 words, clear action
- Copy must sound like `brand.archetype`, not a template
- Response must be valid JSON only

---

### Design Agent
**Location:** `supabase/functions/_shared/agents/design-agent.ts`
**Model:** `claude-haiku-4-5-20251001`
**Receives:** `BrandOutput`, `teamContext?`
**Delivers:** `DesignOutput` (JSON)

**Constraints:**
- **No two projects may share the same palette** — derive colors from `emotionalKeywords` and `personality`
- `palette` values must be valid hex strings (`#RRGGBB`)
- `typography.headingFont` and `bodyFont` must be real Google Fonts names
- `borderRadius` must be one of: `"none"`, `"sm"`, `"lg"`, `"full"`
- `spacing` must be one of: `"compact"`, `"comfortable"`, `"spacious"`
- `mood` must be `"dark"` or `"light"`
- Mood selection guide: dark → serious/premium/introspective; light → open/energetic/welcoming
- Do not default to Inter for body font — choose a font that reflects the brand tone

**Radius/spacing resolved downstream in Engineering Agent:**
```ts
BORDER_RADIUS_MAP = { none: '0px', sm: '4px', lg: '12px', full: '9999px' }
SPACING_MAP       = { compact: '4rem', comfortable: '7rem', spacious: '10rem' }
```

---

### Engineering Agent
**Location:** `supabase/functions/_shared/agents/engineering-agent.ts`
**Model:** `claude-sonnet-4-6` (only agent using Sonnet — HTML generation requires higher quality)
**Receives:** `BrandOutput`, `CopyOutput`, `DesignOutput`, `teamContext?`
**Delivers:** `string` — complete standalone HTML document

**Constraints:**
- Output must start with `<!DOCTYPE html` and end with `</html>`
- Extract with `/<!DOCTYPE html[\s\S]*<\/html>/i` — discard markdown wrappers
- Must include `<head>` with Google Fonts for both `headingFont` and `bodyFont`
- Must define CSS variables in `:root` using all design tokens
- **Required sections:** Hero (headline + subheadline + CTA + visual element), 3 Benefits with SVG icons, Final CTA, Footer with project name
- Must be fully responsive (mobile-first)
- Zero external dependencies except Google Fonts
- Layout must feel custom to the brand archetype — no generic templates
- Never reuse the same layout structure for different archetypes

---

### Score Agent
**Location:** `supabase/functions/_shared/agents/score-agent.ts`
**Model:** `claude-haiku-4-5-20251001`
**Position in pipeline:** Between Engineering Agent and Security Agent
**Receives:** `html: string`, `brand: BrandOutput`, `copy: CopyOutput`, `design: DesignOutput`
**Delivers:** `ScoreOutput`

**Planned contract:**
```ts
interface ScoreOutput {
  score: number           // 0–100
  approved: boolean       // score >= 70
  signals: {
    // Positive signals (each 0–20)
    brandCoherence: number    // does the page reflect the brand archetype?
    copyPresence: number      // are headline, subheadline, and CTA present and faithful?
    designAdherence: number   // are palette and fonts correctly applied?
    completeness: number      // are all required sections present?
    responsiveness: number    // does HTML include mobile-first patterns?
    // Negative signals (each deducts points)
    isGeneric: number         // penalizes generic/template-looking output
    hasBrokenStructure: number // penalizes malformed HTML structure
    missingCTA: number        // penalizes absent or weak call-to-action
  }
  feedback: string        // one-sentence explanation if score < 70
}
```

**Planned behavior:**
- If `approved === false`: Engineering Agent is called again (max 2 retries), Score Agent re-evaluates
- If still not approved after 2 retries: pass to Security Agent with a `lowQuality: true` flag
- Score and signals are stored alongside the project in the DB for future analysis
- This is the step that adds the "candidate scoring" pattern from X's recommendation pipeline

**Implementation notes for when this is built:**
- Do not rewrite `orchestrator.ts` to add Score Agent — modify `orchestrate()` to accept a `scoreAgent` option
- The retry loop must use the same `onProgress` callback so the UI can show "Refinando..." state
- Add `score` event type to `ProgressEvent` union in `orchestrator.ts`

---

### Security Agent
**Location:** `supabase/functions/_shared/agents/security-agent.ts`
**Model:** `claude-haiku-4-5-20251001`
**Receives:** `html: string` (raw output from Engineering Agent)
**Delivers:** `SecurityOutput`

```ts
interface SecurityOutput {
  approved: boolean
  issues: string[]
  sanitizedHtml: string  // always present — even if approved, the HTML is re-returned
}
```

**Security rules applied:**
1. Remove `<script>` tags with suspicious content (`eval`, `document.write`, `innerHTML` with external input)
2. Remove inline event handlers that access external data (`onload` with `fetch`, etc.)
3. Ensure all external links have `rel="noopener noreferrer"`
4. Remove iframes with untrusted `src` domains
5. Remove sensitive information from HTML comments
6. Validate Google Fonts loads via HTTPS

**Constraints:**
- If response is not valid JSON, fall back to `{ approved: true, issues: [], sanitizedHtml: html }` — never crash
- `sanitizedHtml` is always what gets stored in the DB and served to users
- This agent runs even if `approved: false` — it always returns a sanitized HTML

---

## Edge Function Entry Point

**Location:** `supabase/functions/orchestrate/index.ts`
**Runtime:** Deno
**Protocol:** HTTP POST → `ReadableStream` SSE response

**SSE event sequence:**
```
data: {"type":"team"}
data: {"type":"brand"}
data: {"type":"copy-design"}
data: {"type":"engineering"}
data: {"type":"score","data":{"score":85,"approved":true,"retry":false}}
data: {"type":"security"}
data: {"type":"done","projectId":"...","brief":{...},"team":{...},"html":"..."}
```

**Error events:**
```
data: {"type":"error","message":"Erro interno na orquestração"}
data: {"type":"clarification","question":{"id":"q-audience","text":"..."}}
```

**Auth:** Reads `Authorization: Bearer <jwt>` header. If valid JWT, sets `user_id` on the project.
Anonymous projects are allowed (`user_id: null`).

**CORS:** Allowlist via `getCorsHeaders(req)` (`_shared/cors.ts`). Produção requer secret `ALLOWED_ORIGIN` configurado via `supabase secrets set`.

---

## Database Schema

```sql
-- projects table
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES auth.users(id) NULL  -- null for anonymous
vision        text NOT NULL                          -- original user input
status        text DEFAULT 'delivered'
delivered_at  timestamptz
brief         jsonb      -- ProjectBrief (title, description, personality, visualDNA, audience, coreProblem)
html          text       -- final sanitized HTML
team          jsonb      -- TeamSelection (brand[], copy[], design[], engineering[])
brand         jsonb      -- BrandOutput
copy          jsonb      -- CopyOutput
design        jsonb      -- DesignOutput
created_at    timestamptz DEFAULT now()

-- agents table (registry)
id            text PRIMARY KEY   -- e.g. "joe-sugarman", "brad-frost"
name          text
description   text
emoji         text
squad         text               -- "copy-squad", "design-squad", etc.
content       text               -- full agent markdown (system prompt / expertise)
active        boolean DEFAULT true
```

**RLS policies:**
- `SELECT`: `user_id IS NULL OR user_id = auth.uid()`
- `INSERT`: `user_id IS NULL OR user_id = auth.uid()`

---

## What Is Missing / Known Limitations

| Item | Status | Notes |
|------|--------|-------|
| Score Agent retry UI | Planned | Needs new SSE event type `score` + UI state "Refinando..." |
| Two-stage retrieval in Team Selector | Planned | Stage 1: keyword filter; Stage 2: Claude ranking |
| Score Agent retry UI | Planned | Needs new SSE event type `score` + UI state "Refinando..." |
| CORS tightening | Done | `_shared/cors.ts` com allowlist; produção requer secret `ALLOWED_ORIGIN` |
| Security Agent JSON parse on large HTML | Done | Two-pass: fixes determinísticos + Claude retorna só issues array (max_tokens: 512) |
| Engineering Agent regeneration on failure | Not implemented | Currently no retry on malformed HTML |
| Agent content versioning | Not implemented | Agents in DB have no version — changes affect all past queries |

---

## Development Rules

1. **Never add agent logic to `app/` or `lib/`** — all AI code goes in `supabase/functions/`
2. **Never import Next.js modules in Edge Functions** — they run on Deno, not Node
3. **Never change `BrandOutput`, `CopyOutput`, or `DesignOutput` interfaces** without updating all downstream agents
4. **Always use `.ts` extension in Deno imports** — `import { x } from '../_shared/file.ts'`
5. **`supabase/functions/` is excluded from Next.js `tsconfig.json`** — typecheck Deno files separately
6. **Deploy with:** `supabase functions deploy orchestrate --project-ref tougztqabjojvfvnlhih`
7. **Set secrets with:** `supabase secrets set KEY=value --project-ref tougztqabjojvfvnlhih`
8. **The `ANTHROPIC_API_KEY` must never appear in `.env.local` or be committed** — it lives in Supabase secrets only
