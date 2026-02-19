import { PerfClient, CorrectionResponse } from "../client.js";
import type { z } from "zod";
import type { validateSchema } from "../tools.js";

export async function handleValidate(
  client: PerfClient,
  args: z.infer<typeof validateSchema>
): Promise<string> {
  const result: CorrectionResponse = await client.validate({
    content: args.content,
    target_schema: args.target_schema,
    repair_mode: args.repair_mode,
  });

  return formatValidationResponse(result);
}

function formatValidationResponse(result: CorrectionResponse): string {
  const lines: string[] = [];

  lines.push(`Action: ${result.action_taken}`);
  lines.push(`Confidence: ${(result.overall_confidence * 100).toFixed(1)}%`);

  if (result.changes.length > 0) {
    lines.push(`\nRepairs (${result.changes.length}):`);
    for (const change of result.changes) {
      lines.push(`  - [${change.error_type}] ${change.original} → ${change.replacement}`);
    }
  }

  if (result.validation_errors && result.validation_errors.length > 0) {
    lines.push(`\nRemaining errors:`);
    for (const err of result.validation_errors) {
      lines.push(`  - ${err}`);
    }
  }

  if (result.action_taken !== "passed") {
    lines.push(`\nOutput:\n${result.corrected_text}`);
  }

  return lines.join("\n");
}
