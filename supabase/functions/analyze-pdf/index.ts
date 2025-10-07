import { createClient } from 'npm:@supabase/supabase-js@2.53.0';
import { OpenAI } from 'npm:openai@4.73.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  file_path: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const { file_path }: RequestBody = await req.json();

    if (!file_path) {
      return new Response(
        JSON.stringify({ error: 'file_path is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating signed URL for:', file_path);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed URL', details: signedUrlError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log('Signed URL generated successfully');

    console.log('Downloading PDF from signed URL...');
    const pdfResponse = await fetch(signedUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    console.log('PDF downloaded, size:', pdfBuffer.byteLength);

    console.log('Uploading file to OpenAI...');
    const file = await openai.files.create({
      file: pdfBlob as any,
      purpose: 'assistants',
    });
    console.log('File uploaded to OpenAI:', file.id);

    console.log('Creating assistant...');
    const assistant = await openai.beta.assistants.create({
      name: 'PDF Analyzer',
      instructions: 'You are an expert at analyzing pitch deck PDFs and extracting key information. Extract the company name, industry, and key team members from the document.',
      model: 'gpt-4-turbo-preview',
      tools: [{ type: 'file_search' }],
    });
    console.log('Assistant created:', assistant.id);

    console.log('Creating vector store...');
    const vectorStore = await openai.beta.vectorStores.create({
      name: 'PDF Analysis',
      file_ids: [file.id],
    });
    console.log('Vector store created:', vectorStore.id);

    await openai.beta.assistants.update(assistant.id, {
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id],
        },
      },
    });

    console.log('Creating thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Please analyze this PDF and extract the following information in JSON format: company_name, industry, and key_team_members (as an array). Return only valid JSON.',
    });

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('Initial run status:', runStatus.status);

    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Run status:', runStatus.status);
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }

    console.log('Retrieving messages...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.content[0].type !== 'text') {
      throw new Error('No text response from assistant');
    }

    const responseText = lastMessage.content[0].text.value;
    console.log('Assistant response:', responseText);

    let extractedInfo;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0]);
      } else {
        extractedInfo = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      extractedInfo = {
        raw_response: responseText,
        parse_error: 'Failed to parse as JSON',
      };
    }

    console.log('Storing extracted data in database...');
    const { data: insertedData, error: insertError } = await supabase
      .from('extracted_data')
      .insert({
        file_path: file_path,
        extracted_info: extractedInfo,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting data:', insertError);
      throw new Error('Failed to store extracted data');
    }

    console.log('Cleaning up OpenAI resources...');
    try {
      await openai.beta.assistants.del(assistant.id);
      await openai.beta.vectorStores.del(vectorStore.id);
      await openai.files.del(file.id);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: insertedData,
        extracted_info: extractedInfo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-pdf function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});