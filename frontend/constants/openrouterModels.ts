export type OpenRouterChatModel = {
  id: string;
  label: string;
  hint: string;
  description: string;
};

export const OPENROUTER_CHAT_MODELS: OpenRouterChatModel[] = [
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B",
    hint: "Recommended: best balance of speed and answer quality.",
    description:
      "Recommended for Rozgar Mitra because it is fast, still capable, and supports reasoning, tool use, and structured outputs.",
  },
  {
    id: "openrouter/free",
    label: "Auto Free Router",
    hint: "OpenRouter picks a free model automatically.",
    description:
      "Best when you want OpenRouter to route to a currently available free model for the request.",
  },
  {
    id: "openai/gpt-oss-120b:free",
    label: "GPT-OSS 120B",
    hint: "More reasoning depth, but heavier.",
    description:
      "Strong general-purpose reasoning model when you want a bigger free option and can accept a bit more latency.",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
    hint: "Good for complex planning and long context.",
    description:
      "Useful for deeper reasoning, planning, and long multi-turn conversations.",
  },
  {
    id: "z-ai/glm-4.5-air:free",
    label: "GLM 4.5 Air",
    hint: "Good for quick, agent-style responses.",
    description:
      "A compact free model with thinking and non-thinking modes for interactive chat.",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    hint: "Strong multilingual support.",
    description:
      "Good fit for Hinglish-style replies because it supports multilingual output and solid reasoning.",
  },
  {
    id: "moonshotai/kimi-k2.6:free",
    label: "Kimi K2.6",
    hint: "Useful for long-context workflows.",
    description:
      "Best when you need long-horizon workflows or more complex orchestration-style responses.",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    label: "Nemotron Nano 9B",
    hint: "Lightweight and quick.",
    description:
      "A smaller free model that is useful when you want a lighter option with reasoning support.",
  },
];

export const DEFAULT_OPENROUTER_CHAT_MODEL_ID =
  OPENROUTER_CHAT_MODELS[0].id;
