import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface ExtractedInfo {
  company_name: string;
  industry: string;
  team_members: string;
}

interface RequestBody {
  fileId: string;
  filePath: string;
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

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Parse the request body to get the file reference
    const requestBody: RequestBody = await req.json()
    const { fileId, filePath } = requestBody
    
    console.log('Received request with fileId:', fileId);
    console.log('Received request with filePath:', filePath);
    
    if (!fileId || !filePath) {
      return new Response(
        JSON.stringify({ error: "No file ID or file path provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Get file information from database
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/uploaded-files?id=eq.${fileId}&select=*`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch file information from database" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const dbData = await dbResponse.json();
    if (!dbData || dbData.length === 0) {
      return new Response(
        JSON.stringify({ error: "File not found in database" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const fileRecord = dbData[0];
    console.log("Processing PDF file:", fileRecord.name)
    console.log("Original filename:", fileRecord.original_filename)

    // Check if file is PDF based on filename
    if (!fileRecord.original_filename.toLowerCase().endsWith('.pdf')) {
      return new Response(
        JSON.stringify({ error: "Only PDF files are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Download the file from Supabase storage
    const storageUrl = `${supabaseUrl}/storage/v1/object/company-documents/${filePath}`;
    console.log('Attempting to download file from storage:', storageUrl);
    
    const fileResponse = await fetch(storageUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    if (!fileResponse.ok) {
      console.error("Failed to fetch file:", fileResponse.status, fileResponse.statusText)
      return new Response(
        JSON.stringify({ 
          error: "Failed to download file from storage", 
          status: fileResponse.status,
          statusText: fileResponse.statusText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    console.log('File downloaded successfully, size:', fileResponse.headers.get('content-length'));
    
    const fileBuffer = await fileResponse.arrayBuffer()
    console.log('File buffer size:', fileBuffer.byteLength);
    
    // Convert to base64 using Deno's standard library
    const uint8Array = new Uint8Array(fileBuffer);
    const base64File = encode(uint8Array);
    
    console.log('File converted to base64, length:', base64File.length);

    // Prepare the OpenAI API request
    const openaiRequest = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting key business information from PDF documents and images. You will analyze a PDF document and extract specific information.

Extract the following information from the document:
- company_name: The official name of the company
- industry: The industry or sector the company operates in  
- team_members: Names and roles of key team members (format as a single string)

If the document contains multiple pages or slides, analyze all visible content.

Return only valid JSON in this exact format:
{
  "company_name": "extracted company name or empty string",
  "industry": "extracted industry or empty string", 
  "team_members": "extracted team members or empty string"
}

If any information is not found, use an empty string for that field.`
        },
        {
          role: "user",
          content: `Please analyze this PDF document and extract the company name, industry, and key team members. Here is the base64-encoded PDF content: ${base64File.substring(0, 50000)}...`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1024,
    }

    console.log('Calling OpenAI API with request size:', JSON.stringify(openaiRequest).length);

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
      console.error("OpenAI API headers:", Object.fromEntries(openaiResponse.headers.entries()))
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze PDF document", 
          details: errorData,
          status: openaiResponse.status 
        }),
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
    console.log("Raw OpenAI response:", aiExtractedContent)
    
    try {
      // Parse the JSON response from OpenAI
      let extractedInfo: ExtractedInfo
      
      // Try to parse as JSON, if it fails, try to extract JSON from the response
      try {
        extractedInfo = JSON.parse(aiExtractedContent)
      } catch (parseError) {
        // Try to find JSON in the response text
        const jsonMatch = aiExtractedContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          extractedInfo = JSON.parse(jsonMatch[0])
        } else {
          throw parseError
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: extractedInfo
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", aiExtractedContent)
      console.error("Parse error details:", parseError)
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse extracted data",
          raw_response: aiExtractedContent,
          parse_error: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

  } catch (error) {
    console.error("Edge function error:", error)
    console.error("Error stack:", error.stack)
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})