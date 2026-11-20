# 🌱 Mellowood

A cozy, adaptive learning garden. Tell Mellow (the marshmallow-sprout mascot) what you want to learn and it will:

1. **Chat with you** until your goal is concrete ("learn AI" → "build a chatbot for my bakery, 3 h/week").
2. **Grow a dependency map** of the concepts you need, using canonical concept IDs so mastery carries across goals.
3. **Find your starting spot** with a few "I know it / Not yet" questions (binary-search placement).
4. **Estimate your time to learn** from your weekly hours and what you already know.
5. **Serve one enticing task at a time** (build / investigate / fix / challenge), chosen by an adaptive strategy.
6. **Learn from your reflections**: mastery grows, the pace adapts, weak prerequisites get revisited, and you can see how your plan changed.

Built with React 18, TypeScript, Vite, Tailwind, Framer Motion and Vitest. Optionally backed by Supabase (auth, Postgres with row-level security, edge functions) and Claude.

---

## Quick start (fully local, no accounts or keys)

Requirements: **Node 20+** (developed on Node 22) and npm.

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

Without a `.env` file the app runs **entirely in your browser**:

| Piece | Local mode |
|---|---|
| Accounts | Stored in `localStorage` (salted hash, device-only) |
| Data | `localStorage` |
| AI | A deterministic built-in mock (`src/ai/mockProvider.ts`) |

Sign up with any email and a password of at least 8 characters. To start over, clear the site data for `localhost:5173` in your browser's dev tools.

### Things to try

1. **Sign up**, then type a goal on the landing page.
   - Vague goals ("learn AI") get follow-up questions.
   - Specific ones ("build a robot arm that sorts Lego, 5 hours a week with an Arduino") go straight to the summary.
   - The mock has rich maps for **Robotics, AI/chatbots, web/apps and Music (guitar)**. Anything else gets a generic map.
2. Try **Not quite** on the summary card, or leave mid-chat and use **Continue your draft** on the landing page.
3. **Looks right!**: watch the map grow, set your weekly hours, and answer the placement questions (or **Start me from scratch**).
4. On the overview: open the **time-to-learn** card, click map nodes, and switch to **List view**.
5. **Agree to join 🌱** → confetti → your first task. Tick the checklist, press **I'm done! Let's reflect**, pick how it went and a chip or two, then **Finish task**. Mastery grows and the next task appears. Back on the map (**See the whole map**), nodes fill up and **How your plan changed** shows what Mellow adjusted.
6. Use the account menu (top right) to log out. Reloading keeps you signed in.

---

## Running the tests

```bash
npm test               # run the whole suite once (Vitest + React Testing Library, jsdom)
npm run test:watch     # re-run tests as you edit
npx vitest run src/domain/placement   # run one folder
npx vitest run -t "placement"         # run tests whose name matches
```

Other checks (CI runs all of them on every PR, see `.github/workflows/ci.yml`):

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # production build into dist/
npm run preview     # serve the production build
```

### How the tests are organised

- Tests sit next to the code in `__tests__/` folders.
- **Domain logic** (`src/domain/**`) is pure TypeScript with unit tests: graph validation and algorithms, placement, estimates, track, strategy, pacing, reflections, mastery.
- **Components and pages** are tested through the UI with React Testing Library, using accessible roles and labels.
- `src/test/renderApp.tsx` renders any page with in-memory services (`MemoryRepository`, mock auth, a mock AI with no delay) and a router, so page tests are fast and isolated.
- `src/data/__tests__/repositoryContract.ts` is a shared contract every storage backend must pass.

The project is test-driven: each Jira story's branch has a red commit (`test(MEL-…)`, failing specs) followed by a green commit (`feat(MEL-…)`).

---

## Project structure

```
src/
  ai/          AIProvider interface, deterministic mock, Claude provider (via edge function)
  app/         Service container (auth, repo, ai), AppShell (nav + account menu)
  auth/        AuthService (mock + Supabase), AuthContext, RequireAuth, validation
  data/        Repository interface: memory, localStorage, Supabase, SyncedRepository (offline queue)
  domain/      Pure logic
    graph/       Concept graph types, validation, algorithms, repair/retry service, cache
    placement/   Binary-search placement, from-scratch, raise-only merge
    estimate/    Time-to-learn
    track/       Custom track and step statuses
    strategy/    nextTask, adaptive pacing, reflections, persistence
    mastery/     Mastery store and update rule
    completeTask.ts, currentTask.ts, goal.ts
  features/    Pages and feature components
    landing/ goal/ journey/ graph/ task/ strategy/
  pages/       Login and sign-up
  ui/          Design system: Button, Card, Input, Badge, ProgressRing, MasteryRing, Mascot, Confetti
supabase/
  migrations/  SQL schema (documents table + RLS, graph_cache, delete_my_account)
  functions/ai Edge function that calls Claude (the API key never reaches the browser)
```

---

## Optional: Supabase + Claude (real accounts, sync, AI)

1. Create a Supabase project and apply the migration in `supabase/migrations/` (Supabase CLI: `supabase db push`, or paste the SQL into the SQL editor).
2. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   VITE_AI_PROVIDER=claude      # or "mock" to keep the offline AI
   ```
3. Deploy the AI edge function with your Anthropic key:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=<your key>
   supabase functions deploy ai
   ```
4. Restart `npm run dev`.

With Supabase configured, data is written locally first and synced through a persisted offline queue (`SyncedRepository`). The `ai` function uses `claude-opus-5-5` with structured outputs and caches generated graphs in the `graph_cache` table.

> The edge function hasn't been run against a live project yet. Treat step 3 as needing a smoke test.

---

## Status

Planning lives in Jira (project **MEL**): 16 epics, user stories under each, and test-first sub-tasks. Every story was built on its own branch (`feature/MEL-<id>-…`) and merged with a PR.

**Done (phase 1):** foundation and design system, data layer with offline sync, email auth with persistent sessions, landing page, goal chat with summary and drafts, AI graph generation with cache, adaptive placement (skip/redo), graph map, time estimate, custom track, "Agree to join", strategy engine (next task, pacing, reflections), task card, mastery, reflect-and-complete loop.

**Next up:**
- MEL-50 progress dashboard and MEL-51 hints / too hard / too easy
- MEL-52 photo + GitHub submissions and MEL-22 upload storage
- MEL-54–56 task sessions (start, pause, resume)
- MEL-25–27 social login, password reset, account settings

Phase 2/3 epics have stories written but are intentionally not built yet.

### Known limitations

- Local mode stores everything in the browser and isn't a security boundary.
- The mock AI is template-based, so tasks for the same concept and framing read alike.
- The account menu links to a Settings page that doesn't exist yet (MEL-27).
