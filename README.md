# perf-mcp

Fact-check and fix AI outputs. Catches hallucinations, repairs broken JSON, corrects errors — before they reach users.

Works with Claude Code, Cursor, Windsurf, Cline, and any MCP-compatible client.

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "perf": {
      "command": "npx",
      "args": ["-y", "perf-mcp"],
      "env": {
        "PERF_API_KEY": "pk_live_xxx"
      }
    }
  }
}
```

Get your API key at [dashboard.withperf.pro](https://dashboard.withperf.pro) — 200 free verifications, no credit card.

## Tools

### `perf_verify`

Detect and repair hallucinations in LLM-generated text. Uses multi-channel verification (web search, NLI models, cross-reference) — not just another LLM check.

```
perf_verify({ content: "The Eiffel Tower was built in 1887." })
→ Corrected: "built in 1887" → "inaugurated in 1889" (89% confidence)
```

### `perf_validate`

Validate LLM-generated JSON against a schema and auto-repair violations. Fixes malformed enums, wrong types, missing fields, hallucinated properties.

```
perf_validate({
  content: '{"name": "John", "age": "twenty"}',
  target_schema: { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } }
})
→ Rejected: /age must be number
```

### `perf_correct`

General-purpose output correction. Classifies the error type and applies the right fix — hallucination, schema violation, semantic inconsistency, or instruction drift.

```
perf_correct({ content: "The Great Wall was built in 1950.", correction_budget: "fast" })
→ Corrected: temporal_error + factual_error detected (87% confidence)
```

### `perf_chat`

Route LLM requests to the optimal model automatically. Selects between GPT-4o, Claude, Gemini, and 20+ models based on task complexity. OpenAI-compatible format.

## Setup by Client

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "perf": {
      "command": "npx",
      "args": ["-y", "perf-mcp"],
      "env": {
        "PERF_API_KEY": "pk_live_xxx"
      }
    }
  }
}
```

### Cursor

Settings → MCP → Add Server:

```json
{
  "mcpServers": {
    "perf": {
      "command": "npx",
      "args": ["-y", "perf-mcp"],
      "env": {
        "PERF_API_KEY": "pk_live_xxx"
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "perf": {
      "command": "npx",
      "args": ["-y", "perf-mcp"],
      "env": {
        "PERF_API_KEY": "pk_live_xxx"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PERF_API_KEY` | Yes | Your Perf API key (`pk_live_xxx`) |
| `PERF_BASE_URL` | No | Override API URL (for testing) |

## Pricing

| Plan | Credits | Price |
|------|---------|-------|
| Free | 200 verifications | $0 (never expires) |
| Pro | 1,000/mo | $19/mo |
| Pay-as-you-go | Unlimited | $0.02/verification |

1 tool call = 1 credit. Get started at [dashboard.withperf.pro](https://dashboard.withperf.pro).

## License

MIT
