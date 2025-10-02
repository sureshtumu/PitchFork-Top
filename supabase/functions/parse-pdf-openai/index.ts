// supabase/functions/parse-pdf/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.52.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const { signedUrl } = await req.json();
    if (!signedUrl) {
      return new Response(JSON.stringify({ error: "signedUrl required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    // 1) Fetch the PDF bytes from the signed URL
    const pdfRes = await fetch(signedUrl);
    if (!pdfRes.ok) throw new Error(`Failed to fetch PDF: ${pdfRes.status}`);
    const buf = new Uint8Array(await pdfRes.arrayBuffer());
    const pdfFile = new File([buf], "deck.pdf", { type: "application/pdf" });

    // 2) Upload PDF to OpenAI as a file input
    const uploaded = await openai.files.create({
      file: pdfFile,
      // purpose value accepted by OpenAI file inputs for model usage
      purpose: "assistants",
    });

    // 3) Ask gpt-4.0 to read that file and return strict JSON
    const schema = {
      name: "CompanyExtraction",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          company_name: { type: "string", nullable: true },
          industry: { type: "string", nullable: true },
          key_team_members: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                role: { type: "string" }
              },
              required: ["name","role"]
            },
            nullable: true
          }
        },
        required: ["company_name","industry","key_team_members"]
      }
    };

    // Use Responses API with file input + structured outputs
    const resp = await openai.responses.create({
      model: "gpt-4.0",
      input: [{
        role: "user",
        content: [
          { type: "input_text",
            text: "Read the attached PDF pitch deck and extract: company_name, industry, key_team_members (name, role). Return JSON only." },
          { type: "input_file", file_id: uploaded.id }
        ]
      }],
      response_format: { type: "json_schema", json_schema: schema },
      temperature: 0
    });

    // Pull the JSON string out of the response
    // (shape may evolve; prefer the top-level output text when present)
    const text =
      // @ts-ignore (SDK output variants)
      resp.output?.[0]?.content?.[0]?.text ??
      // fallback to message content if SDK returns that shape
      // @ts-ignore
      resp.output_text ??
      JSON.stringify(resp);

    return new Response(text, { status: 200, headers: { ...cors, "Content-Type": "application/json" }});
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
