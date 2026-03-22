// src/types/wizard.guard.test.ts
import { describe, it, expect } from "vitest";
import type { WizardStateShape } from "./wizard";

describe("wizard types", () => {
  it("accepts minimal default shape", () => {
    const s: WizardStateShape = {
      currentStep: 0,
      tableName: "",
      tableType: "OFFLINE",
      columns: [],
      enableColumnBasedNullHandling: false,
      timeColumnName: "",
      replication: 1,
      retentionTimeUnit: "",
      retentionTimeValue: 0,
      fieldConfigList: [],
      sortedColumn: "",
      loadMode: "HEAP",
      ingestionType: "NONE",
      enableUpsert: false,
      enableDedup: false,
    };
    expect(s.tableType).toBe("OFFLINE");
  });
});
