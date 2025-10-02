import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

    // Log the filename for debugging
    console.log("Processing PDF file:", file.name)
    console.log("File size:", file.size, "bytes")
    console.log("File type:", file.type)

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      return new Response(
        JSON.stringify({ error: "Only PDF files are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Convert file to base64 for OpenAI API
    const fileBuffer = await file.arrayBuffer()
    const base64File = encodeBase64(new Uint8Array(fileBuffer))

    // Prepare the OpenAI API request
    const openaiRequest = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting information from PDF documents. Extract key business information from this document.

Extract the following information:
- company_name: The name of the company
- industry: The industry or sector the company operates in  
- key_team_members: Names and roles of key team members

Return only valid JSON in this exact format:
{
  "company_name": "extracted company name or empty string if not found",
  "industry": "extracted industry or empty string if not found",
  "key_team_members": "extracted team members or empty string if not found"
}`
        },
        {
          role: "user",
          content: `Please analyze this PDF document and extract the company information. Here is the base64-encoded PDF content:

data:application/pdf;base64,${base64File}`
        }
      ],
      text: {
        format: "json_object"
      },
      temperature: 0.1,
      max_tokens: 2048,
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
      console.error("OpenAI API status:", openaiResponse.status)
      return new Response(
        JSON.stringify({ error: "Failed to analyze PDF document" }),
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

    const aiExtractedContent = openaiData.choices[0].message.content
    
    try {
      // Parse the JSON response from OpenAI
      const extractedData = JSON.parse(aiExtractedContent)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: extractedData
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", aiExtractedContent)
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted data",
          raw_response: aiExtractedContent
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