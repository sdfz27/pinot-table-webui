import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnList } from "./ColumnList";
import type { ColumnData } from "../../types/wizard";

const mockColumns: ColumnData[] = [
  {
    id: "col-1",
    fieldType: "DIMENSION",
    name: "dim_col",
    dataType: "STRING",
  },
  {
    id: "col-2",
    fieldType: "METRIC",
    name: "metric_col",
    dataType: "INT",
  },
];

describe("ColumnList", () => {
  it("renders with mock columns and onChange; simulate remove asserts id removed", () => {
    const onChange = vi.fn();
    render(<ColumnList columns={mockColumns} onChange={onChange} />);

    expect(screen.getByDisplayValue("dim_col")).toBeInTheDocument();
    expect(screen.getByDisplayValue("metric_col")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: /remove|delete/i });
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalled();
    const updatedColumns = onChange.mock.calls[0][0] as ColumnData[];
    expect(updatedColumns.some((c) => c.id === "col-1")).toBe(false);
    expect(updatedColumns.length).toBe(1);
  });

  it("simulate add adds a new column with generated id", () => {
    const onChange = vi.fn();
    render(<ColumnList columns={mockColumns} onChange={onChange} />);

    const addButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(addButton);

    expect(onChange).toHaveBeenCalled();
    const updatedColumns = onChange.mock.calls[0][0] as ColumnData[];
    expect(updatedColumns.length).toBe(3);
    const newColumn = updatedColumns[2];
    expect(newColumn.id).toBeDefined();
    expect(newColumn.id.length).toBeGreaterThan(0);
  });
});
