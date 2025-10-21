
export const parseApiError = (error: any): string => {
  const message = error.message || 'An unknown error occurred.';

  // Check for specific error messages from the Gemini API or network stack
  if (message.includes('API key not valid')) {
    return "Your API key seems to be invalid. Please ensure it's configured correctly.";
  }
  // Gemini API often returns 429 for rate limiting and quota issues.
  if (message.includes('rate limit') || message.includes('429')) {
    return "You've made too many requests in a short period or exceeded your quota. Please wait a moment and try again.";
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return "The AI service is currently experiencing technical difficulties. Please try again later.";
  }
  // Gemini API uses 400 for safety blocks. The response usually contains 'SAFETY'.
  if (message.includes('[400') || message.toUpperCase().includes('SAFETY')) {
      return "Your request was blocked due to the content safety policy. Please adjust your prompt and try again.";
  }
  if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('network')) {
      return "A network error occurred. Please check your internet connection and try again.";
  }
  
  // Keep existing user-friendly custom errors
  if (
    message.startsWith('Image editing failed') ||
    message.startsWith('Image generation failed') ||
    message.startsWith('The AI returned an empty response') ||
    message.startsWith('API key not configured') ||
    message.startsWith('Failed to initialize Gemini client')
  ) {
    return message;
  }

  // Fallback for other, less common errors
  console.error("Unhandled API Error:", error);
  return `An unexpected error occurred. If the problem persists, please check the console for details.`;
};
