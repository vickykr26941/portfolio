export interface Env {
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  GITHUB_TOKEN?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ChatMode = "chat" | "voice" | "resume-match";

export interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  mode?: ChatMode;
}
