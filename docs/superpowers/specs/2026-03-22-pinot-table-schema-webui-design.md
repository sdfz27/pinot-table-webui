# Pinot Table & Schema Web UI Generator - Design Document

**Date:** 2026-03-22
**Status:** Draft

## Overview

A client-side React application that provides a step-by-step wizard for generating valid Pinot table and schema JSON configurations. Users configure table settings through a form-based UI and export the generated JSON for use with the Pinot API.

## Goals

- Provide an intuitive UI for creating Pinot table and schema configurations
- Generate valid JSON that can be used directly with Pinot API
- Support essential Pinot configuration options plus ingestion, upsert, and dedup configs
- Pure client-side application with no backend dependency

## Non-Goals

- Import/edit existing configurations
- Cover all Pinot configuration options (only essential + ingestion + upsert/dedup)
- Backend integration or API connections
- User authentication or data persistence beyond session

## Scope

### Included Features

- **Table Configuration:**
  - Table name and type (OFFLINE/REALTIME)
  - Segments config (time column, replication, retention)
  - Field configs for indexing
  - Ingestion config (batch and stream)
  - Upsert config
  - Dedup config

- **Schema Configuration:**
  - Dimension field specs
  - Metric field specs
  - DateTime field specs
  - Complex field specs (MAP type)
  - Column-based null handling toggle

- **Export Options:**
  - Copy to clipboard
  - Download as JSON files

### Excluded Features

- Quota configuration
- Routing configuration
- Query configuration
- Advanced indexing (star-tree, bloom filter, etc.)
- Tenant configuration
- Tier configs
- Environment variable overrides

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Wizard Container                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │  │
│  │  │ Step 1  │→│ Step 2  │→│ Step 3  │→│ Step 4  │→ ... │  │
│  │  │ Basic   │ │ Schema  │ │ Index & │ │Ingestion│      │  │
│  │  │ Info    │ │ Columns │ │Segments │ │& Special│      │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │  │
│  │                        ↓                                │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │              Step 5: Review & Export             │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐             │   │  │
│  │  │  │ Schema JSON  │  │ Table JSON   │             │   │  │
│  │  │  │ [Copy] [DL]  │  │ [Copy] [DL]  │             │   │  │
│  │  │  └──────────────┘  └──────────────┘             │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Technology | Purpose |
|------------|---------|
| Vite | Build tool |
| React 18 | UI framework |
| TypeScript | Type safety |
| React Hook Form | Form state management |
| Zod | Schema validation |
| Zustand | Global state (wizard navigation) |
| Tailwind CSS | Styling |

## Project Structure

```
pinot-table-webui/
├── src/
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── WizardContainer.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   └── NavigationButtons.tsx
│   │   ├── steps/
│   │   │   ├── BasicInfoStep.tsx
│   │   │   ├── SchemaStep.tsx
│   │   │   ├── IndexingStep.tsx
│   │   │   ├── IngestionStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   ├── schema/
│   │   │   ├── ColumnRow.tsx
│   │   │   ├── ColumnList.tsx
│   │   │   └── FieldTypeSelector.tsx
│   │   └── common/
│   │       ├── JsonPreview.tsx
│   │       └── CopyDownload.tsx
│   ├── store/
│   │   └── wizardStore.ts
│   ├── types/
│   │   ├── pinotTable.ts
│   │   ├── pinotSchema.ts
│   │   └── wizard.ts
│   ├── utils/
│   │   ├── generateSchema.ts
│   │   ├── generateTable.ts
│   │   ├── validation.ts
│   │   └── export.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Data Types

### Pinot Schema Types

```typescript
type DataType = 'INT' | 'LONG' | 'FLOAT' | 'DOUBLE' | 'BIG_DECIMAL' |
                'BOOLEAN' | 'TIMESTAMP' | 'STRING' | 'JSON' | 'BYTES';

type FieldType = 'DIMENSION' | 'METRIC' | 'DATETIME' | 'COMPLEX';

interface DimensionFieldSpec {
  name: string;
  dataType: DataType;
  defaultNullValue?: string | number;
  singleValueField?: boolean;
}

interface MetricFieldSpec {
  name: string;
  dataType: 'INT' | 'LONG' | 'FLOAT' | 'DOUBLE' | 'BIG_DECIMAL' | 'BYTES';
  defaultNullValue?: number;
}

