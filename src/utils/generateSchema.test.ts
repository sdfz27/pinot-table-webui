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

  it("maps one dimension column to one entry in dimensionFieldSpecs with fieldType", () => {
    const state = minimalWizardWithDimensionColumn();
    const schema = generateSchema(state);
    expect(schema.dimensionFieldSpecs).toHaveLength(1);
    expect(schema.dimensionFieldSpecs[0]).toEqual({
      name: "user_id",
      dataType: "STRING",
      fieldType: "DIMENSION",
    });
  });

  it("omits singleValueField for single-value dimension (default), includes false for multi-value", () => {
    const singleState = minimalWizardWithDimensionColumn();
    const singleSchema = generateSchema(singleState);
    expect(singleSchema.dimensionFieldSpecs[0].singleValueField).toBeUndefined();

    const multiState = {
      ...minimalWizardWithDimensionColumn(),
      columns: [
        {
          id: "col-1",
          fieldType: "DIMENSION" as const,
          name: "tags",
          dataType: "STRING" as const,
          singleValueField: false,
        },
      ],
    };
    const multiSchema = generateSchema(multiState);
    expect(multiSchema.dimensionFieldSpecs[0].singleValueField).toBe(false);
  });

  it("includes primaryKeyColumns when set", () => {
    const state = {
      ...minimalWizardWithDimensionColumn(),
      primaryKeyColumns: ["user_id"],
    };
    const schema = generateSchema(state);
    expect(schema.primaryKeyColumns).toEqual(["user_id"]);
  });
});
