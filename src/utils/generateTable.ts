import type {
  PinotTable,
  SegmentsConfig,
  TableIndexConfig,
} from "../types/pinotTable";
import type { WizardStateShape } from "../types/wizard";

export function generateTable(state: WizardStateShape): PinotTable {
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

  const tableIndexConfig: TableIndexConfig = {
    loadMode: state.loadMode,
  };
  if (state.sortedColumn) {
    tableIndexConfig.sortedColumn = state.sortedColumn;
  }

  const table: PinotTable = {
    tableName: state.tableName,
    tableType: state.tableType,
    segmentsConfig,
    tableIndexConfig,
  };

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
