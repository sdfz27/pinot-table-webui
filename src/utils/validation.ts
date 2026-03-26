import { z } from "zod";

const dimensionDataTypes = [
  "INT",
  "LONG",
  "FLOAT",
  "DOUBLE",
  "BOOLEAN",
  "TIMESTAMP",
  "STRING",
  "BYTES",
  "JSON",
] as const;

const metricDataTypes = [
  "INT",
  "LONG",
  "FLOAT",
  "DOUBLE",
  "BIG_DECIMAL",
  "BYTES",
] as const;

const dateTimeDataTypes = ["STRING", "INT", "LONG", "TIMESTAMP"] as const;

const complexDataTypes = ["MAP"] as const;

const dataTypes = [
  ...dimensionDataTypes,
  "BIG_DECIMAL",
] as const satisfies readonly string[];

export const basicInfoSchema = z.object({
  tableName: z
    .string()
    .min(1, "Table name is required")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only alphanumeric, hyphens, and underscores allowed"
    )
    .refine((name) => !name.includes("__"), "Double underscores are not allowed")
    .refine(
      (name) => !name.includes("--"),
      "Consecutive hyphens are not allowed"
    ),
  tableType: z.enum(["OFFLINE", "REALTIME"]),
});

export const columnSchema = z
  .object({
    id: z.string(),
    fieldType: z.enum(["DIMENSION", "METRIC", "DATETIME", "COMPLEX"]),
    name: z.string().min(1, "Column name is required"),
    dataType: z.string(),
    defaultNullValue: z.union([z.string(), z.number()]).optional(),
    singleValueField: z.boolean().optional(),
    format: z.string().optional(),
    granularity: z.string().optional(),
    valueDataType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.fieldType) {
      case "DIMENSION":
        if (!dimensionDataTypes.includes(data.dataType as (typeof dimensionDataTypes)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Dimension data type must be one of: ${dimensionDataTypes.join(", ")}`,
            path: ["dataType"],
          });
        }
        break;
      case "METRIC":
        if (!metricDataTypes.includes(data.dataType as (typeof metricDataTypes)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Metric data type must be one of: ${metricDataTypes.join(", ")}`,
            path: ["dataType"],
          });
        }
        break;
      case "DATETIME":
        if (!dateTimeDataTypes.includes(data.dataType as (typeof dateTimeDataTypes)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `DateTime data type must be one of: ${dateTimeDataTypes.join(", ")}`,
            path: ["dataType"],
          });
        }
        if (!data.format || data.format.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Format is required for DateTime columns",
            path: ["format"],
          });
        }
        if (!data.granularity || data.granularity.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Granularity is required for DateTime columns",
            path: ["granularity"],
          });
        }
        break;
      case "COMPLEX":
        if (!complexDataTypes.includes(data.dataType as (typeof complexDataTypes)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Complex data type must be MAP",
            path: ["dataType"],
          });
        }
        if (!data.valueDataType || !dataTypes.includes(data.valueDataType as (typeof dataTypes)[number])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Value data type is required for Complex (MAP) columns",
            path: ["valueDataType"],
          });
        }
        break;
    }
  });

export const schemaStepSchema = z
  .object({
    columns: z.array(columnSchema).min(1, "At least one column is required"),
    primaryKeyColumns: z.array(z.string()).optional(),
    enableColumnBasedNullHandling: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const names = data.columns.map((c) => c.name);
      const unique = new Set(names);
      return names.length === unique.size;
    },
    { message: "Column names must be unique", path: ["columns"] }
  );

export const indexingStepSchema = z.object({
  replication: z.number().min(1, "Replication must be at least 1"),
});

const upsertConfigSchema = z.object({
  mode: z.enum(["FULL", "PARTIAL"]),
  comparisonColumns: z.array(z.string()).optional(),
  snapshot: z.enum(["ENABLE", "DISABLE", "DEFAULT"]),
  preload: z.enum(["ENABLE", "DISABLE", "DEFAULT"]),
  dropOutOfOrderRecord: z.boolean(),
  enableDeletedKeysCompactionConsistency: z.boolean(),
  deletedKeysTTL: z.number(),
  consistencyMode: z.enum(["NONE", "SYNC", "SNAPSHOT"]),
  hashFunction: z.enum([
    "NONE",
    "MD5",
    "MURMUR3",
    "UUID",
    "XXHASH",
    "XXH128",
  ]),
  defaultPartialUpsertStrategy: z.enum([
    "APPEND",
    "IGNORE",
    "INCREMENT",
    "MAX",
    "MIN",
    "OVERWRITE",
    "FORCE_OVERWRITE",
    "UNION",
  ]),
  enableSnapshot: z.boolean(),
  enablePreload: z.boolean(),
});

const upsertDedupSchema = {
  enableUpsert: z.boolean().optional(),
  upsertConfig: upsertConfigSchema.optional(),
  enableDedup: z.boolean().optional(),
  dedupConfig: z
    .object({
      hashFunction: z.enum(["NONE", "MD5", "MURMUR3"]),
    })
    .optional(),
};

/** Creates ingestion step schema with tableType context for STREAM config validation. */
export function createIngestionStepSchema(
  tableType: "OFFLINE" | "REALTIME"
) {
  const base = z
    .object({
      ingestionType: z.enum(["NONE", "BATCH", "STREAM"]),
      streamConfig: z
        .object({
          topicName: z.string().optional(),
          bootstrapServers: z.string().optional(),
          consumeType: z.enum(["lowlevel", "highlevel"]).optional(),
          autoOffsetReset: z.enum(["smallest", "largest"]).optional(),
          saslMechanism: z.string().optional(),
          securityProtocol: z.string().optional(),
          saslJaasConfig: z.string().optional(),
          decoderClassName: z.string().optional(),
          segmentFlushRows: z.string().optional(),
          segmentFlushSize: z.string().optional(),
          segmentFlushTime: z.string().optional(),
          segmentFlushInitialRows: z.string().optional(),
          consumerExtraPairs: z
            .array(
              z.object({
                key: z.string(),
                value: z.string(),
              })
            )
            .optional(),
        })
        .optional(),
      batchConfig: z.object({}).passthrough().optional(),
    })
    .extend(upsertDedupSchema);

  return base.superRefine((data, ctx) => {
    if (data.ingestionType === "STREAM" && tableType === "REALTIME") {
      const sc = data.streamConfig;
      if (!sc?.topicName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Topic name is required for stream ingestion",
          path: ["streamConfig", "topicName"],
        });
      }
      if (!sc?.bootstrapServers?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bootstrap servers are required for stream ingestion",
          path: ["streamConfig", "bootstrapServers"],
        });
      }
    }
    if (tableType === "REALTIME") {
      const d = data;
      const uc = d.upsertConfig;
      const dc = d.dedupConfig;
      if (
        d.enableUpsert &&
        (!uc || !uc.mode || (uc.comparisonColumns?.length ?? 0) === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Upsert mode and at least one comparison column are required when upsert is enabled",
          path: ["upsertConfig", "comparisonColumns"],
        });
      }
      if (d.enableDedup && (!dc || !dc.hashFunction)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hash function is required when dedup is enabled",
          path: ["dedupConfig"],
        });
      }
    }
  });
}