# Pinot Table & Schema Web UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a purely client-side wizard that collects Pinot table/schema inputs and exports API-ready JSON (copy + download), scoped to the design spec.

**Architecture:** Multi-step wizard with Zustand holding canonical wizard state; React Hook Form + Zod validating each step before navigation; pure functions map store state → Pinot schema/table objects. Refine wraps the app (per `harness/requirment.md`) with a no-op or stub `dataProvider` and a single list route hosting the wizard—no real backend. Cross-check generated field names and nesting against `references/schema.md` and `references/table.md` (Pinot uses `dimensionFieldSpecs` plural in JSON API; align types and serializers with those docs if the design draft differs).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Refine (`@refinedev/core`, router integration), React Hook Form, `@hookform/resolvers/zod`, Zod, Zustand, Vitest, React Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-03-22-pinot-table-schema-webui-design.md`

---

## File structure (create / modify)

| Path | Responsibility |
|------|----------------|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `src/index.css` | Tooling, Tailwind entry |
| `src/main.tsx` | Mount root; wrap Refine + router |
| `src/App.tsx` | Refine resources; route to wizard page |
| `src/providers/refineProvider.tsx` (or inline in `App.tsx` if tiny) | Stub `dataProvider`, optional stub `authProvider` |
| `src/pages/WizardPage.tsx` | Hosts `WizardContainer` |
| `src/types/pinotSchema.ts`, `src/types/pinotTable.ts`, `src/types/wizard.ts` | TypeScript models aligned with spec + Pinot JSON keys |
| `src/store/wizardStore.ts` | Zustand state + actions from design doc |
| `src/utils/validation.ts` | Zod schemas: basicInfo, column, schema step, indexing, ingestion |
| `src/utils/generateSchema.ts` | `WizardState` → schema JSON |
| `src/utils/generateTable.ts` | `WizardState` → table JSON |
| `src/utils/export.ts` | `copyToClipboard`, `downloadJson` |
| `src/components/wizard/WizardContainer.tsx` | Step routing, validates current step, renders active step |
| `src/components/wizard/StepIndicator.tsx` | Steps 1–5 UI |
| `src/components/wizard/NavigationButtons.tsx` | Back / Next / Review labels per spec |
| `src/components/steps/BasicInfoStep.tsx` | Step 1 form |
| `src/components/steps/SchemaStep.tsx` | Step 2; uses column components |
| `src/components/steps/IndexingStep.tsx` | Step 3 |
| `src/components/steps/IngestionStep.tsx` | Step 4; table-type branching |
| `src/components/steps/ReviewStep.tsx` | Step 5; previews + reset |
| `src/components/schema/ColumnRow.tsx`, `ColumnList.tsx`, `FieldTypeSelector.tsx` | Column editing |
| `src/components/common/JsonPreview.tsx`, `CopyDownload.tsx` | Read-only JSON + actions |
| `src/**/*.test.ts`, `src/**/*.test.tsx` | Vitest tests co-located or under `src/__tests__/` |
| `README.md` | How to run dev server and tests (minimal) |

---

### Task 1: Scaffold Vite + React + TS + Tailwind + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `tailwind.config.js`, `postcss.config.js`, `src/index.css`
- Test: smoke test `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/App.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders root title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /pinot/i })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm install` then `npx vitest run src/App.test.tsx`
Expected: FAIL (missing vitest setup or App not rendering heading)

- [ ] **Step 3: Minimal implementation**

Use `npm create vite@latest . -- --template react-ts` (or equivalent in empty repo), add Tailwind per [Tailwind Vite guide](https://tailwindcss.com/docs/guides/vite), add devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Configure `vite.config.ts` with `test: { environment: "jsdom", globals: true }`. In `App.tsx`, render `<h1>Pinot Table & Schema Generator</h1>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html tailwind.config.js postcss.config.js src/
git commit -m "chore: scaffold Vite React TS Tailwind and Vitest"
```

---

### Task 2: Integrate Refine shell (stub data provider)

**Files:**
- Create: `src/providers/dataProvider.ts` (stub returning empty lists / rejected mutations as appropriate)
- Modify: `src/main.tsx`, `src/App.tsx`
- Test: `src/App.test.tsx` (update to wrap with same providers as production, or test provider exports)

- [ ] **Step 1: Write the failing test**

Assert that after providers wrap the tree, a data-testid `refine-root` exists on a div inside Refine’s layout, or snapshot that `Refine` children render:

```tsx
import { Refine } from "@refinedev/core";
// In test, render <Refine dataProvider={...} resources={[...]}>...</Refine>
// expect(screen.getByTestId("wizard-root")).toBeInTheDocument();
```

Add `data-testid="wizard-root"` on the wizard placeholder div.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (Refine not installed or wrapper missing)

- [ ] **Step 3: Minimal implementation**

Install: `@refinedev/core`, `@refinedev/react-router` (or current Refine v4+ router package per official Vite quickstart), `react-router-dom`. Implement stub `dataProvider` with `getList` returning `{ data: [], total: 0 }` and other methods as no-ops or rejects unused by the UI. Register one resource, e.g. `name: "wizard"`, `list: "/"`. Render `WizardPage` placeholder at list route.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/
git commit -m "feat: add Refine shell with stub data provider and wizard route"
```

