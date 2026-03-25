import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SearchableColumnMultiSelectProps {
  id: string;
  label: string;
  columnNames: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * Compact multi-select for many column names: search filter + checkboxes in a dropdown.
 */
export function SearchableColumnMultiSelect({
  id,
  label,
  columnNames,
  selected,
  onChange,
}: SearchableColumnMultiSelectProps) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columnNames;
    return columnNames.filter((n) => n.toLowerCase().includes(q));
  }, [columnNames, query]);

  const toggle = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((n) => n !== name));
    else onChange([...selected, name]);
  };

  const remove = (name: string) => {
    onChange(selected.filter((n) => n !== name));
  };

  if (columnNames.length === 0) {
    return (
      <div>
        <p className="block text-sm font-medium text-gray-700">{label}</p>
        <p className="mt-1 text-sm text-gray-500">Add columns in the schema step to select indexes.</p>
      </div>
    );
  }

  const triggerId = `${id}-${baseId}-trigger`;
  const searchId = `${id}-${baseId}-search`;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={triggerId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {selected.length > 0 && (
        <div className="mb-1 flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-md border border-gray-100 bg-gray-50 p-1.5">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex max-w-full items-center gap-1 rounded bg-white px-2 py-0.5 text-xs text-gray-800 shadow-sm ring-1 ring-gray-200"
            >
              <span className="truncate" title={name}>
                {name}
              </span>
              <button
                type="button"
                className="shrink-0 rounded px-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                onClick={() => remove(name)}
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {selected.length === 0 ? (
          <span className="text-gray-500">Search and select columns…</span>
        ) : (
          <span>
            {selected.length} column{selected.length === 1 ? "" : "s"} selected
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black/5"
          role="listbox"
          aria-multiselectable
        >
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter columns…"
            className="w-full border-b border-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            autoComplete="off"
            autoFocus
          />
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((name) => (
              <li key={name} role="option" aria-selected={selected.includes(name)}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(name)}
                    onChange={() => toggle(name)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="min-w-0 break-all">{name}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No matching columns</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
