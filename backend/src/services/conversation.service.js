import {
  getConversation,
  getOrCreateConversation,
  getRecentMessages,
  listConversations,
  deleteConversation,
} from "../repositories/conversation.repository.js";

export async function getConversationHistory(conversationId) {
  if (!conversationId) {
    return [];
  }

  return getRecentMessages(conversationId, 15);
}

export async function getConversationDetails(conversationId) {
  const conversation = getConversation(conversationId);
  if (!conversation) {
    return null;
  }

  return {
    _id: conversation.id,
    title: conversation.title,
    mode: conversation.mode,
    messages: conversation.messages.slice(-15),
  };
}

export async function listConversationSummaries() {
  return listConversations();
}

export async function removeConversation(conversationId) {
  return deleteConversation(conversationId);
}

export async function persistConversation({
  conversationId,
  userMessage,
  assistantMessage,
  useCase,
}) {
  const conversation = getOrCreateConversation(
    conversationId,
    useCase,
    userMessage,
    assistantMessage,
  );
  return {
    id: conversation.id,
    title: conversation.title,
    mode: conversation.mode,
    messages: conversation.messages.slice(-15),
  };
}
