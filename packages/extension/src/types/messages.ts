export interface ClipResponse {
  success: boolean;
  error?: string;
  data?: {
    raw_query: string;
    answer_markdown: string;
  };
} 