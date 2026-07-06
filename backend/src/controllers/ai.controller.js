import { runAiWorkflow } from "../services/ai.service.js";
import { persistConversation } from "../services/conversation.service.js";
import {
  getConversationDetails,
  listConversationSummaries,
  removeConversation,
} from "../services/conversation.service.js";

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body is required.";
  }

  const userPrompt =
    typeof payload.userPrompt === "string" ? payload.userPrompt.trim() : "";
  const contentPrompt =
    typeof payload.content === "string" ? payload.content.trim() : "";
  const promptText = userPrompt || contentPrompt;

  if (!promptText) {
    return "userPrompt is required.";
  }

  if (
    payload.conversationId !== undefined &&
    payload.conversationId !== null &&
    typeof payload.conversationId !== "string"
  ) {
    return "conversationId must be a string when provided.";
  }

  if (
    payload.mediaUrl !== undefined &&
    payload.mediaUrl !== null &&
    typeof payload.mediaUrl !== "string"
  ) {
    return "mediaUrl must be a string when provided.";
  }

  const useCase = (payload.useCase || "").toLowerCase();
  if (!["home", "business"].includes(useCase)) {
    return "useCase must be either home or business.";
  }

  return null;
}

export async function handleChat(req, res) {
  console.time("handleChat");
  console.info("[handleChat] Incoming request", {
    conversationId: req.body?.conversationId || null,
    useCase: req.body?.useCase || null,
    hasMediaUrl: Boolean(req.body?.mediaUrl),
  });

  try {
    const errorMessage = validatePayload(req.body);
    if (errorMessage) {
      console.warn("[handleChat] Validation failed", { errorMessage });
      console.timeEnd("handleChat");
      return res.status(400).json({ success: false, message: errorMessage });
    }

    const { conversationId, userPrompt, content, useCase, mediaUrl } = req.body;
    const promptText =
      typeof userPrompt === "string" && userPrompt.trim()
        ? userPrompt.trim()
        : content.trim();
    const normalizedUseCase = (useCase || "home").toLowerCase();
    console.info("[handleChat] Starting AI workflow", {
      conversationId: conversationId || null,
      useCase: normalizedUseCase,
    });
    const workflowResult = await runAiWorkflow({
      conversationId,
      userPrompt: promptText,
      useCase: normalizedUseCase,
      mediaUrl,
      baseUrl: `${req.protocol}://${req.get("host")}`,
    });
    const savedConversation = await persistConversation({
      conversationId: workflowResult.conversationId,
      userMessage: workflowResult.userMessage,
      assistantMessage: workflowResult.assistantMessage,
      useCase: normalizedUseCase,
    });

    const responseData =
      workflowResult.type === "image"
        ? {
            imageUrl: workflowResult.assistantMessage.mediaUrl,
            imageUrls: workflowResult.assistantMessage.mediaUrls,
          }
        : {
            content: workflowResult.assistantMessage.content,
          };

    return res.status(200).json({
      success: true,
      type: workflowResult.type,
      data: {
        conversationId: savedConversation.id,
        conversationTitle: savedConversation.title,
        userMessage: {
          role: workflowResult.userMessage.role,
          content: workflowResult.userMessage.content,
          mediaUrl: workflowResult.userMessage.mediaUrl,
        },
        assistantMessage: {
          role: workflowResult.assistantMessage.role,
          content: workflowResult.assistantMessage.content,
          mediaUrl: workflowResult.assistantMessage.mediaUrl,
          mediaUrls: workflowResult.assistantMessage.mediaUrls,
        },
        response: responseData,
        },
    });
  } catch (error) {
    console.error("[handleChat] Failed", {
      message: error?.message,
      stack: error?.stack,
    });

    const isImageWorkflowError =
      error?.isImageGenerationError === true ||
      error?.message?.toLowerCase().includes("image generation");

    return res.status(500).json({
      success: false,
      message: isImageWorkflowError
        ? "Image generation failed"
        : error.message || "AI workflow failed.",
      error: error?.message || "Unknown error",
    });
  } finally {
    console.timeEnd("handleChat");
  }
}

export async function handleGetConversations(req, res) {
  try {
    const conversations = await listConversationSummaries();
    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load conversations.",
    });
  }
}

export async function handleGetConversation(req, res) {
  try {
    const conversation = await getConversationDetails(req.params.id);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });
    }

    return res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load conversation.",
    });
  }
}

export async function handleDeleteConversation(req, res) {
  try {
    const deleted = await removeConversation(req.params.id);
    return res.status(200).json({ success: true, data: { deleted } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete conversation.",
    });
  }
}
