import type { FieldType } from "../../types/pinotSchema";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "DIMENSION", label: "Dimension" },
  { value: "METRIC", label: "Metric" },
  { value: "DATETIME", label: "DateTime" },
  { value: "COMPLEX", label: "Complex" },
];

export interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (value: FieldType) => void;
  id?: string;
}

export function FieldTypeSelector({
  value,
  onChange,
  id = "field-type",
}: FieldTypeSelectorProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as FieldType)}
      className="rounded border border-gray-300 px-2 py-1 text-sm"
    >
      {FIELD_TYPES.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
