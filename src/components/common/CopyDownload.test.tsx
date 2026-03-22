import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CopyDownload } from "./CopyDownload";

describe("CopyDownload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "navigator",
      { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } },
    );
  });

  it("renders with label and triggers mocked clipboard with stringified JSON on Copy click", async () => {
    const data = { foo: "bar", count: 42 };
    const tableName = "my_table";
    render(
      <CopyDownload
        data={data}
        tableName={tableName}
        variant="schema"
        label="Schema JSON"
      />,
    );

    expect(screen.getByText("Schema JSON")).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    // copyToClipboard is async; allow promise to resolve
    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(data, null, 2),
      );
    });
  });
});
