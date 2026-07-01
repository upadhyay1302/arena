export function modelLabel(model: string) {
  const labels: Record<string, string> = {
    "llama-3.3-70b-versatile":              "Llama 3.3 70B",
    "llama-3.1-8b-instant":                 "Llama 3.1 8B",
    "llama-3.1-70b-versatile":              "Llama 3.1 70B",
    "qwen/qwen3-32b":                       "Qwen 3 32B",
    "meta-llama/llama-4-scout-17b-16e-instruct": "Llama 4 Scout",
    "openai/gpt-oss-120b":                  "GPT OSS 120B",
    "openai/gpt-oss-20b":                   "GPT OSS 20B",
    "gpt-4o":                               "GPT-4o",
    "gpt-4o-mini":                          "GPT-4o Mini",
    "claude-sonnet-4-5":                    "Claude Sonnet 4.5",
    "claude-opus-4-5":                      "Claude Opus 4.5",
    "gemini-pro":                           "Gemini Pro",
    "gemini-1.5-pro":                       "Gemini 1.5 Pro",
    "mixtral-8x7b-32768":                   "Mixtral 8x7B",
  }
  return labels[model] ?? model
}

export function modelColor(model: string) {
  if (model.includes("llama") || model.includes("meta-llama")) return "text-violet-400"
  if (model.includes("qwen"))    return "text-sky-400"
  if (model.includes("gpt") || model.includes("openai")) return "text-emerald-400"
  if (model.includes("claude"))  return "text-orange-400"
  if (model.includes("gemini"))  return "text-blue-400"
  if (model.includes("mixtral")) return "text-rose-400"
  return "text-neutral-400"
}

export function modelDot(model: string) {
  if (model.includes("llama") || model.includes("meta-llama")) return "bg-violet-400"
  if (model.includes("qwen"))    return "bg-sky-400"
  if (model.includes("gpt") || model.includes("openai")) return "bg-emerald-400"
  if (model.includes("claude"))  return "bg-orange-400"
  if (model.includes("gemini"))  return "bg-blue-400"
  if (model.includes("mixtral")) return "bg-rose-400"
  return "bg-neutral-400"
}
