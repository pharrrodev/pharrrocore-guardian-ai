
/**
 * Copy text to clipboard using the modern Clipboard API
 * Falls back to the older document.execCommand method if needed
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback to the older method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Failed to copy text');
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
};

/**
 * Check if clipboard operations are supported
 */
export const isClipboardSupported = (): boolean => {
  return !!(navigator.clipboard || document.queryCommandSupported?.('copy'));
};
