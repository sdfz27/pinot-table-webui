import { copyToClipboard, downloadJson } from "../../utils/export";

export type CopyDownloadVariant = "schema" | "table";

interface CopyDownloadProps {
  data: object;
  tableName: string;
  variant: CopyDownloadVariant;
  label?: string;
}

function getFilename(tableName: string, variant: CopyDownloadVariant): string {
  return variant === "schema"
    ? `${tableName}-schema.json`
    : `${tableName}-table.json`;
}

export function CopyDownload({
  data,
  tableName,
  variant,
  label,
}: CopyDownloadProps) {
  const filename = getFilename(tableName, variant);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    copyToClipboard(json);
  };

  const handleDownload = () => {
    downloadJson(data, filename);
  };

  return (
    <div>
      {label && <div className="mb-2 font-medium">{label}</div>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Download
        </button>
      </div>
    </div>
  );
}
