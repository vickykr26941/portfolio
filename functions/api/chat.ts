import type { Env, ChatRequestBody } from "../_lib/types";
import { buildMessages, completionParams, defaultModel, makeGroq } from "../_lib/agent";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return json(400, { detail: "Invalid JSON body" });
  }

  if (!body.message?.trim()) {
    return json(400, { detail: "Message cannot be empty" });
  }

  try {
    const groq = makeGroq(env);
    const messages = await buildMessages(env, body.message, body.history ?? []);
    const completion = await groq.chat.completions.create({
      model: defaultModel(env),
      messages,
      ...completionParams,
      stream: false,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    return json(200, { reply: reply || "I couldn't generate a response. Please try again." });
  } catch (e: any) {
    return json(500, { detail: `Agent error: ${e.message ?? e}` });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
