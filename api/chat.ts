import type { ChatRequest, ChatResponse } from "../src/data/types.js";
import { buildBusinessContext } from "../server/ai/context.js";
import { getCurrentBusiness } from "../server/business.js";
import { chatCompletion, type ChatMessage } from "../server/ai/groq.js";
import { systemPrompt } from "../server/ai/prompt.js";
import { HttpError, readJson, route } from "../server/http.js";

const MAX_MESSAGES = 12; // recent turns sent to the model (token budget)
const MAX_CHARS = 1500; // per message

function validate(body: Partial<ChatRequest>): ChatMessage[] {
  if (!Array.isArray(body.messages) || body.messages.length === 0) throw new HttpError(400, "messages is required.");
  const messages = body.messages.slice(-MAX_MESSAGES).map((m) => {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new HttpError(400, "Each message needs a role (user/assistant) and text content.");
    }
    const content = m.content.trim().slice(0, MAX_CHARS);
    return { role: m.role, content };
  });
  // the model must be answering the owner, not continuing its own turn
  while (messages.length && messages[0].role === "assistant") messages.shift();
  if (messages.at(-1)?.role !== "user" || !messages.at(-1)?.content) throw new HttpError(400, "The last message must be from the user.");
  return messages;
}

/**
 * POST /api/chat { messages: [{ role, content }] } -> { reply }
 * The business snapshot is rebuilt from the database on every call, so the
 * model always sees current numbers. The client never supplies the system prompt.
 */
export const POST = route(async (request): Promise<ChatResponse> => {
  const messages = validate(await readJson<Partial<ChatRequest>>(request));
  const context = await buildBusinessContext(await getCurrentBusiness(request));
  const completion = await chatCompletion([{ role: "system", content: systemPrompt(context) }, ...messages]);
  const reply = completion.text || "Sorry, I didn't catch that. Could you ask again?";
  return { reply };
});
