import { describe, it, expect } from "vitest";
import { generateTable } from "./generateTable";
import type { WizardStateShape } from "../types/wizard";

function offlineWithBatchIngestion(): WizardStateShape {
  return {
    currentStep: 0,
    tableName: "events",
    tableType: "OFFLINE",
    columns: [{ id: "c1", fieldType: "DIMENSION", name: "id", dataType: "STRING" }],
    enableColumnBasedNullHandling: false,
    timeColumnName: "",
    replication: 1,
    retentionTimeUnit: "",
    retentionTimeValue: 0,
    fieldConfigList: [],
    sortedColumn: "",
    loadMode: "HEAP",
    ingestionType: "BATCH",
    batchConfig: {
      segmentIngestionType: "APPEND",
      segmentIngestionFrequency: "DAILY",
    },
    enableUpsert: false,
    enableDedup: false,
  };
}

function realtimeWithStreamIngestion(): WizardStateShape {
  return {
    currentStep: 0,
    tableName: "events",
    tableType: "REALTIME",
    columns: [{ id: "c1", fieldType: "DIMENSION", name: "id", dataType: "STRING" }],
    enableColumnBasedNullHandling: false,
    timeColumnName: "",
    replication: 1,
    retentionTimeUnit: "",
    retentionTimeValue: 0,
    fieldConfigList: [],
    sortedColumn: "",
    loadMode: "HEAP",
    ingestionType: "STREAM",
    streamConfig: {
      streamType: "kafka",
      topicName: "events-topic",
      bootstrapServers: "broker1:9092",
    },
    enableUpsert: false,
    enableDedup: false,
  };
}

describe("generateTable", () => {
  it("OFFLINE with BATCH ingestion produces batchIngestionConfig under ingestionConfig", () => {
    const state = offlineWithBatchIngestion();
    const table = generateTable(state);
    expect(table.tableType).toBe("OFFLINE");
    expect(table.ingestionConfig).toBeDefined();
    expect(table.ingestionConfig?.batchIngestionConfig).toBeDefined();
    expect(table.ingestionConfig?.batchIngestionConfig).toEqual({
      segmentIngestionType: "APPEND",
      segmentIngestionFrequency: "DAILY",
    });
    expect(table.ingestionConfig?.streamIngestionConfig).toBeUndefined();
  });

  it("REALTIME with STREAM ingestion produces streamIngestionConfig with streamType kafka", () => {
    const state = realtimeWithStreamIngestion();
    const table = generateTable(state);
    expect(table.tableType).toBe("REALTIME");
    expect(table.ingestionConfig).toBeDefined();
    expect(table.ingestionConfig?.streamIngestionConfig).toBeDefined();
    expect(table.ingestionConfig?.streamIngestionConfig?.streamType).toBe("kafka");
    expect(table.ingestionConfig?.streamIngestionConfig).toEqual({
      streamType: "kafka",
      topicName: "events-topic",
      bootstrapServers: "broker1:9092",
    });
    expect(table.ingestionConfig?.batchIngestionConfig).toBeUndefined();
  });
});
