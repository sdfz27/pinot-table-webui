import { describe, it, expect } from "vitest";
import { basicInfoSchema, schemaStepSchema } from "./validation";

describe("basicInfoSchema", () => {
  it("rejects double underscores in table name", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "bad__name",
      tableType: "OFFLINE",
    });
    expect(r.success).toBe(false);
  });

  it("rejects consecutive hyphens in table name", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "bad--name",
      tableType: "OFFLINE",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid table name and type", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "valid_table-name",
      tableType: "REALTIME",
    });
    expect(r.success).toBe(true);
  });
});

describe("schemaStepSchema", () => {
  const validColumn = {
    id: "1",
    fieldType: "DIMENSION" as const,
    name: "col1",
    dataType: "STRING",
  };

  it("rejects empty columns", () => {
    const r = schemaStepSchema.safeParse({ columns: [] });
    expect(r.success).toBe(false);
  });

  it("rejects duplicate column names", () => {
    const r = schemaStepSchema.safeParse({
      columns: [
        { ...validColumn, id: "1", name: "dup" },
        { ...validColumn, id: "2", name: "dup" },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid columns with unique names", () => {
    const r = schemaStepSchema.safeParse({
      columns: [validColumn, { ...validColumn, id: "2", name: "col2" }],
    });
    expect(r.success).toBe(true);
  });
});
