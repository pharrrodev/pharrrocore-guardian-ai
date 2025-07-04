// supabase/functions/structure-sop-text/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2' // Only if needed for other ops
import { corsHeaders } from '../_shared/cors.ts'
import { kebabCase } from 'https://deno.land/x/lodash@4.17.15-es/kebabCase.js';


// Load environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL') // Not strictly needed if only calling OpenAI
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Not strictly needed

interface GenerateRequestBody {
  rawText: string;
  parentTopicLabel: string; // Used as context or to name the root topic generated
  parentTopicId?: string | null; // ID of an existing parent if these are sub-topics
}

interface TopicOutput {
  id: string;
  label: string;
  response: string;
  sort_order?: number;
  subTopics?: TopicOutput[];
  // parent_id will be handled by save-knowledge-base-topics function based on context
}

// Helper to ensure generated IDs are unique within this generation batch
function ensureUniqueIds(topics: TopicOutput[], existingIds: Set<string>, parentKebabBase: string): TopicOutput[] {
  return topics.map((topic, index) => {
    const newId = kebabCase(topic.label || `topic-${index}`);
    if (!topic.label) console.warn("Topic found with no label, generating generic ID.");

    // Ensure uniqueness within the current generation context
    let counter = 1;
    let tempId = newId;
    while (existingIds.has(tempId)) {
      tempId = `${newId}-${counter}`;
      counter++;
    }
    existingIds.add(tempId);

    const newTopic = { ...topic, id: tempId };
    if (topic.subTopics && topic.subTopics.length > 0) {
      newTopic.subTopics = ensureUniqueIds(topic.subTopics, existingIds, tempId);
    }
    return newTopic;
  });
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured.');
    }
    // const adminSupabase: SupabaseClient = createClient(supabaseUrl!, supabaseServiceKey!) // If needed

    const { rawText, parentTopicLabel, parentTopicId }: GenerateRequestBody = await req.json();

    if (!rawText || !parentTopicLabel) {
      return new Response(JSON.stringify({ error: 'Missing required fields: rawText and parentTopicLabel.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construct the prompt for OpenAI
    // This prompt needs to be carefully engineered.
    const systemPrompt = `You are an AI expert at analyzing Standard Operating Procedures (SOPs) and structuring them into a hierarchical list of topics and sub-topics. Each topic must have a unique 'id' (in kebab-case, derived from its label), a concise 'label', a detailed 'response' (the core information for that topic), and optionally a 'subTopics' array for further breakdown. The output MUST be a valid JSON array of topic objects. Ensure generated 'id' fields are unique within your response. Do not create empty 'subTopics' arrays; omit the 'subTopics' field if there are no sub-topics.`;

    const userMessages = [];
    userMessages.push(`The primary context or parent topic label for this SOP is: "${parentTopicLabel}".`);
    if (parentTopicId) {
      userMessages.push(`This SOP content should be structured as sub-topics under an existing parent topic which has the ID: "${parentTopicId}". The topics you generate will be children of this parent.`);
    } else {
      userMessages.push(`The topics you generate should form a new topic structure, potentially with "${parentTopicLabel}" as the root topic's label (or a very similar one you derive).`);
    }
    userMessages.push(`\nHere is the raw SOP text to structure:\n\n---\n${rawText}\n---`);
    userMessages.push(`\nPlease generate the JSON output as described. Ensure all text values within the JSON are properly escaped. Focus on creating a logical hierarchy. For each topic, the 'response' should be the detailed procedure or information for that specific 'label'. 'id' should be a kebab-case version of the 'label'.`);

    const fullUserPrompt = userMessages.join('\n');

    const openAIRequestBody = {
      model: "gpt-3.5-turbo-1106", // Or gpt-4-turbo-preview, gpt-4o. Ensure model supports JSON mode if used.
      // response_format: { type: "json_object" }, // Use if model supports it (e.g., gpt-3.5-turbo-1106+)
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullUserPrompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic, structured output
      max_tokens: 3500, // Adjust as needed
    };

    // console.log("OpenAI Request Body:", JSON.stringify(openAIRequestBody, null, 2));

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequestBody),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text(); // Get raw text for more detailed error
      console.error('OpenAI API error response:', errorBody);
      throw new Error(`OpenAI API request failed: ${openaiResponse.status} ${openaiResponse.statusText}. Details: ${errorBody}`);
    }

    const openaiResult = await openaiResponse.json();
    let generatedContent = openaiResult.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error("OpenAI returned an empty response content.");
    }

    // console.log("Raw OpenAI response:", generatedContent);

    // Attempt to parse the response as JSON. LLMs can sometimes return markdown ```json ... ```
    if (generatedContent.startsWith("```json")) {
      generatedContent = generatedContent.substring(7, generatedContent.length - 3).trim();
    } else if (generatedContent.startsWith("```")) {
      generatedContent = generatedContent.substring(3, generatedContent.length - 3).trim();
    }

    let parsedTopics: TopicOutput[];
    try {
      parsedTopics = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.error("Problematic content from AI:", generatedContent);
      throw new Error(`AI response was not valid JSON. Parse error: ${parseError.message}. Consider retrying or check AI prompt/response format.`);
    }

    if (!Array.isArray(parsedTopics)) {
        // If AI returns a single root object instead of an array.
        if (typeof parsedTopics === 'object' && parsedTopics !== null && parsedTopics.id && parsedTopics.label && parsedTopics.response) {
            // Check if it looks like our Topic structure
            console.warn("AI returned a single root topic object, wrapping it in an array.");
            parsedTopics = [parsedTopics as TopicOutput];
        } else {
            console.error("Parsed AI response is not an array of topics, nor a single valid topic object:", parsedTopics);
            throw new Error("AI response did not conform to the expected Topic[] structure or a single Topic object.");
        }
    }

    // Ensure IDs are unique within this batch (AI might make mistakes)
    const uniqueIdsSet = new Set<string>();
    const topicsWithUniqueIds = ensureUniqueIds(parsedTopics, uniqueIdsSet, kebabCase(parentTopicLabel));


    return new Response(
      JSON.stringify({ status: "ok", topics: topicsWithUniqueIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in structure-sop-text function:', error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
