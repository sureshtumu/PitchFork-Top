import { useState } from "react";
import { FUNCTION_BASE_URL } from "../lib/config";

export default function PDFUploader() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(null);
    setResult(null);
    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${FUNCTION_BASE_URL}/parse-pdf-openai`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-3">
      <input type="file" accept="application/pdf" onChange={handleUpload} />
      {loading && <div>Parsing on OpenAI…</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {result && (
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}