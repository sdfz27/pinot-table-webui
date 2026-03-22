import type {
  PinotSchema,
  DimensionFieldSpec,
  MetricFieldSpec,
  DateTimeFieldSpec,
  ComplexFieldSpec,
} from "../types/pinotSchema";
import type { ColumnData, WizardStateShape } from "../types/wizard";

function toDimensionSpec(col: ColumnData): DimensionFieldSpec {
  const spec: DimensionFieldSpec = { name: col.name, dataType: col.dataType };
  if (col.defaultNullValue !== undefined && col.defaultNullValue !== "") {
    spec.defaultNullValue = col.defaultNullValue;
  }
  if (col.singleValueField !== undefined) {
    spec.singleValueField = col.singleValueField;
  }
  return spec;
}

function toMetricSpec(col: ColumnData): MetricFieldSpec {
  const spec: MetricFieldSpec = {
    name: col.name,
    dataType: col.dataType as MetricFieldSpec["dataType"],
  };
  if (col.defaultNullValue !== undefined && col.defaultNullValue !== "") {
    spec.defaultNullValue = Number(col.defaultNullValue);
  }
  return spec;
}

function toDateTimeSpec(col: ColumnData): DateTimeFieldSpec {
  const spec: DateTimeFieldSpec = {
    name: col.name,
    dataType: col.dataType as DateTimeFieldSpec["dataType"],
    format: col.format ?? "1:MILLISECONDS:EPOCH",
    granularity: col.granularity ?? "1:MILLISECONDS",
  };
  if (col.defaultNullValue !== undefined && col.defaultNullValue !== "") {
    spec.defaultNullValue = col.defaultNullValue;
  }
  return spec;
}

function toComplexSpec(col: ColumnData): ComplexFieldSpec {
  const valueDataType = col.valueDataType ?? "STRING";
  return {
    name: col.name,
    dataType: "MAP",
    fieldType: "COMPLEX",
    notNull: false,
    childFieldSpecs: {
      key: {
        name: "key",
        dataType: "STRING",
        fieldType: "DIMENSION",
        notNull: false,
      },
      value: {
        name: "value",
        dataType: valueDataType,
        fieldType: "DIMENSION",
        notNull: false,
      },
    },
  };
}

export function generateSchema(state: WizardStateShape): PinotSchema {
  const dimensionFieldSpecs: DimensionFieldSpec[] = [];
  const metricFieldSpecs: MetricFieldSpec[] = [];
  const dateTimeFieldSpecs: DateTimeFieldSpec[] = [];
  const complexFieldSpecs: ComplexFieldSpec[] = [];

  for (const col of state.columns) {
    switch (col.fieldType) {
      case "DIMENSION":
        dimensionFieldSpecs.push(toDimensionSpec(col));
        break;
      case "METRIC":
        metricFieldSpecs.push(toMetricSpec(col));
        break;
      case "DATETIME":
        dateTimeFieldSpecs.push(toDateTimeSpec(col));
        break;
      case "COMPLEX":
        complexFieldSpecs.push(toComplexSpec(col));
        break;
    }
  }

  const schema: PinotSchema = {
    schemaName: state.tableName,
    dimensionFieldSpecs,
    metricFieldSpecs,
    dateTimeFieldSpecs,
  };

  if (state.enableColumnBasedNullHandling) {
    schema.enableColumnBasedNullHandling = true;
  }

  if (complexFieldSpecs.length > 0) {
    schema.complexFieldSpecs = complexFieldSpecs;
  }

  return schema;
}
