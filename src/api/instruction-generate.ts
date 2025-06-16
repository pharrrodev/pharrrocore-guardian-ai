
import { Topic } from "@/data/assignmentTopics";

export interface GenerateInstructionsRequest {
  rawText: string;
  parentLabel: string;
}

export interface GenerateInstructionsResponse {
  status: 'ok' | 'error';
  message?: string;
  topics?: Topic[];
}

export const generateInstructions = async (
  request: GenerateInstructionsRequest
): Promise<GenerateInstructionsResponse> => {
  console.log('Generating instructions for:', request.parentLabel);
  
  try {
    // In a real implementation, this would call GPT-4 API
    // For now, we'll simulate the generation with a mock response
    const mockTopics = await simulateGPTGeneration(request);
    
    return {
      status: 'ok',
      message: 'Instructions generated successfully',
      topics: mockTopics,
    };
  } catch (error) {
    console.error('Error generating instructions:', error);
    return {
      status: 'error',
      message: 'Failed to generate instructions',
    };
  }
};

// Mock GPT-4 generation - replace with actual API call
const simulateGPTGeneration = async (
  request: GenerateInstructionsRequest
): Promise<Topic[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a kebab-case ID from the parent label
  const baseId = request.parentLabel
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Split the raw text into sentences and create subtopics
  const sentences = request.rawText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20); // Only keep substantial sentences
  
  const subTopics: Topic[] = sentences.slice(0, 5).map((sentence, index) => {
    const subLabel = sentence.split(' ').slice(0, 4).join(' ') + '...';
    const subId = `${baseId}-${index + 1}`;
    
    return {
      id: subId,
      label: subLabel,
      response: sentence + '.',
    };
  });
  
  // Create the main topic
  const mainTopic: Topic = {
    id: baseId,
    label: request.parentLabel,
    response: `This section covers ${request.parentLabel.toLowerCase()}. What specific aspect would you like to know about?`,
    subTopics: subTopics,
  };
  
  return [mainTopic];
};

// Future implementation would look like this:
/*
const callGPT4API = async (request: GenerateInstructionsRequest): Promise<Topic[]> => {
  const prompt = `
Convert the following raw SOP text into a structured JSON format for a chatbot knowledge base.

Parent Topic: "${request.parentLabel}"
Raw Text: "${request.rawText}"

Create a Topic object with the following structure:
- id: kebab-case version of the label
- label: human-readable title
- response: brief overview that asks what the user wants to know
- subTopics: array of subtopics, each with id, label, and detailed response

Rules:
- Use kebab-case for all IDs
- Keep responses concise but informative
- Create logical subtopics from the content
- Ensure all content is covered

Return only valid JSON.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at converting unstructured text into structured chatbot knowledge bases. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  const generatedContent = data.choices[0].message.content;
  
  try {
    return JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('Failed to parse GPT response:', generatedContent);
    throw new Error('Invalid JSON response from GPT-4');
  }
};
*/
