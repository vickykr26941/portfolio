import type { Env, ChatRequestBody, ChatMode } from "../_lib/types";
import { buildMessages, completionParamsForMode, defaultModel, makeGroq } from "../_lib/agent";

const VALID_MODES: ChatMode[] = ["chat", "voice", "resume-match"];

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (!body.message?.trim()) {
    return jsonError(400, "Message cannot be empty");
  }

  const mode: ChatMode = VALID_MODES.includes(body.mode as ChatMode)
    ? (body.mode as ChatMode)
    : "chat";

  let groq;
  let messages;
  try {
    groq = makeGroq(env);
    messages = await buildMessages(env, body.message, body.history ?? [], mode);
  } catch (e: any) {
    return jsonError(500, e.message ?? "Agent initialization failed");
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model: defaultModel(env),
          messages,
          ...completionParamsForMode(mode),
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (e: any) {
        controller.enqueue(encoder.encode(`\n\n⚠️ Agent error: ${e.message ?? e}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
};

function jsonError(status: number, detail: string): Response {
  return new Response(JSON.stringify({ detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
