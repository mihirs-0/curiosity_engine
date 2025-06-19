// utils/extractSuggestions.ts

export interface Suggestion {
    suggestion: string;
    day: number;
    tags: string[];
  }
  
  export function extractSuggestions(content: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const jsonRegex = /{[^}]*"suggestion"[^}]*}/g;
  
    const matches = content.match(jsonRegex);
    if (!matches) return [];
  
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match.trim());
  
        // Basic shape validation
        if (
          typeof parsed.suggestion === "string" &&
          typeof parsed.day === "number" &&
          Array.isArray(parsed.tags)
        ) {
          suggestions.push(parsed);
        }
      } catch (e) {
        console.warn("Failed to parse suggestion:", e);
      }
    }
  
    return suggestions;
  }