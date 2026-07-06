const conversations = new Map();

function normalizeMessage(message) {
  return {
    role: message.role,
    content: message.content,
    mediaUrl: message.mediaUrl || null,
    mediaUrls: Array.isArray(message.mediaUrls) ? message.mediaUrls : [],
  };
}

export function createConversation({
  conversationId,
  userMessage,
  assistantMessage,
  useCase,
}) {
  const normalizedConversationId = conversationId || `conv-${Date.now()}`;
  const entry = {
    id: normalizedConversationId,
    title: userMessage?.content?.slice(0, 40) || "New Chat",
    mode: useCase || "home",
    messages: [
      normalizeMessage(userMessage),
      normalizeMessage(assistantMessage),
    ].filter(Boolean),
  };

  conversations.set(normalizedConversationId, entry);
  return entry;
}

export function getConversation(conversationId) {
  return conversations.get(conversationId) || null;
}

export function listConversations() {
  return Array.from(conversations.values())
    .map((conversation) => ({
      _id: conversation.id,
      title: conversation.title,
      mode: conversation.mode,
    }))
    .sort((a, b) => b._id.localeCompare(a._id));
}

export function appendMessage(conversationId, message) {
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    return null;
  }

  conversation.messages.push(normalizeMessage(message));
  return conversation;
}

export function getRecentMessages(conversationId, limit = 15) {
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    return [];
  }

  return conversation.messages.slice(-limit);
}

export function getOrCreateConversation(
  conversationId,
  useCase,
  userMessage,
  assistantMessage,
) {
  if (conversationId && conversations.has(conversationId)) {
    appendMessage(conversationId, userMessage);
    appendMessage(conversationId, assistantMessage);
    const updatedConversation = conversations.get(conversationId);
    return updatedConversation;
  }

  return createConversation({
    conversationId,
    userMessage,
    assistantMessage,
    useCase,
  });
}

export function deleteConversation(conversationId) {
  return conversations.delete(conversationId);
}
