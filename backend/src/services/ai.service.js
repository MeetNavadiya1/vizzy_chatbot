import { assistant, user } from "@openai/agents";
import { runOrchestratedWorkflow } from "../agents/orchestrator.agent.js";
import { getConversationHistory } from "./conversation.service.js";
import { DEFAULT_MODE } from "../types/ai.types.js";

function buildUserContent({ content, mediaUrl }) {
  const parts = [];

  if (content) {
    parts.push({
      type: "input_text",
      text: content,
    });
  }

  if (mediaUrl) {
    parts.push({
      type: "input_image",
      image: mediaUrl,
      detail: "auto",
    });
  }

  return parts.length === 1 && parts[0].type === "input_text" ? content : parts;
}

function buildHistoryInput(history) {
  return history.map((message) => {
    if (message.role === "assistant") {
      return assistant(message.content);
    }

    return user(
      buildUserContent({
        content: message.content,
        mediaUrl: message.mediaUrl,
      }),
    );
  });
}

export async function runAiWorkflow({
  conversationId,
  userPrompt,
  useCase,
  mediaUrl,
  baseUrl,
}) {
  const normalizedUseCase = (useCase || DEFAULT_MODE).toLowerCase();
  const history = await getConversationHistory(conversationId);
  const userMessage = {
    role: "user",
    content: userPrompt,
    mediaUrl: mediaUrl || null,
  };
  const result = await runOrchestratedWorkflow(
    [
      ...buildHistoryInput(history),
      user(
        buildUserContent({
          content: userPrompt,
          mediaUrl,
        }),
      ),
    ],
    {
      userPrompt,
      useCase: normalizedUseCase,
      mediaUrl: mediaUrl || null,
      baseUrl,
      conversationId: conversationId || null,
    },
  );
  const assistantOutput = result.finalOutput;

  if (!assistantOutput) {
    throw new Error("The agent workflow completed without a final output.");
  }

  const assistantMessage = {
    role: "assistant",
    content: assistantOutput.content,
    mediaUrl: assistantOutput.mediaUrl,
    mediaUrls: assistantOutput.mediaUrls || [],
  };

  return {
    type: assistantOutput.type,
    conversationId,
    userMessage,
    assistantMessage,
    result,
  };
}
