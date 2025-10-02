import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface CompanySpecs {
  name: string;
  url: string;
  description: string;
  industry: string;
  serviceable_market_size: string;
  country: string;
  key_team_members: string;
  revenue: string;
  valuation: string;
  funding_sought: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Get the OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Parse the request body to get the file data
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer()
    const fileBase64 = encodeBase64(new Uint8Array(fileBuffer))

    // Prepare the OpenAI API request
    const openaiRequest = {
      model: "gpt-4o-mini", // Note: gpt-4.1-mini doesn't exist, using gpt-4o-mini instead
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: `Extract EXACTLY ONE JSON object from the pitch-deck text below.

Rules:
- Use only deck content (no outside info).
- All fields = STRING, keep units/symbols (e.g., "$2.5M", "10k users").
- If unknown, return "".
- For multiple team members, separate with semicolons.
- Industry must be "PrimaryIndustry; Sub-Industry".
  PrimaryIndustry ∈ {
Tech / AI / SaaS, Healthcare / Life Sciences, Consumer
FinTech,Climate / Energy,DeepTech / Frontier (space, robotics, quantum, etc.), Manufacturing, Other}.
- Valid JSON only, no commentary.

FIELDS
{
  "name": "Company name",
  "url": "Website URL",
  "description": "One-sentence product/service description",
  "industry": "PrimaryIndustry; Sub-Industry",
  "serviceable_market_size": "Market size as stated (with units/currency)",
  "country": "Country of operation",
  "key_team_members": "Format: Name | Role | Worked-at; …",
  "revenue": "Latest/projections with units",
  "valuation": "Valuation with units",
  "funding_sought": "Raise amount & terms"
}

OUTPUT
Return only the JSON object.`
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this pitch deck file: ${file.name}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      response_format: {
        type: "text"
      },
      temperature: 0.1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(openaiRequest)
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error("OpenAI API error:", errorData)
      return new Response(
        JSON.stringify({ error: "Failed to analyze pitch deck" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const openaiData = await openaiResponse.json()
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      return new Response(
        JSON.stringify({ error: "Invalid response from OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const extractedText = openaiData.choices[0].message.content
    
    try {
      // Parse the JSON response from OpenAI
      const companySpecs: CompanySpecs = JSON.parse(extractedText)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: companySpecs
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", extractedText)
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted data",
          raw_response: extractedText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})