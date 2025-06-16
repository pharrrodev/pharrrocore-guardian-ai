
// Mock API handler to simulate server responses
// This intercepts fetch requests and provides local responses

import { addTrainingRecord } from '@/api/training-add';

// Store original fetch
const originalFetch = window.fetch;

interface TenderRequest {
  clientName: string;
  siteAddress: string;
  guardingHoursPerWeek: string;
  keyRisks: string;
  mobilisationDate: string;
  siteSpecifics: string;
}

// Mock fetch for our API endpoints
window.fetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Handle training API endpoints
  if (urlString === '/api/training-add' && options?.method === 'POST') {
    try {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const result = await addTrainingRecord(body);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: 'error', message: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Handle tender generation API endpoint
  if (urlString === '/api/tender-generate' && options?.method === 'POST') {
    try {
      const data: TenderRequest = options.body ? JSON.parse(options.body as string) : {};
      
      console.log('Generating tender for:', data.clientName);
      
      // Simulate GPT-4 content generation
      const gptPrompt = `Generate a professional security tender document using the following information:
      
Client: ${data.clientName}
Site Address: ${data.siteAddress}
Guarding Hours Per Week: ${data.guardingHoursPerWeek}
Key Risks: ${data.keyRisks}
Mobilisation Date: ${data.mobilisationDate}
Site Specifics: ${data.siteSpecifics}

Please merge this with our company boilerplate and create a comprehensive tender document.
Temperature: 0.2 for factual tone.`;

      console.log('GPT Prompt:', gptPrompt);
      
      // Simulate document generation process
      const generatedContent = generateTenderContent(data);
      
      // Create filename with current date
      const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `tender-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${currentDate}.docx`;
      
      // Simulate saving to /tenders/ directory
      console.log(`Saving tender document: /tenders/${filename}`);
      console.log('Generated content preview:', generatedContent.substring(0, 200) + '...');
      
      const downloadLink = `/tenders/${filename}`;
      
      console.log('Tender generation completed successfully');
      
      return new Response(JSON.stringify({ downloadLink }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: 'error', message: 'Failed to generate tender' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Fall back to original fetch for other requests
  return originalFetch(url, options);
};

function generateTenderContent(data: TenderRequest): string {
  return `
# Security Services Tender Proposal

## Company Background
[Company boilerplate content would be inserted here from /data/bidBoiler.md]

## Client Requirements
**Client:** ${data.clientName}
**Site Address:** ${data.siteAddress}
**Guarding Hours Required:** ${data.guardingHoursPerWeek} hours per week
**Proposed Mobilisation Date:** ${data.mobilisationDate || 'To be confirmed'}

## Risk Assessment
${data.keyRisks || 'Standard security risks assessment to be conducted'}

## Site-Specific Considerations
${data.siteSpecifics || 'Standard security protocols apply'}

## Service Delivery
[Detailed service delivery plan would be generated here]

## Quality Assurance
[Quality assurance procedures from boilerplate]

## Health & Safety
[Health & Safety protocols from boilerplate]

## Pricing
[Pricing structure to be included]

## Conclusion
[Professional closing statement]
  `.trim();
}

export { originalFetch };
