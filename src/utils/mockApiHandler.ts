
// Mock API handler to simulate server responses
// This intercepts fetch requests and provides local responses

import { addTrainingRecord } from '@/api/training-add';

// Store original fetch
const originalFetch = window.fetch;

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
  
  // Fall back to original fetch for other requests
  return originalFetch(url, options);
};

export { originalFetch };
