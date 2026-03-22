interface JsonPreviewProps {
  obj: object;
}

export function JsonPreview({ obj }: JsonPreviewProps) {
  const json = JSON.stringify(obj, null, 2);
  return <pre className="font-mono text-sm">{json}</pre>;
}
