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
        <button type="button" onClick={handleCopy}>
          Copy
        </button>
        <button type="button" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
}
