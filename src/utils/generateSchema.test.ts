import { describe, it, expect } from "vitest";
import { generateSchema } from "./generateSchema";
import type { WizardStateShape } from "../types/wizard";

function minimalWizardWithDimensionColumn(): WizardStateShape {
  return {
    currentStep: 0,
    tableName: "my_table",
    tableType: "OFFLINE",
    columns: [
      {
        id: "col-1",
        fieldType: "DIMENSION",
        name: "user_id",
        dataType: "STRING",
      },
    ],
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
}

describe("generateSchema", () => {
  it("produces schemaName equal to tableName with minimal wizard state and one dimension column", () => {
    const state = minimalWizardWithDimensionColumn();
    const schema = generateSchema(state);
    expect(schema.schemaName).toBe("my_table");
  });

  it("maps one dimension column to one entry in dimensionFieldSpecs", () => {
    const state = minimalWizardWithDimensionColumn();
    const schema = generateSchema(state);
    expect(schema.dimensionFieldSpecs).toHaveLength(1);
    expect(schema.dimensionFieldSpecs[0]).toEqual({
      name: "user_id",
      dataType: "STRING",
    });
  });
});
