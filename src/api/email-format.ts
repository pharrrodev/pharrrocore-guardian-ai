
interface EmailFormatRequest {
  rawText: string;
  recipientName: string;
  guardName: string;
}

interface EmailFormatResponse {
  formatted: string;
}

// Fallback template for when OpenAI API is not available
const createFallbackEmail = (rawText: string, recipientName: string, guardName: string): string => {
  // Capitalize first letter and add basic punctuation
  const cleanedText = rawText.charAt(0).toUpperCase() + rawText.slice(1);
  const finalText = cleanedText.endsWith('.') ? cleanedText : cleanedText + '.';
  
  return `Dear ${recipientName},

I hope this email finds you well.

${finalText}

Please let me know if you need any additional information or if there are any actions you would like me to take regarding this matter.

Best regards,
${guardName}
Security Team`;
};

export const emailFormat = async (request: EmailFormatRequest): Promise<EmailFormatResponse> => {
  const { rawText, recipientName, guardName } = request;

  // Check if OpenAI API key is available
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.warn('OpenAI API key not found, using fallback template');
    return {
      formatted: createFallbackEmail(rawText, recipientName, guardName)
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional email formatter for security guards. Convert shorthand security messages into professional emails. Follow these guidelines:
            
            1. Add a proper greeting using the recipient's name
            2. Rewrite the message in professional language while keeping all important details
            3. Maintain the factual content but improve grammar and clarity
            4. Add a professional closing
            5. Sign with the guard's name and "Security Team"
            6. Keep it concise and to the point
            7. Use appropriate security/facility management terminology`
          },
          {
            role: 'user',
            content: `Please rewrite this security message into a professional email:

Raw message: "${rawText}"
Recipient: ${recipientName}
Guard name: ${guardName}

Format this as a complete professional email with greeting, body, and signature.`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const formattedEmail = data.choices[0]?.message?.content?.trim();

    if (!formattedEmail) {
      throw new Error('No formatted email received from OpenAI');
    }

    return { formatted: formattedEmail };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    console.log('Falling back to template');
    
    return {
      formatted: createFallbackEmail(rawText, recipientName, guardName)
    };
  }
};

// Mock API handler for development
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const result = await emailFormat(body);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email format error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to format email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
