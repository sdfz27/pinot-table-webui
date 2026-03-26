import { describe, it, expect } from "vitest";
import { generateTable } from "./generateTable";
import type { WizardStateShape } from "../types/wizard";
import {
  DEFAULT_KAFKA_JSON_DECODER,
  KAFKA_CONSUMER_FACTORY_CLASS,
} from "./kafkaStreamConfig";

function offlineWithBatchIngestion(): WizardStateShape {
  return {
    currentStep: 0,
    tableName: "events",
    tableType: "OFFLINE",
    columns: [{ id: "c1", fieldType: "DIMENSION", name: "id", dataType: "STRING" }],
    primaryKeyColumns: [],
    enableColumnBasedNullHandling: false,
    timeColumnName: "",
    replication: 1,
    retentionTimeUnit: "",
    retentionTimeValue: 0,
    completionMode: "DOWNLOAD",
    fieldConfigList: [],
    sortedColumn: "",
    loadMode: "HEAP",
    noDictionaryColumns: [],
    invertedIndexColumns: [],
    bloomFilterColumns: [],
    rangeIndexColumns: [],
    onHeapDictionaryColumns: [],
    varLengthDictionaryColumns: [],
    jsonIndexColumns: [],
    brokerTenant: "",
    serverTenant: "",
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
    primaryKeyColumns: [],
    enableColumnBasedNullHandling: false,
    timeColumnName: "",
    replication: 1,
    retentionTimeUnit: "",
    retentionTimeValue: 0,
    completionMode: "DOWNLOAD",
    fieldConfigList: [],
    sortedColumn: "",
    loadMode: "HEAP",
    noDictionaryColumns: [],
    invertedIndexColumns: [],
    bloomFilterColumns: [],
    rangeIndexColumns: [],
    onHeapDictionaryColumns: [],
    varLengthDictionaryColumns: [],
    jsonIndexColumns: [],
    brokerTenant: "",
    serverTenant: "",
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
  });

  it("REALTIME with STREAM ingestion puts stream config under tableIndexConfig.streamConfigs", () => {
    const state = realtimeWithStreamIngestion();
    const table = generateTable(state);
    expect(table.tableType).toBe("REALTIME");
    expect(table.ingestionConfig).toBeUndefined();
    expect(table.tableIndexConfig.streamConfigs).toEqual({
      streamType: "kafka",
      "stream.kafka.topic.name": "events-topic",
      "stream.kafka.broker.list": "broker1:9092",
      "stream.kafka.consumer.factory.class.name": KAFKA_CONSUMER_FACTORY_CLASS,
      "stream.kafka.consumer.type": "lowlevel",
      "stream.kafka.consumer.prop.auto.offset.reset": "smallest",
      "stream.kafka.decoder.class.name": DEFAULT_KAFKA_JSON_DECODER,
    });
  });

  it("emits completionConfig, table index column lists, and tenants when set", () => {
    const state = offlineWithBatchIngestion();
    state.invertedIndexColumns = ["id"];
    state.brokerTenant = "broker_t";
    state.serverTenant = "server_t";
    const table = generateTable(state);
    expect(table.segmentsConfig.completionConfig).toEqual({ completionMode: "DOWNLOAD" });
    expect(table.tableIndexConfig.invertedIndexColumns).toEqual(["id"]);
    expect(table.tenants).toEqual({ broker: "broker_t", server: "server_t" });
  });

  it("emits completionConfig with BUILD when selected", () => {
    const state = offlineWithBatchIngestion();
    state.completionMode = "BUILD";
    const table = generateTable(state);
    expect(table.segmentsConfig.completionConfig).toEqual({ completionMode: "BUILD" });
  });

  it("always emits table index column arrays as empty when none selected", () => {
    const state = offlineWithBatchIngestion();
    const table = generateTable(state);
    expect(table.tableIndexConfig.noDictionaryColumns).toEqual([]);
    expect(table.tableIndexConfig.invertedIndexColumns).toEqual([]);
    expect(table.tableIndexConfig.bloomFilterColumns).toEqual([]);
    expect(table.tableIndexConfig.rangeIndexColumns).toEqual([]);
    expect(table.tableIndexConfig.onHeapDictionaryColumns).toEqual([]);
    expect(table.tableIndexConfig.varLengthDictionaryColumns).toEqual([]);
    expect(table.tableIndexConfig.jsonIndexColumns).toEqual([]);
  });
});
