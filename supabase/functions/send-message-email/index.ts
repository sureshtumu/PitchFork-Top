import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  companyName: string;
  messageTitle: string;
  messageDetail: string;
}

async function sendEmailViaGmail(
  toEmail: string,
  senderName: string,
  companyName: string,
  messageTitle: string,
  messageDetail: string
): Promise<void> {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
  }

  console.log('Initializing SMTP client...');
  console.log('Gmail user:', gmailUser);

  // Create email content
  const emailBody = `From: ${senderName}
Company: ${companyName}
Reply-To: admin@pitchfork.com

Message:
${messageDetail}

---
This message was sent via Pitch Fork platform.`;

  try {
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 587,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailAppPassword,
        },
      },
    });

    console.log('Connecting to Gmail SMTP...');

    await client.send({
      from: `${senderName} <${gmailUser}>`,
      to: toEmail,
      replyTo: 'admin@pitchfork.com',
      subject: messageTitle,
      content: emailBody,
    });

    console.log('Email sent successfully!');

    await client.close();

  } catch (error) {
    console.error('SMTP Error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    console.log('Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    console.log('Getting user from auth...');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    console.log('User error:', userError);
    console.log('User found:', !!user);
    console.log('User email:', user?.email);

    if (userError) {
      console.error('Auth error details:', JSON.stringify(userError));
      throw new Error(`User authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No user returned from auth.getUser()');
      throw new Error('User not authenticated - no user data');
    }

    // Get user details from users table
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      throw new Error('Failed to fetch user details');
    }

    const senderName = userData?.name || user.email || 'Pitch Fork User';

    // Parse request body
    const { companyName, messageTitle, messageDetail }: EmailRequest = await req.json();

    if (!messageTitle || !messageDetail) {
      throw new Error('Message title and detail are required');
    }

    console.log('Sending email from:', senderName);
    console.log('Company:', companyName);
    console.log('Title:', messageTitle);

    // Send email
    await sendEmailViaGmail(
      'vkotrappa@gmail.com',
      senderName,
      companyName,
      messageTitle,
      messageDetail
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-message-email function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