interface DateTimeFieldSpec {
  name: string;
  dataType: 'STRING' | 'INT' | 'LONG' | 'TIMESTAMP';
  format: string;
  granularity: string;
  defaultNullValue?: string | number;
}

interface ComplexFieldSpec {
  name: string;
  dataType: 'MAP';
  fieldType: 'COMPLEX';
  notNull: boolean;
  childFieldSpecs: {
    key: { name: 'key'; dataType: 'STRING'; fieldType: 'DIMENSION'; notNull: boolean };
    value: { name: 'value'; dataType: DataType; fieldType: 'DIMENSION'; notNull: boolean };
  };
}

interface PinotSchema {
  schemaName: string;
  enableColumnBasedNullHandling?: boolean;
  dimensionFieldSpecs: DimensionFieldSpec[];
  metricFieldSpecs: MetricFieldSpec[];
  dateTimeFieldSpecs: DateTimeFieldSpec[];
  complexFieldSpecs?: ComplexFieldSpec[];
}
```

### Pinot Table Types

```typescript
type TableType = 'OFFLINE' | 'REALTIME';

interface SegmentsConfig {
  timeColumnName?: string;
  replication: number;
  retentionTimeUnit?: 'HOURS' | 'DAYS' | 'MONTHS' | 'YEARS';
  retentionTimeValue?: number;
}

interface FieldConfig {
  name: string;
  encodingType: 'RAW' | 'DICTIONARY';
  indexes?: Record<string, object>;
}

interface TableIndexConfig {
  sortedColumn?: string;
  segmentPartitionConfig?: object;
  loadMode?: 'HEAP' | 'MMAP';
}

interface BatchIngestionConfig {
  segmentIngestionType: 'APPEND' | 'REFRESH';
  segmentIngestionFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface StreamIngestionConfig {
  streamType: 'kafka' | 'kinesis' | 'pulsar';
  streamConfigMaps: Record<string, string>[];
}

interface UpsertConfig {
  mode: 'FULL' | 'PARTIAL';
  upsertKeyColumns: string[];
}

interface DedupConfig {
  hashFunction: 'NONE' | 'MD5' | 'MURMUR3';
}

interface PinotTable {
  tableName: string;
  tableType: TableType;
  segmentsConfig: SegmentsConfig;
  tableIndexConfig: TableIndexConfig;
  fieldConfigList?: FieldConfig[];
  ingestionConfig?: {
    batchIngestionConfig?: BatchIngestionConfig;
    streamIngestionConfig?: StreamIngestionConfig;
  };
  upsertConfig?: UpsertConfig;
  dedupConfig?: DedupConfig;
}
```

### Wizard State (Zustand Store)

```typescript
interface ColumnData {
  id: string;
  fieldType: FieldType;
  name: string;
  dataType: DataType;
  defaultNullValue?: string | number;
  singleValueField?: boolean;
  format?: string;
  granularity?: string;
  valueDataType?: DataType;
}

interface WizardState {
  currentStep: number;
  tableName: string;
  tableType: TableType;
  columns: ColumnData[];
  enableColumnBasedNullHandling: boolean;
  timeColumnName: string;
  replication: number;
  retentionTimeUnit: 'DAYS' | 'HOURS' | 'MONTHS' | 'YEARS' | '';
  retentionTimeValue: number;
  fieldConfigList: FieldConfig[];
  sortedColumn: string;
  loadMode: 'HEAP' | 'MMAP';
  ingestionType: 'NONE' | 'BATCH' | 'STREAM';
  batchConfig?: BatchIngestionConfig;
  streamConfig?: StreamIngestionConfig;
  enableUpsert: boolean;
  upsertConfig?: UpsertConfig;
  enableDedup: boolean;
  dedupConfig?: DedupConfig;