---

### Task 3: Domain types

**Files:**
- Create: `src/types/pinotSchema.ts`, `src/types/pinotTable.ts`, `src/types/wizard.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/types/wizard.guard.test.ts
import { describe, it, expect } from "vitest";
import type { WizardStateShape } from "./wizard";

describe("wizard types", () => {
  it("accepts minimal default shape", () => {
    const s: WizardStateShape = {
      currentStep: 0,
      tableName: "",
      tableType: "OFFLINE",
      columns: [],
      enableColumnBasedNullHandling: false,
      timeColumnName: "",
      replication: 1,
      retentionTimeUnit: "",
      retentionTimeValue: 0,
      fieldConfigList: [],
      sortedColumn: "",
      loadMode: "HEAP",
      ingestionType: "NONE",
      enableUpsert: false,
      enableDedup: false,
    };
    expect(s.tableType).toBe("OFFLINE");
  });
});
```

Define exported type `WizardStateShape` in `wizard.ts` matching the design doc (omit functions from this “shape” type if needed).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/wizard.guard.test.ts`
Expected: FAIL (type/module missing)

- [ ] **Step 3: Minimal implementation**

Add interfaces from the design document sections “Pinot Schema Types”, “Pinot Table Types”, and `ColumnData` / `WizardState` fields. Ensure JSON output types use Pinot’s actual keys (`dimensionFieldSpecs`, not `dimensionFieldSpec`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/wizard.guard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add Pinot and wizard TypeScript models"
```

---

### Task 4: Zod validation (basic info + columns)

**Files:**
- Create: `src/utils/validation.ts`
- Test: `src/utils/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { basicInfoSchema } from "./validation";

describe("basicInfoSchema", () => {
  it("rejects double underscores in table name", () => {
    const r = basicInfoSchema.safeParse({ tableName: "bad__name", tableType: "OFFLINE" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/validation.test.ts`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Implement `basicInfoSchema` exactly as in the design doc (regex, `__` and `--` refines). Add `columnSchema` with discriminated or conditional checks per field type (dimension metric datetime complex), and `schemaStepSchema` with `columns.min(1)` and unique `name` refinement.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts src/utils/validation.test.ts
