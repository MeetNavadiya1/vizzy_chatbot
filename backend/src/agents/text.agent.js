import { Agent } from "@openai/agents";
import { textPrompt } from "../prompts/text.prompt.js";
import { ASSISTANT_RESPONSE_SCHEMA } from "../types/ai.types.js";

export const textAgent = new Agent({
  name: "Text Agent",
  model: "gpt-4o-mini",
  instructions: (runContext) => {
    const normalizedUseCase = runContext?.context?.useCase || "home";

    return `${textPrompt}

      Current use case: ${normalizedUseCase}

      Return a structured response with:
      - type: "text"
      - content: the final user-facing text response
      - mediaUrl: null`;
  },
  handoffDescription:
    "Handles writing, explanations, summaries, and all text-only requests.",
  outputType: ASSISTANT_RESPONSE_SCHEMA,
});
