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
  /** Flat Pinot stream config map (`stream.kafka.*`, flush thresholds, etc.). */
  streamConfigs?: Record<string, string>;
}

export interface TenantsConfig {
  broker: string;
  server: string;
}

export interface BatchIngestionConfig {
  segmentIngestionType: "APPEND" | "REFRESH";
  segmentIngestionFrequency: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
}

/** Wizard / state shape for Kafka stream ingestion (flattened into `tableIndexConfig.streamConfigs` in JSON). */
export interface StreamIngestionConfig {
  streamType: "kafka";
  topicName: string;
  bootstrapServers: string;
  /** Pinot `stream.kafka.consumer.type` — default lowlevel. */
  consumeType?: "lowlevel" | "highlevel";
  /** Pinot `stream.kafka.consumer.prop.auto.offset.reset` — default smallest. */
  autoOffsetReset?: "smallest" | "largest";
  /** Kafka `sasl.mechanism` (bare key in stream map). */
  saslMechanism?: string;
  /** Kafka `security.protocol` (bare key in stream map). */
  securityProtocol?: string;
  /** Kafka `sasl.jaas.config` (bare key in stream map). */
  saslJaasConfig?: string;
  /** Pinot `stream.kafka.decoder.class.name`. */
  decoderClassName?: string;
  /** `realtime.segment.flush.threshold.rows` */
  segmentFlushRows?: string;
  /** `realtime.segment.flush.threshold.size` */
  segmentFlushSize?: string;
  /** `realtime.segment.flush.threshold.time` */
  segmentFlushTime?: string;
  /** `realtime.segment.flush.threshold.autotune.initialRows` */
  segmentFlushInitialRows?: string;
  /** Additional properties; keys emitted as-is in the stream map. */
  consumerExtraProps?: Record<string, string>;
}

/** Matches `org.apache.pinot.spi.utils.Enablement` JSON. */
export type UpsertEnablement = "ENABLE" | "DISABLE" | "DEFAULT";

/** Matches `UpsertConfig.ConsistencyMode` in Pinot. */
export type UpsertConsistencyMode = "NONE" | "SYNC" | "SNAPSHOT";

/** Matches `HashFunction` in Pinot (`org.apache.pinot.spi.config.table.HashFunction`). */
export type UpsertHashFunction =
  | "NONE"
  | "MD5"
  | "MURMUR3"
  | "UUID"
  | "XXHASH"
  | "XXH128";

/** Matches `UpsertConfig.Strategy` for partial upsert. */
export type DefaultPartialUpsertStrategy =
  | "APPEND"
  | "IGNORE"
  | "INCREMENT"
  | "MAX"
  | "MIN"
  | "OVERWRITE"
  | "FORCE_OVERWRITE"
  | "UNION";

export interface UpsertConfig {
  mode: "FULL" | "PARTIAL";
  /** Pinot `comparisonColumns` — columns used to pick the latest row for a primary key (defaults to time column if omitted). */
  comparisonColumns: string[];
  snapshot: UpsertEnablement;
  preload: UpsertEnablement;
  dropOutOfOrderRecord: boolean;
  enableDeletedKeysCompactionConsistency: boolean;
  deletedKeysTTL: number;
  consistencyMode: UpsertConsistencyMode;
  hashFunction: UpsertHashFunction;
  defaultPartialUpsertStrategy: DefaultPartialUpsertStrategy;
  /** Deprecated in Pinot; kept for backward-compatible table configs. */
  enableSnapshot: boolean;
  enablePreload: boolean;
}

export function createDefaultUpsertConfig(): UpsertConfig {
  return {
    mode: "FULL",
    comparisonColumns: [],
    snapshot: "ENABLE",
    preload: "ENABLE",
    dropOutOfOrderRecord: false,
    enableDeletedKeysCompactionConsistency: false,
    deletedKeysTTL: 0,
    consistencyMode: "NONE",
    hashFunction: "NONE",
    defaultPartialUpsertStrategy: "OVERWRITE",
    enableSnapshot: true,
    enablePreload: true,
  };
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
  };
  upsertConfig?: UpsertConfig;
  dedupConfig?: DedupConfig;
}
