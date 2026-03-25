import type {
  PinotTable,
  SegmentsConfig,
  TableIndexConfig,
} from "../types/pinotTable";
import type { WizardStateShape } from "../types/wizard";

function filterKnownColumns(names: string[], valid: Set<string>): string[] {
  return names.filter((n) => n && valid.has(n));
}

export function generateTable(state: WizardStateShape): PinotTable {
  const columnNames = new Set(state.columns.map((c) => c.name).filter(Boolean));

  const segmentsConfig: SegmentsConfig = {
    replication: state.replication,
  };
  if (state.timeColumnName) {
    segmentsConfig.timeColumnName = state.timeColumnName;
  }
  if (state.retentionTimeUnit && state.retentionTimeValue) {
    segmentsConfig.retentionTimeUnit =
      state.retentionTimeUnit as SegmentsConfig["retentionTimeUnit"];
    segmentsConfig.retentionTimeValue = state.retentionTimeValue;
  }
  if (state.completionMode === "DOWNLOAD") {
    segmentsConfig.completionConfig = { completionMode: "DOWNLOAD" };
  }

  const tableIndexConfig: TableIndexConfig = {
    loadMode: state.loadMode,
  };
  if (state.sortedColumn) {
    tableIndexConfig.sortedColumn = state.sortedColumn;
  }

  const nd = filterKnownColumns(state.noDictionaryColumns ?? [], columnNames);
  const inv = filterKnownColumns(state.invertedIndexColumns ?? [], columnNames);
  const bloom = filterKnownColumns(state.bloomFilterColumns ?? [], columnNames);
  const range = filterKnownColumns(state.rangeIndexColumns ?? [], columnNames);
  const onHeap = filterKnownColumns(state.onHeapDictionaryColumns ?? [], columnNames);
  const varLen = filterKnownColumns(state.varLengthDictionaryColumns ?? [], columnNames);
  const jsonIdx = filterKnownColumns(state.jsonIndexColumns ?? [], columnNames);
  if (nd.length) tableIndexConfig.noDictionaryColumns = nd;
  if (inv.length) tableIndexConfig.invertedIndexColumns = inv;
  if (bloom.length) tableIndexConfig.bloomFilterColumns = bloom;
  if (range.length) tableIndexConfig.rangeIndexColumns = range;
  if (onHeap.length) tableIndexConfig.onHeapDictionaryColumns = onHeap;
  if (varLen.length) tableIndexConfig.varLengthDictionaryColumns = varLen;
  if (jsonIdx.length) tableIndexConfig.jsonIndexColumns = jsonIdx;

  const table: PinotTable = {
    tableName: state.tableName,
    tableType: state.tableType,
    segmentsConfig,
    tableIndexConfig,
  };

  const broker = (state.brokerTenant ?? "").trim();
  const server = (state.serverTenant ?? "").trim();
  if (broker && server) {
    table.tenants = { broker, server };
  }

  if (state.fieldConfigList && state.fieldConfigList.length > 0) {
    table.fieldConfigList = state.fieldConfigList;
  }

  if (state.tableType === "OFFLINE" && state.ingestionType === "BATCH" && state.batchConfig) {
    table.ingestionConfig = {
      batchIngestionConfig: state.batchConfig,
    };
  }

  if (state.tableType === "REALTIME" && state.ingestionType === "STREAM" && state.streamConfig) {
    table.ingestionConfig = {
      ...table.ingestionConfig,
      streamIngestionConfig: state.streamConfig,
    };
  }

  if (state.tableType === "REALTIME" && state.enableUpsert && state.upsertConfig) {
    table.upsertConfig = state.upsertConfig;
  }

  if (state.tableType === "REALTIME" && state.enableDedup && state.dedupConfig) {
    table.dedupConfig = state.dedupConfig;
  }

  return table;
}
