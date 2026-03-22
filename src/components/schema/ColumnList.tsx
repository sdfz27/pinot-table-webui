import { ColumnRow } from "./ColumnRow";
import type { ColumnData } from "../../types/wizard";

function generateId(): string {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultColumn(): ColumnData {
  return {
    id: generateId(),
    fieldType: "DIMENSION",
    name: "",
    dataType: "STRING",
  };
}

export interface ColumnListProps {
  columns: ColumnData[];
  onChange: (columns: ColumnData[]) => void;
}

export function ColumnList({ columns, onChange }: ColumnListProps) {
  const handleAdd = () => {
    const newColumn = createDefaultColumn();
    onChange([...columns, newColumn]);
  };

  const handleRemove = (id: string) => {
    onChange(columns.filter((c) => c.id !== id));
  };

  const handleColumnChange = (index: number, updated: ColumnData) => {
    const next = [...columns];
    next[index] = updated;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {columns.map((col, index) => (
          <ColumnRow
            key={col.id}
            column={col}
            onChange={(updated) => handleColumnChange(index, updated)}
            onRemove={() => handleRemove(col.id)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="rounded bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200"
      >
        Add column
      </button>
    </div>
  );
}
