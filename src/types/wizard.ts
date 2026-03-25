// Wizard state types - WizardStateShape omits action functions
import type { DataType, FieldType } from "./pinotSchema";
import type {
  BatchIngestionConfig,
  DedupConfig,
  FieldConfig,
  StreamIngestionConfig,
  TableType,
  UpsertConfig,
} from "./pinotTable";

export interface ColumnData {
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

/** Data shape only - no actions. Used for serialization and minimal/default state. */
export interface WizardStateShape {
  currentStep: number;
  tableName: string;
  tableType: TableType;
  columns: ColumnData[];
  primaryKeyColumns: string[];
  enableColumnBasedNullHandling: boolean;
  timeColumnName: string;
  replication: number;
  retentionTimeUnit: "DAYS" | "HOURS" | "MONTHS" | "YEARS" | "";
  retentionTimeValue: number;
  /** Real-time segment completion; empty means omit from table config. */
  completionMode: "" | "DOWNLOAD";
  fieldConfigList: FieldConfig[];
  sortedColumn: string;
  loadMode: "HEAP" | "MMAP";
  noDictionaryColumns: string[];
  invertedIndexColumns: string[];
  bloomFilterColumns: string[];
  rangeIndexColumns: string[];
  onHeapDictionaryColumns: string[];
  varLengthDictionaryColumns: string[];
  jsonIndexColumns: string[];
  brokerTenant: string;
  serverTenant: string;
  ingestionType: "NONE" | "BATCH" | "STREAM";
  batchConfig?: BatchIngestionConfig;
  streamConfig?: StreamIngestionConfig;
  enableUpsert: boolean;
  upsertConfig?: UpsertConfig;
  enableDedup: boolean;
  dedupConfig?: DedupConfig;
}
