const API_BASE_URL = "http://localhost:5000/api";

export const api = {
  /**
   * Send a chat message query.
   * @param {object} params
   * @param {string} [params.conversationId] - Optional existing conversation ID
   * @param {string} params.content - Raw user message content
   * @param {string} params.useCase - Mode ('home' or 'business')
   * @param {string} [params.mediaUrl] - Optional uploaded user attachment URL
   */
  sendChat: async ({ conversationId, content, useCase, mediaUrl }) => {
    const payload = {
      conversationId,
      content,
      useCase: useCase?.toLowerCase()
    };

    if (mediaUrl) {
      payload.mediaUrl = mediaUrl;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send message');
    }

    const result = await response.json();
    return result.data; // contains conversationId, conversationTitle, userMessage, assistantMessage
  },

  /**
   * Upload an image to the local backend storage.
   * @param {File} file - Browser File object
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload image');
    }

    const result = await response.json();
    return result.data; // contains url, filename, size
  },

  /**
   * Fetch all conversation sessions.
   */
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/conversations`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch conversations');
    }

    const result = await response.json();
    return result.data; // list of conversation summaries
  },

  /**
   * Fetch details and chronological messages list of a single conversation session.
   * @param {string} id - Conversation ObjectId
   */
  getConversation: async (id) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch conversation details');
    }

    const result = await response.json();
    return result.data; // conversation detail with messages list
  },

  /**
   * Delete a single conversation session by ID.
   * @param {string} id - Conversation ObjectId
   */
  deleteConversation: async (id) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete conversation');
    }

    const result = await response.json();
    return result.data;
  }
};
