// Pinot Schema Types - JSON output uses Pinot keys (e.g. dimensionFieldSpecs plural)

export type DataType =
  | "INT"
  | "LONG"
  | "FLOAT"
  | "DOUBLE"
  | "BIG_DECIMAL"
  | "BOOLEAN"
  | "TIMESTAMP"
  | "STRING"
  | "JSON"
  | "BYTES"
  | "MAP";

export type FieldType = "DIMENSION" | "METRIC" | "DATETIME" | "COMPLEX";

/** Dimension fields: INT, LONG, FLOAT, DOUBLE, BOOLEAN, TIMESTAMP, STRING, BYTES, JSON (no BIG_DECIMAL) */
export type DimensionDataType = Exclude<DataType, "BIG_DECIMAL">;

export interface DimensionFieldSpec {
  name: string;
  dataType: DimensionDataType;
  fieldType?: "DIMENSION";
  defaultNullValue?: string | number;
  singleValueField?: boolean;
}

export interface MetricFieldSpec {
  name: string;
  dataType: "INT" | "LONG" | "FLOAT" | "DOUBLE" | "BIG_DECIMAL" | "BYTES";
  fieldType?: "METRIC";
  defaultNullValue?: number;
}

export interface DateTimeFieldSpec {
  name: string;
  dataType: "STRING" | "INT" | "LONG" | "TIMESTAMP";
  fieldType?: "DATETIME";
  format: string;
  granularity: string;
  defaultNullValue?: string | number;
}

export interface ComplexFieldSpec {
  name: string;
  dataType: "MAP";
  fieldType: "COMPLEX";
  notNull: boolean;
  childFieldSpecs: {
    key: {
      name: "key";
      dataType: "STRING";
      fieldType: "DIMENSION";
      notNull: boolean;
    };
    value: {
      name: "value";
      dataType: DataType;
      fieldType: "DIMENSION";
      notNull: boolean;
    };
  };
}

export interface PinotSchema {
  schemaName: string;
  enableColumnBasedNullHandling?: boolean;
  primaryKeyColumns?: string[];
  dimensionFieldSpecs: DimensionFieldSpec[];
  metricFieldSpecs: MetricFieldSpec[];
  dateTimeFieldSpecs: DateTimeFieldSpec[];
  complexFieldSpecs?: ComplexFieldSpec[];
}
