// Pinot Table Types - JSON output uses Pinot keys

export type TableType = "OFFLINE" | "REALTIME";

/** Segment completion; `completionMode` is typically `BUILD` or `DOWNLOAD`. */
export interface CompletionConfig {
  completionMode?: string;
}

export interface SegmentsConfig {
  timeColumnName?: string;
  replication: number;
  retentionTimeUnit?: "HOURS" | "DAYS" | "MONTHS" | "YEARS";
  retentionTimeValue?: number;
  completionConfig?: CompletionConfig;
}

export interface FieldConfig {
  name: string;
  encodingType: "RAW" | "DICTIONARY";
  indexes?: Record<string, object>;
}

export interface TableIndexConfig {
  sortedColumn?: string;
  segmentPartitionConfig?: object;
  loadMode?: "HEAP" | "MMAP";
  noDictionaryColumns?: string[];
  invertedIndexColumns?: string[];
  bloomFilterColumns?: string[];
  rangeIndexColumns?: string[];
  onHeapDictionaryColumns?: string[];
  varLengthDictionaryColumns?: string[];
  jsonIndexColumns?: string[];
}

export interface TenantsConfig {
  broker: string;
  server: string;
}

export interface BatchIngestionConfig {
  segmentIngestionType: "APPEND" | "REFRESH";
  segmentIngestionFrequency: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
}

export interface StreamIngestionConfig {
  streamType: "kafka";
  topicName: string;
  bootstrapServers: string;
  authenticationType?: "NONE" | "SASL" | "SSL";
  authenticationConfig?: {
    saslMechanism?: "PLAIN" | "SCRAM-SHA-256" | "SCRAM-SHA-512";
    saslUsername?: string;
    saslPassword?: string;
    sslTruststorePath?: string;
    sslKeystorePath?: string;
    sslKeystorePassword?: string;
  };
  consumerProperties?: Record<string, string>;
}

export interface UpsertConfig {
  mode: "FULL" | "PARTIAL";
  upsertKeyColumns: string[];
}

export interface DedupConfig {
  hashFunction: "NONE" | "MD5" | "MURMUR3";
}

export interface PinotTable {
  tableName: string;
  tableType: TableType;
  segmentsConfig: SegmentsConfig;
  tableIndexConfig: TableIndexConfig;
  tenants?: TenantsConfig;
  fieldConfigList?: FieldConfig[];
  ingestionConfig?: {
    batchIngestionConfig?: BatchIngestionConfig;
    streamIngestionConfig?: StreamIngestionConfig;
  };
  upsertConfig?: UpsertConfig;
  dedupConfig?: DedupConfig;
}
