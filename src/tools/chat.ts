import { PerfClient } from "../client.js";
import type { z } from "zod";
import type { chatSchema } from "../tools.js";

export async function handleChat(
  client: PerfClient,
  args: z.infer<typeof chatSchema>
): Promise<string> {
  const result = await client.chat({
    messages: args.messages,
    model: args.model,
    max_tokens: args.max_tokens,
    temperature: args.temperature,
    response_format: args.response_format,
  });
  return result;
}
