
import { mockApiHandler } from '../utils/mockApiHandler';

interface TenderRequest {
  clientName: string;
  siteAddress: string;
  guardingHoursPerWeek: string;
  keyRisks: string;
  mobilisationDate: string;
  siteSpecifics: string;
}

export const generateTender = mockApiHandler<TenderRequest, { downloadLink: string }>({
  method: 'POST',
  async handler(data) {
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
    
    // In a real implementation, this would:
    // 1. Call GPT-4 API with the prompt
    // 2. Use docx-templater to create actual DOCX file
    // 3. Save to /tenders/ directory
    // 4. Return actual download link
    
    const downloadLink = `/tenders/${filename}`;
    
    console.log('Tender generation completed successfully');
    
    return {
      downloadLink,
    };
  },
});

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
