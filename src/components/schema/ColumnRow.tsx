import type { ColumnData } from "../../types/wizard";
import type { DataType, FieldType } from "../../types/pinotSchema";
import { FieldTypeSelector } from "./FieldTypeSelector";

const DIMENSION_DATA_TYPES: DataType[] = [
  "INT",
  "LONG",
  "FLOAT",
  "DOUBLE",
  "BOOLEAN",
  "TIMESTAMP",
  "STRING",
  "BYTES",
  "JSON",
];

const METRIC_DATA_TYPES: DataType[] = [
  "INT",
  "LONG",
  "FLOAT",
  "DOUBLE",
  "BIG_DECIMAL",
  "BYTES",
];

const DATETIME_DATA_TYPES: DataType[] = ["STRING", "INT", "LONG", "TIMESTAMP"];

const COMPLEX_DATA_TYPES: DataType[] = ["MAP"];

const VALUE_DATA_TYPES: DataType[] = [
  ...DIMENSION_DATA_TYPES,
  "BIG_DECIMAL",
];

function getDataTypesForFieldType(fieldType: FieldType): DataType[] {
  switch (fieldType) {
    case "DIMENSION":
      return DIMENSION_DATA_TYPES;
    case "METRIC":
      return METRIC_DATA_TYPES;
    case "DATETIME":
      return DATETIME_DATA_TYPES;
    case "COMPLEX":
      return COMPLEX_DATA_TYPES;
    default:
      return DIMENSION_DATA_TYPES;
  }
}

export interface ColumnRowProps {
  column: ColumnData;
  onChange: (column: ColumnData) => void;
  onRemove: () => void;
}

export function ColumnRow({ column, onChange, onRemove }: ColumnRowProps) {
  const dataTypes = getDataTypesForFieldType(column.fieldType);
  const showMultiValueField = column.fieldType === "DIMENSION";
  const showDateTimeFields = column.fieldType === "DATETIME";
  const showComplexFields = column.fieldType === "COMPLEX";

  const update = (patch: Partial<ColumnData>) => {
    onChange({ ...column, ...patch });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded border border-gray-200 p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`field-type-${column.id}`} className="text-xs text-gray-600">
          Field Type
        </label>
        <FieldTypeSelector
          id={`field-type-${column.id}`}
          value={column.fieldType}
          onChange={(v) => {
            const types = getDataTypesForFieldType(v);
            const newCol: ColumnData = {
              ...column,
              fieldType: v,
              dataType: types[0],
              singleValueField: v === "DIMENSION" ? column.singleValueField : undefined,
              format: v === "DATETIME" ? column.format ?? "1:MILLISECONDS:EPOCH" : undefined,
              granularity: v === "DATETIME" ? column.granularity ?? "MILLISECONDS" : undefined,
              valueDataType: v === "COMPLEX" ? column.valueDataType ?? "STRING" : undefined,
            };
            onChange(newCol);
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`name-${column.id}`} className="text-xs text-gray-600">
          Column Name
        </label>
        <input
          id={`name-${column.id}`}
          type="text"
          value={column.name}
          onChange={(e) => update({ name: e.target.value })}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="Column name"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`data-type-${column.id}`} className="text-xs text-gray-600">
          Data Type
        </label>
        <select
          id={`data-type-${column.id}`}
          value={column.dataType}
          onChange={(e) => update({ dataType: e.target.value as DataType })}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {dataTypes.map((dt) => (
            <option key={dt} value={dt}>
              {dt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`default-null-${column.id}`} className="text-xs text-gray-600">
          Default Null Value
        </label>
        <input
          id={`default-null-${column.id}`}
          type="text"
          value={column.defaultNullValue ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            const num = Number(v);
            update({
              defaultNullValue: v === "" ? undefined : isNaN(num) ? v : num,
            });
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm w-24"
          placeholder="Optional"
        />
      </div>
      {showMultiValueField && (
        <div className="flex items-center gap-2 mt-6">
          <input
            id={`multi-value-${column.id}`}
            type="checkbox"
            checked={column.singleValueField === false}
            onChange={(e) => update({ singleValueField: e.target.checked ? false : undefined })}
            className="rounded"
          />
          <label htmlFor={`multi-value-${column.id}`} className="text-sm">
            Multi Value Field
          </label>
        </div>
      )}
      {showDateTimeFields && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor={`format-${column.id}`} className="text-xs text-gray-600">
              Format
            </label>
            <input
              id={`format-${column.id}`}
              type="text"
              value={column.format ?? ""}
              onChange={(e) => update({ format: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="e.g. 1:MILLISECONDS:EPOCH"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`granularity-${column.id}`} className="text-xs text-gray-600">
              Granularity
            </label>
            <input
              id={`granularity-${column.id}`}
              type="text"
              value={column.granularity ?? ""}
              onChange={(e) => update({ granularity: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="e.g. MILLISECONDS"
            />
          </div>
        </>
      )}
      {showComplexFields && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`value-data-type-${column.id}`} className="text-xs text-gray-600">
            Value Data Type
          </label>
          <select
            id={`value-data-type-${column.id}`}
            value={column.valueDataType ?? "STRING"}
            onChange={(e) => update({ valueDataType: e.target.value as DataType })}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {VALUE_DATA_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {dt}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-end ml-auto">
        <button
          type="button"
          onClick={onRemove}
          className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200"
          aria-label="Remove column"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