  // Actions
  setStep: (step: number) => void;
  updateBasicInfo: (data: Partial<Pick<WizardState, 'tableName' | 'tableType'>>) => void;
  updateColumns: (columns: ColumnData[]) => void;
  addColumn: (column: ColumnData) => void;
  removeColumn: (id: string) => void;
  updateIndexing: (data: Partial<WizardState>) => void;
  updateIngestion: (data: Partial<WizardState>) => void;
  reset: () => void;
}
```

## Wizard Steps

### Step 1: Basic Info

| Field | Type | Validation |
|-------|------|------------|
| Table Name | text input | Required; alphanumeric, hyphens, underscores; no double underscores |
| Table Type | radio | Required; OFFLINE or REALTIME |

### Step 2: Schema Columns

| Field | Type | Shown When |
|-------|------|------------|
| Field Type | select | always |
| Column Name | text | always |
| Data Type | select | always |
| Default Null Value | text | always (optional) |
| Single Value Field | checkbox | Dimension only |
| Format | text | DateTime only |
| Granularity | text | DateTime only |
| Value Data Type | select | Complex only |

**Data Type Options by Field Type:**
- Dimension: INT, LONG, FLOAT, DOUBLE, BOOLEAN, TIMESTAMP, STRING, BYTES, JSON
- Metric: INT, LONG, FLOAT, DOUBLE, BIG_DECIMAL, BYTES
- DateTime: STRING, INT, LONG, TIMESTAMP
- Complex: MAP only

### Step 3: Indexing & Segments

| Field | Type | Notes |
|-------|------|-------|
| Time Column Name | select | Dropdown from DateTime columns |
| Replication | number | Default: 1, minimum: 1 |
| Retention Time Value | number | Optional |
| Retention Time Unit | select | HOURS, DAYS, MONTHS, YEARS |
| Sorted Column | select | Dropdown from all columns |
| Load Mode | select | HEAP / MMAP |

### Step 4: Ingestion & Special

| Section | Fields |
|---------|--------|
| Ingestion Type | NONE / BATCH / STREAM |
| Batch Config | Segment Ingestion Type, Frequency |
| Stream Config | Stream Type, Topic Name |
| Upsert | Enable toggle, Mode, Key Columns |
| Dedup | Enable toggle, Hash Function |

### Step 5: Review & Export

- Summary of all configured values
- Schema JSON preview with Copy/Download buttons
- Table JSON preview with Copy/Download buttons
- "Start Over" button to reset wizard

## Validation

### Zod Schemas

```typescript
export const basicInfoSchema = z.object({
  tableName: z.string()
    .min(1, 'Table name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, hyphens, and underscores allowed')
    .refine((name) => !name.includes('__'), 'Double underscores are not allowed')
    .refine((name) => !name.includes('--'), 'Consecutive hyphens are not allowed'),
  tableType: z.enum(['OFFLINE', 'REALTIME']),
});

export const schemaStepSchema = z.object({
  columns: z.array(columnSchema).min(1, 'At least one column is required'),
});

export const indexingStepSchema = z.object({
  replication: z.number().min(1, 'Replication must be at least 1'),
});
```

### Validation Rules Summary

| Step | Validations |
|------|-------------|
| Basic Info | Table name format, required fields |
| Schema | At least one column, unique column names, required fields per type |
| Indexing | Replication minimum, time column must exist in schema |
| Ingestion | Required fields based on selected options |

## Export Functionality

```typescript
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: object, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

**Export Files:**
- `{tableName}-schema.json`
- `{tableName}-table.json`

## UI Styling

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Pinot Table & Schema Generator"                │
├──────────────────────────────────────────────────────────┤
│  Step Indicator: [1]────[2]────[3]────[4]────[5]         │
├──────────────────────────────────────────────────────────┤
│  Step Content Area (max-w-3xl mx-auto, card shadow)      │
├──────────────────────────────────────────────────────────┤
│  Footer: [← Back]                      [Next →]          │
└──────────────────────────────────────────────────────────┘
```

### Tailwind Patterns

```typescript
const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500";
const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white";
const buttonPrimary = "px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50";
const buttonSecondary = "px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50";
const cardClass = "bg-white rounded-lg shadow-md p-6";
const errorClass = "text-red-600 text-sm mt-1";
```

### Navigation

| Step | Back Button | Next Button |
|------|-------------|-------------|
| 1 | Disabled | "Next" |
| 2-3 | "Back" | "Next" |
| 4 | "Back" | "Review" |
| 5 | "Back" | Hidden (use export buttons) |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| React Hook Form + Zod | Excellent DX for form validation, type-safe schemas |
| Zustand for wizard state | Lightweight, simple API for step navigation |
| Step-by-step wizard | Reduces cognitive load, incremental validation |
| Form-based column rows | Familiar pattern, all options visible |
| Copy + Download options | Flexibility for different workflows |
| Create only (no import) | Simpler codebase, clear use case |
| Basic validation | Balance between strictness and usability |
