import { PerfClient, CorrectionResponse } from "../client.js";
import type { z } from "zod";
import type { verifySchema } from "../tools.js";

export async function handleVerify(
  client: PerfClient,
  args: z.infer<typeof verifySchema>
): Promise<string> {
  const mode = args.sensitivity === "strict" ? "thorough" : "standard";

  const result: CorrectionResponse = await client.verify({
    text: args.content,
    mode,
  });

  return formatCorrectionResponse(result);
}

function formatCorrectionResponse(result: CorrectionResponse): string {
  const lines: string[] = [];

  lines.push(`Action: ${result.action_taken}`);
  lines.push(`Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);

  if (result.changes.length > 0) {
    lines.push(`\nChanges (${result.changes.length}):`);
    for (const change of result.changes) {
      lines.push(`  - [${change.error_type}] "${change.original}" → "${change.replacement}" (${(change.confidence * 100).toFixed(0)}% confident)`);
    }
  }

  if (result.action_taken === "corrected") {
    lines.push(`\nCorrected text:\n${result.corrected_text}`);
  }

  return lines.join("\n");
}
