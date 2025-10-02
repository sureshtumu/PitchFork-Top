import { useState } from "react";
import { supabase } from "../lib/supabase";

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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/parse-pdf-openai`;
      
      const res = await fetch(functionUrl, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
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

  const handleButtonClick = () => {
    document.getElementById('pdf-file-input')?.click();
  };

  return (
    <div className="p-6 space-y-3">
      <div>
        <input 
          id="pdf-file-input"
          type="file" 
          accept="application/pdf" 
          onChange={handleUpload}
          className="sr-only"
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={loading}
          className="bg-gold-gradient text-white px-6 py-3 rounded-lg font-semibold hover:shadow-gold focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-financial"
        >
          {loading ? 'Processing...' : 'Choose PDF File'}
        </button>
      </div>
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