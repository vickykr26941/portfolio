export interface Env {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  GITHUB_TOKEN?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}
