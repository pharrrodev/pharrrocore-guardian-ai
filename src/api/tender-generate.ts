
// This file is now handled by the mockApiHandler.ts
// The tender generation logic has been moved to utils/mockApiHandler.ts
// to integrate with the existing mock fetch system

export const generateTender = () => {
  throw new Error('This function should not be called directly. Use fetch("/api/tender-generate", { method: "POST", ... }) instead.');
};