git commit -m "feat: add Zod schemas for basic info and schema step"
```

---

### Task 5: Zod validation (indexing + ingestion)

**Files:**
- Modify: `src/utils/validation.ts`
- Modify: `src/utils/validation.test.ts`

- [ ] **Step 1: Write the failing test**

Test `indexingStepSchema` with `replication: 0` fails. Test stream config requires `topicName` and `bootstrapServers` when `ingestionType === "STREAM"` and table type REALTIME (pass table type into super-refine or split helpers).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/validation.test.ts`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Add `indexingStepSchema` and ingestion validators mirroring the “Validation Rules Summary” and step field tables in the spec. Keep YAGNI: only fields the UI exposes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts src/utils/validation.test.ts
git commit -m "feat: add Zod schemas for indexing and ingestion steps"
```

---

### Task 6: Zustand wizard store

**Files:**
- Create: `src/store/wizardStore.ts`
- Test: `src/store/wizardStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "./wizardStore";

describe("wizardStore", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it("updateBasicInfo sets tableName", () => {
    useWizardStore.getState().updateBasicInfo({ tableName: "events" });
    expect(useWizardStore.getState().tableName).toBe("events");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/wizardStore.test.ts`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Install `zustand`. Implement initial state and all actions from the design doc (`setStep`, `updateBasicInfo`, `updateColumns`, `addColumn`, `removeColumn`, `updateIndexing`, `updateIngestion`, `reset`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/wizardStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand wizard store with reset and updaters"
```

---

### Task 7: generateSchema and generateTable

**Files:**
- Create: `src/utils/generateSchema.ts`, `src/utils/generateTable.ts`
- Test: `src/utils/generateSchema.test.ts`, `src/utils/generateTable.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// generateSchema.test.ts — build minimal wizard state with one dimension column; expect schemaName === tableName, one entry in dimensionFieldSpecs
```

```ts
// generateTable.test.ts — OFFLINE with BATCH ingestion produces batchIngestionConfig nested under ingestionConfig; REALTIME STREAM produces streamIngestionConfig with streamType kafka
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/generateSchema.test.ts src/utils/generateTable.test.ts`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Map `ColumnData[]` to the four spec arrays; omit empty optional objects. Apply table-type rules: no `upsertConfig` unless REALTIME and enabled; batch only for OFFLINE; stream only for REALTIME. Default `schemaName` to `tableName`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/generateSchema.test.ts src/utils/generateTable.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/generateSchema.ts src/utils/generateTable.ts src/utils/*.test.ts
git commit -m "feat: map wizard state to Pinot schema and table JSON"
```

---

### Task 8: Export helpers

**Files:**
- Create: `src/utils/export.ts`
- Test: `src/utils/export.test.ts`

- [ ] **Step 1: Write the failing test**

Mock `navigator.clipboard.writeText` and assert `copyToClipboard` resolves with expected string. For `downloadJson`, mock `URL.createObjectURL`, `document.createElement`, and assert `download` attribute ends with `-schema.json` when called with `{ tableName: "foo" }` filename pattern (match implementation).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/export.test.ts`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Implement functions from the design doc exactly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/export.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/export.ts src/utils/export.test.ts
git commit -m "feat: add copy and download JSON helpers"
```

---

### Task 9: Common UI — JsonPreview and CopyDownload

**Files:**
- Create: `src/components/common/JsonPreview.tsx`, `src/components/common/CopyDownload.tsx`
- Test: `src/components/common/CopyDownload.test.tsx`

- [ ] **Step 1: Write the failing test**

Render `CopyDownload` with a label; click "Copy" triggers mocked clipboard with stringified JSON.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/common/CopyDownload.test.tsx`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

`JsonPreview`: `<pre>` with monospace, pretty-printed `JSON.stringify(obj, null, 2)`. `CopyDownload`: buttons calling `copyToClipboard` and `downloadJson` with filenames `{tableName}-schema.json` and `{tableName}-table.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/common/CopyDownload.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/common/
git commit -m "feat: add JSON preview and copy/download controls"
```

---

### Task 10: Schema column components

**Files:**
- Create: `src/components/schema/FieldTypeSelector.tsx`, `ColumnRow.tsx`, `ColumnList.tsx`
- Test: `src/components/schema/ColumnList.test.tsx` (optional: shallow interaction)

- [ ] **Step 1: Write the failing test**

Render `ColumnList` with mock `columns` and `onChange`; simulate add removes id.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/schema/ColumnList.test.tsx`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Use React Hook Form `useFieldArray` from parent `SchemaStep` **or** controlled props from parent; prefer single source of truth in Zustand updated from `SchemaStep`. Implement field-type-specific controls per design (DateTime format/granularity, Complex value type, Dimension singleValueField).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/schema/ColumnList.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/schema/
git commit -m "feat: add schema column list and row editors"
```

---

### Task 11: Wizard chrome — StepIndicator and NavigationButtons

**Files:**
- Create: `src/components/wizard/StepIndicator.tsx`, `src/components/wizard/NavigationButtons.tsx`
- Modify: later `WizardContainer.tsx`

- [ ] **Step 1: Write the failing test**

Test `NavigationButtons`: on step 0, Back disabled; on step 4 label "Review".

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/wizard/NavigationButtons.test.tsx`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Apply Tailwind class patterns from the design doc (`cardClass`, `buttonPrimary`, etc.). Step indicator shows 1–5 with current highlighted.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/wizard/NavigationButtons.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard/StepIndicator.tsx src/components/wizard/NavigationButtons.tsx src/components/wizard/*.test.tsx
git commit -m "feat: add wizard step indicator and navigation buttons"
```

---

### Task 12: WizardContainer and five steps

**Files:**
- Create: `src/components/wizard/WizardContainer.tsx`
- Create: `src/components/steps/BasicInfoStep.tsx`, `SchemaStep.tsx`, `IndexingStep.tsx`, `IngestionStep.tsx`, `ReviewStep.tsx`
- Modify: `src/pages/WizardPage.tsx`

- [ ] **Step 1: Write the failing test**

Integration-style: render `WizardContainer` with store pre-initialized; click Next with invalid step 1 data stays on step 0; valid data advances.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/wizard/WizardContainer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

`WizardContainer`: read `currentStep` from Zustand; each step uses `react-hook-form` + `zodResolver` for that step’s schema; on valid submit call `setStep(currentStep+1)`. Step 2 syncs form ↔ `columns` in store. Step 3: time column dropdown from DateTime columns. Step 4: disable BATCH/STREAM inconsistent with table type. Step 5: call `generateSchema`, `generateTable`, render two `JsonPreview` + `CopyDownload`, `Start Over` calls `reset()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/wizard/WizardContainer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard/WizardContainer.tsx src/components/steps/ src/pages/WizardPage.tsx
git commit -m "feat: wire multi-step wizard with validation and review export"
```

---

### Task 13: Layout polish and README

**Files:**
- Modify: `src/App.tsx`, `src/pages/WizardPage.tsx`, `README.md`

- [ ] **Step 1: Write the failing test**

Optional: snapshot header text "Pinot Table & Schema Generator".

- [ ] **Step 2: Run test to verify it fails**

Skip if optional; otherwise run Vitest.

- [ ] **Step 3: Minimal implementation**

Apply layout from design: header, max-w-3xl card, footer with nav. Document `npm install`, `npm run dev`, `npm test` in README.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add README.md src/
git commit -m "docs: README and layout polish for wizard UI"
```

---

## Plan review loop

@superpowers: After saving this plan, run the plan-document-reviewer subagent (see superpowers `plan-document-reviewer-prompt.md`) with:

- Plan path: `docs/superpowers/plans/2026-03-22-pinot-table-schema-webui.md`
- Spec path: `docs/superpowers/specs/2026-03-22-pinot-table-schema-webui-design.md`

If issues are reported, revise this plan and re-run the reviewer (max three iterations, then escalate to a human).

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-22-pinot-table-schema-webui.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** @superpowers:subagent-driven-development

**2. Inline Execution** — Execute tasks in this session using @superpowers:executing-plans with checkpoints between batches.

**Which approach do you want?**
