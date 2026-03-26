interface JsonPreviewProps {
  obj: object;
}

export function JsonPreview({ obj }: JsonPreviewProps) {
  const json = JSON.stringify(obj, null, 2);
  return (
    <pre
      className="max-w-full min-w-0 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
    >
      {json}
    </pre>
  );
}
