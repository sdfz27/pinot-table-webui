import { describe, it, expect } from "vitest";
import { basicInfoSchema, columnSchema, schemaStepSchema } from "./validation";

describe("basicInfoSchema", () => {
  it("rejects empty table name", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "",
      tableType: "OFFLINE",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid chars (e.g. spaces) in table name", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "bad name",
      tableType: "OFFLINE",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid tableType", () => {
    const r = basicInfoSchema.safeParse({
      tableName: "valid_table",
      tableType: "INVALID",
    });
    expect(r.success).toBe(false);
  });

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

describe("columnSchema", () => {
  it("rejects DIMENSION with dataType BIG_DECIMAL", () => {
    const r = columnSchema.safeParse({
      id: "1",
      fieldType: "DIMENSION",
      name: "col1",
      dataType: "BIG_DECIMAL",
    });
    expect(r.success).toBe(false);
  });

  it("rejects DATETIME without format", () => {
    const r = columnSchema.safeParse({
      id: "1",
      fieldType: "DATETIME",
      name: "col1",
      dataType: "LONG",
      granularity: "DAY",
    });
    expect(r.success).toBe(false);
  });

  it("rejects DATETIME without granularity", () => {
    const r = columnSchema.safeParse({
      id: "1",
      fieldType: "DATETIME",
      name: "col1",
      dataType: "LONG",
      format: "1:DAYS:EPOCH",
    });
    expect(r.success).toBe(false);
  });

  it("rejects COMPLEX without valueDataType", () => {
    const r = columnSchema.safeParse({
      id: "1",
      fieldType: "COMPLEX",
      name: "col1",
      dataType: "MAP",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid METRIC column", () => {
    const r = columnSchema.safeParse({
      id: "1",
      fieldType: "METRIC",
      name: "col1",
      dataType: "LONG",
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
