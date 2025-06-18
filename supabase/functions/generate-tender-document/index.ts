import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
// Note: OpenAI library for Deno might be different or you might use fetch directly.
// Using fetch directly for this example.
// import OpenAI from 'https://deno.land/x/openai@v4.24.1/mod.ts'; // Check for latest/suitable version

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

const BOILERPLATE_TEMPLATE_ID = 'tender_boilerplate_v1'

interface TenderFormData {
  clientName: string;
  siteAddress: string;
  guardingHoursPerWeek: string; // number as string
  keyRisks: string; // comma-separated or newline
  mobilisationDate: string; // YYYY-MM-DD
  siteSpecifics: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      throw new Error('Supabase or OpenAI API keys are not configured.');
    }

    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    const formData: TenderFormData = await req.json();

    if (!formData.clientName || !formData.siteAddress || !formData.guardingHoursPerWeek || !formData.keyRisks || !formData.mobilisationDate || !formData.siteSpecifics) {
        return new Response(JSON.stringify({ error: 'Missing required form fields.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 1. Fetch boilerplate content
    const { data: templateData, error: templateError } = await adminSupabase
      .from('system_templates')
      .select('content')
      .eq('template_id', BOILERPLATE_TEMPLATE_ID)
      .single();

    if (templateError || !templateData) {
      console.error('Error fetching boilerplate template:', templateError);
      throw new Error('Could not load tender boilerplate from database.');
    }
    const boilerplateMarkdown = templateData.content;

    // 2. Construct prompt for OpenAI
    const userPrompt = `
Client Name: ${formData.clientName}
Site Address: ${formData.siteAddress}
Guarding Hours Per Week: ${formData.guardingHoursPerWeek}
Key Risks Identified: ${formData.keyRisks}
Proposed Mobilisation Date: ${formData.mobilisationDate}
Site Specific Requirements/Notes: ${formData.siteSpecifics}
`;

    const systemPrompt = `You are a professional bid writer for a UK-based security services company.
Your task is to draft a section of a tender document.
You will be provided with a boilerplate markdown text containing standard company information (Company Background, Quality Assurance, Health & Safety, Professional Standards).
You will also be provided with specific details for a potential new client and site.

Instructions:
1.  Carefully review the provided boilerplate and the client-specific details.
2.  Integrate the client-specific details naturally and professionally into relevant sections of the boilerplate.
    For example, client name and site address might be used in an introduction or a site-specific plan section (you might need to create a small placeholder for such a section if not obvious in the boilerplate).
    Key risks and site specifics should inform how you tailor service descriptions or commitments.
    Guarding hours and mobilisation date are key operational details.
3.  The output should be a single, coherent Markdown document.
4.  Maintain a formal, confident, and persuasive tone.
5.  Ensure the final document flows well and is professionally presented.
6.  Do not create sections that are not generally found in a tender (e.g., do not add a "Costing" or "Pricing" section unless the boilerplate explicitly has placeholders for it). Focus on service description, company capability, and addressing client needs based on the input.
7.  If the boilerplate already contains placeholders like "[Client Name]" or "[Site Address]", replace them. Otherwise, find suitable places to weave in the information or add brief, relevant sub-sections.
8.  The sections from the boilerplate (Company Background, Quality Assurance, etc.) must be included in your response, augmented with the client's details where appropriate. You can add a brief "Introduction" or "Site Specific Plan" section if it helps integrate the client details.
`;

    const openAIRequestBody = {
      model: "gpt-3.5-turbo", // Or "gpt-4-turbo-preview" or "gpt-4o" if budget/availability allows
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Boilerplate Markdown:\n\n${boilerplateMarkdown}\n\nClient-Specific Details:\n\n${userPrompt}` }
      ],
      temperature: 0.5, // Adjust for creativity vs. factualness
      max_tokens: 3000, // Adjust based on expected length
    };

    // 3. Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequestBody),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.json().catch(() => ({ message: "Unknown OpenAI API error" }));
      console.error('OpenAI API error:', errorBody);
      throw new Error(`OpenAI API request failed: ${errorBody.error?.message || openaiResponse.statusText}`);
    }

    const openaiResult = await openaiResponse.json();
    const generatedText = openaiResult.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedText) {
      throw new Error("OpenAI returned an empty response.");
    }

    const fileNameSuggestion = `tender_draft_${formData.clientName.toLowerCase().replace(/\s+/g, '_')}.md`;

    return new Response(
      JSON.stringify({ generatedText, fileNameSuggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-tender-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
