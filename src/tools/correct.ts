import { PerfClient, CorrectionResponse } from "../client.js";
import type { z } from "zod";
import type { correctSchema } from "../tools.js";

export async function handleCorrect(
  client: PerfClient,
  args: z.infer<typeof correctSchema>
): Promise<string> {
  const result: CorrectionResponse = await client.correct({
    content: args.content,
    original_prompt: args.original_prompt,
    target_schema: args.target_schema,
    correction_budget: args.correction_budget,
  });

  return formatCorrectionResponse(result);
}

function formatCorrectionResponse(result: CorrectionResponse): string {
  const lines: string[] = [];

  lines.push(`Action: ${result.action_taken}`);
  lines.push(`Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);

  if (result.error_types_detected && result.error_types_detected.length > 0) {
    lines.push(`Error types: ${result.error_types_detected.join(", ")}`);
  }

  if (result.changes.length > 0) {
    lines.push(`\nCorrections (${result.changes.length}):`);
    for (const change of result.changes) {
      lines.push(`  - [${change.error_type}] "${change.original}" → "${change.replacement}" (${(change.confidence * 100).toFixed(0)}% confident)`);
    }
  }

  if (result.action_taken === "corrected") {
    lines.push(`\nCorrected output:\n${result.corrected_text}`);
  } else if (result.action_taken === "rejected") {
    lines.push(`\nOutput could not be corrected with confidence. Consider regenerating.`);
  }

  return lines.join("\n");
}
