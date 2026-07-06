import { assistant, user } from "@openai/agents";
import { runOrchestratedWorkflow } from "../agents/orchestrator.agent.js";
import { getConversationHistory } from "./conversation.service.js";
import { DEFAULT_MODE } from "../types/ai.types.js";

const AI_WORKFLOW_TIMEOUT_MS = 420000;

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

function withTimeout(operation, timeoutMs, timeoutMessage) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export async function runAiWorkflow({
  conversationId,
  userPrompt,
  useCase,
  mediaUrl,
  baseUrl,
}) {
  console.time("AI Workflow");
  console.info("[AI Workflow] Starting", {
    conversationId: conversationId || null,
    useCase,
    hasMediaUrl: Boolean(mediaUrl),
  });

  const normalizedUseCase = (useCase || DEFAULT_MODE).toLowerCase();
  try {
    console.time("[AI Workflow] Load Conversation History");
    const history = await getConversationHistory(conversationId);
    console.timeEnd("[AI Workflow] Load Conversation History");
    console.info("[AI Workflow] Loaded conversation history", {
      conversationId: conversationId || null,
      historyMessages: history.length,
    });

    const userMessage = {
      role: "user",
      content: userPrompt,
      mediaUrl: mediaUrl || null,
    };

    const workflowInput = [
      ...buildHistoryInput(history),
      user(
        buildUserContent({
          content: userPrompt,
          mediaUrl,
        }),
      ),
    ];

    console.time("[AI Workflow] Orchestrator Run");
    const result = await withTimeout(
      runOrchestratedWorkflow(workflowInput, {
        userPrompt,
        useCase: normalizedUseCase,
        mediaUrl: mediaUrl || null,
        baseUrl,
        conversationId: conversationId || null,
      }),
      AI_WORKFLOW_TIMEOUT_MS,
      "AI workflow timeout",
    );
    console.timeEnd("[AI Workflow] Orchestrator Run");

    const assistantOutput = result.finalOutput;

    if (!assistantOutput) {
      throw new Error("The agent workflow completed without a final output.");
    }

    console.info("[AI Workflow] Received final output", {
      type: assistantOutput.type,
      hasMediaUrl: Boolean(assistantOutput.mediaUrl),
      mediaUrlCount: assistantOutput.mediaUrls?.length || 0,
    });

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
  } catch (error) {
    console.error("[AI Workflow] Failed", {
      message: error?.message,
      stack: error?.stack,
      useCase: normalizedUseCase,
      conversationId: conversationId || null,
    });
    throw error;
  } finally {
    console.timeEnd("AI Workflow");
  }
}
