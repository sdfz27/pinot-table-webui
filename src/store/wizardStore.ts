import { create } from "zustand";
import type { WizardStateShape, ColumnData } from "../types/wizard";

const initialState: WizardStateShape = {
  currentStep: 0,
  tableName: "",
  tableType: "OFFLINE",
  columns: [],
  primaryKeyColumns: [],
  enableColumnBasedNullHandling: false,
  timeColumnName: "",
  replication: 1,
  retentionTimeUnit: "",
  retentionTimeValue: 0,
  completionMode: "",
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
  ingestionType: "NONE",
  batchConfig: undefined,
  streamConfig: undefined,
  enableUpsert: false,
  upsertConfig: undefined,
  enableDedup: false,
  dedupConfig: undefined,
};

interface WizardStore extends WizardStateShape {
  setStep: (step: number) => void;
  updateBasicInfo: (
    data: Partial<Pick<WizardStateShape, "tableName" | "tableType">>
  ) => void;
  updateColumns: (columns: ColumnData[]) => void;
  addColumn: (column: ColumnData) => void;
  removeColumn: (id: string) => void;
  updateIndexing: (data: Partial<WizardStateShape>) => void;
  updateIngestion: (data: Partial<WizardStateShape>) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  updateBasicInfo: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  updateColumns: (columns) => set({ columns }),

  addColumn: (column) =>
    set((state) => ({
      columns: [...state.columns, column],
    })),

  removeColumn: (id) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== id),
    })),

  updateIndexing: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  updateIngestion: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),

  reset: () => set(initialState),
}));
