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

/** Creates ingestion step schema with tableType context for STREAM config validation. */
export function createIngestionStepSchema(
  tableType: "OFFLINE" | "REALTIME"
) {
  return z
    .object({
      ingestionType: z.enum(["NONE", "BATCH", "STREAM"]),
      streamConfig: z
        .object({
          topicName: z.string().optional(),
          bootstrapServers: z.string().optional(),
        })
        .optional(),
      batchConfig: z.object({}).passthrough().optional(),
    })
    .superRefine((data, ctx) => {
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
    });
}
