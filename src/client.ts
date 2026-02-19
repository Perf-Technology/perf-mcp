/**
 * Perf API client for MCP server.
 * Makes HTTP calls to the Perf API and transforms responses.
 */

const DEFAULT_BASE_URL = "https://api.withperf.pro";

export interface PerfClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PerfChatRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: string };
}

export interface PerfVerifyRequest {
  text: string;
  mode?: "fast" | "standard" | "thorough";
}

export interface PerfValidateRequest {
  content: string;
  target_schema: Record<string, unknown>;
  repair_mode?: "strict" | "best_effort";
}

export interface PerfCorrectRequest {
  content: string;
  original_prompt?: string;
  target_schema?: Record<string, unknown>;
  correction_budget?: "fast" | "thorough";
}

export interface CorrectionChange {
  span: [number, number];
  original: string;
  replacement: string;
  error_type: string;
  confidence: number;
}

export interface CorrectionResponse {
  corrected_text: string;
  changes: CorrectionChange[];
  overall_confidence: number;
  action_taken: "corrected" | "rejected" | "passed";
  validation_errors?: string[];
  error_types_detected?: string[];
}

export class PerfClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: PerfClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  async chat(request: PerfChatRequest): Promise<string> {
    const response = await this.request("POST", "/v1/chat", request);
    // Return the full response as formatted text for the agent
    const choice = response.choices?.[0];
    if (!choice) {
      return JSON.stringify(response, null, 2);
    }
    const content = choice.message?.content || choice.delta?.content || "";
    const model = response.model || "unknown";
    const usage = response.usage;

    let result = content;
    if (usage) {
      result += `\n\n---\nModel: ${model} | Tokens: ${usage.prompt_tokens}+${usage.completion_tokens}=${usage.total_tokens}`;
    }
    return result;
  }

  async verify(request: PerfVerifyRequest): Promise<CorrectionResponse> {
    const response = await this.request("POST", "/v1/verify", request);

    // Transform CER response to standard correction format
    const epistemic = response.perf?.epistemic;
    if (!epistemic) {
      return {
        corrected_text: request.text,
        changes: [],
        overall_confidence: 1.0,
        action_taken: "passed",
      };
    }

    const changes: CorrectionChange[] = [];
    for (const claim of epistemic.claims || []) {
      if (claim.status === "CORRECTED" && claim.corrected_text) {
        changes.push({
          span: [0, 0],
          original: claim.claim_text,
          replacement: claim.corrected_text,
          error_type: claim.claim_type || "factual_error",
          confidence: claim.confidence,
        });
      } else if (claim.status === "RETRACTED") {
        changes.push({
          span: [0, 0],
          original: claim.claim_text,
          replacement: "[RETRACTED — unsupported claim]",
          error_type: "fabrication",
          confidence: claim.confidence,
        });
      }
    }

    let actionTaken: "corrected" | "rejected" | "passed";
    if (changes.length > 0) {
      actionTaken = "corrected";
    } else if (epistemic.status === "uncertain") {
      actionTaken = "passed"; // Uncertain but no corrections to make
    } else {
      actionTaken = "passed";
    }

    return {
      corrected_text: request.text, // CER doesn't return corrected full text via /v1/verify
      changes,
      overall_confidence: epistemic.summary?.composite_confidence ?? 1.0,
      action_taken: actionTaken,
    };
  }

  async validate(request: PerfValidateRequest): Promise<CorrectionResponse> {
    const response = await this.request("POST", "/v1/validate", request);
    return {
      corrected_text: response.corrected_text,
      changes: response.changes || [],
      overall_confidence: response.overall_confidence,
      action_taken: response.action_taken,
      validation_errors: response.validation_errors,
    };
  }

  async correct(request: PerfCorrectRequest): Promise<CorrectionResponse> {
    const response = await this.request("POST", "/v1/correct", request);
    return {
      corrected_text: response.corrected_text,
      changes: response.changes || [],
      overall_confidence: response.overall_confidence,
      action_taken: response.action_taken,
      error_types_detected: response.error_types_detected,
    };
  }

  private async request(method: string, path: string, body: unknown): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error || parsed.message || errorBody;
      } catch {
        errorMessage = errorBody;
      }

      if (res.status === 429) {
        throw new Error(`Rate limited. ${errorMessage}`);
      }
      if (res.status === 401) {
        throw new Error(`Invalid API key. Check your PERF_API_KEY.`);
      }
      throw new Error(`Perf API error (${res.status}): ${errorMessage}`);
    }

    return res.json();
  }
}
