type IntervalType = "second" | "minute" | "hour" | "day" | "month" | "year";

export function timeSince(date: Date): string {
  const seconds = Math.floor((+new Date() - +date) / 1000);
  let intervalType: IntervalType;
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    intervalType = "year";
  } else {
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      intervalType = "month";
    } else {
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        intervalType = "day";
      } else {
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
          intervalType = "hour";
        } else {
          interval = Math.floor(seconds / 60);
          if (interval >= 1) {
            intervalType = "minute";
          } else {
            interval = seconds;
            intervalType = "second";
          }
        }
      }
    }
  }

  if (interval > 1 || interval === 0) {
    intervalType += "s";
  }

  return interval + " " + intervalType + " ago";
}

/**
 * Safely convert rem text to string, handling all edge cases
 */
export const safeRemTextToString = async (
  plugin: RNPlugin,
  remText: any
): Promise<string> => {
  // Handle null/undefined
  if (remText == null) {
    return 'Untitled';
  }

  // Handle non-array types
  if (!Array.isArray(remText)) {
    console.warn('rem.text is not an array:', typeof remText, remText);
    return 'Untitled';
  }

  // Handle empty array
  if (remText.length === 0) {
    return 'Untitled';
  }

  // Try to normalize first (this might fix malformed richText)
  try {
    const normalized = await plugin.richText.normalize(remText);

    // Then try to convert to string
    try {
      const text = await plugin.richText.toString(normalized);
      // Handle empty string result
      if (!text || text.trim().length === 0) {
        return 'Untitled';
      }
      return text;
    } catch (toStringError) {
      // If toString fails after normalization, try manual extraction
      console.warn('toString failed after normalization, trying manual extraction');
      const manualText = extractTextManually(normalized);
      return manualText || 'Untitled';
    }
  } catch (normalizeError) {
    // If normalize fails, try toString directly on original
    try {
      const text = await plugin.richText.toString(remText);
      if (!text || text.trim().length === 0) {
        return 'Untitled';
      }
      return text;
    } catch (toStringError) {
      // Last resort: manual extraction
      console.warn('All conversion methods failed, using manual extraction. Original text:', remText);
      const manualText = extractTextManually(remText);
      return manualText || 'Untitled';
    }
  }
};

/**
 * Manually extract text from richText array as a fallback
 */
const extractTextManually = (richText: any): string => {
  if (!Array.isArray(richText)) return '';

  let text = '';
  for (const element of richText) {
    if (typeof element === 'string') {
      text += element;
    } else if (element && typeof element === 'object') {
      // Handle text elements with formatting
      if (element.i === 'm' && element.text) {
        text += element.text;
      }
      // Handle other text-like elements
      else if (element.text) {
        text += element.text;
      }
    }
  }
  return text.trim();
};
