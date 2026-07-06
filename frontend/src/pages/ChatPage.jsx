import React, { useState, useEffect, useRef } from "react";
import MainLayout from "../layouts/MainLayout";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MessageItem from "../components/MessageItem";
import ChatInput from "../components/ChatInput";
import EmptyState from "../components/EmptyState";
import { api } from "../utils/api";

const normalizeMode = (mode) => {
  const value = (mode || "Home").toString().trim().toLowerCase();
  return value === "business" ? "Business" : "Home";
};

export default function ChatPage() {
  const [currentMode, setCurrentMode] = useState("Home");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Fetch conversations session list on component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setError(null);
        const data = await api.getConversations();
        const formatted = data.map((c) => ({
          id: c._id,
          title: c.title,
          mode: normalizeMode(c.mode),
          messages: [],
        }));

        setChats(formatted);

        // Select the first conversation if present
        if (formatted.length > 0) {
          const firstOfMode =
            formatted.find((c) => normalizeMode(c.mode) === currentMode) ||
            formatted[0];
          setActiveChatId(firstOfMode.id);
        } else {
          // If no conversations exist, initialize a new temp chat
          initializeNewTempChat();
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError(
          "Connection error: Make sure the backend server is running on port 5000.",
        );
      }
    };
    loadConversations();
  }, []);

  // Helper to initialize a new temporary chat
  const initializeNewTempChat = () => {
    const tempId = `temp-${Date.now()}`;
    const newChat = {
      id: tempId,
      title: "New Chat",
      mode: currentMode,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(tempId);
  };

  // 2. Fetch messages for active conversation if they are not already loaded
  useEffect(() => {
    if (!activeChatId || activeChatId.startsWith("temp-")) return;

    const loadMessages = async () => {
      const activeChat = chats.find((c) => c.id === activeChatId);
      if (activeChat && activeChat.messages.length > 0) return; // Already fetched

      try {
        setError(null);
        const details = await api.getConversation(activeChatId);
        if (details && details.messages) {
          const mappedMessages = details.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            mediaUrl: msg.mediaUrl,
            mediaUrls: msg.mediaUrls || [],
            attachments:
              msg.role === "user" && msg.mediaUrl
                ? [
                    {
                      name: "Attachment",
                      isImage: true,
                      previewUrl: msg.mediaUrl,
                    },
                  ]
                : [],
            images:
              msg.role === "assistant" &&
              ((msg.mediaUrls && msg.mediaUrls.length > 0) || msg.mediaUrl)
                ? (msg.mediaUrls && msg.mediaUrls.length > 0
                    ? msg.mediaUrls
                    : [msg.mediaUrl]
                  ).map((url, index) => ({
                    url,
                    alt: `AI Artwork ${index + 1}`,
                  }))
                : [],
          }));

          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChatId ? { ...c, messages: mappedMessages } : c,
            ),
          );
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
      }
    };
    loadMessages();
  }, [activeChatId, chats]);

  // 3. Dynamically manage mode switching (infer active conversation context)
  useEffect(() => {
    const currentChat = chats.find((c) => c.id === activeChatId);
    if (currentChat && currentChat.mode !== currentMode) {
      // Find the first conversation of the selected mode, or create a new temp one
      const match = chats.find((c) => normalizeMode(c.mode) === currentMode);
      if (match) {
        setActiveChatId(match.id);
      } else {
        initializeNewTempChat();
      }
    }
  }, [currentMode, activeChatId, chats]);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [chats, isGenerating]);

  const activeChat = chats.find((c) => c.id === activeChatId) || {
    messages: [],
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
  };

  const handleNewChat = () => {
    // If the latest chat is already empty and temporary, do not stack duplicate blank ones
    const latestChat = chats[0];
    if (
      latestChat &&
      latestChat.id.startsWith("temp-") &&
      latestChat.messages.length === 0
    ) {
      setActiveChatId(latestChat.id);
      return;
    }
    initializeNewTempChat();
  };

  const handleDeleteChat = async (id) => {
    try {
      setError(null);
      if (!id.startsWith("temp-")) {
        await api.deleteConversation(id);
      }
      const updatedChats = chats.filter((c) => c.id !== id);
      setChats(updatedChats);

      if (activeChatId === id) {
        if (updatedChats.length > 0) {
          const match =
            updatedChats.find((c) => normalizeMode(c.mode) === currentMode) ||
            updatedChats[0];
          setActiveChatId(match.id);
        } else {
          initializeNewTempChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
      setError("Failed to delete conversation.");
    }
  };

  const handleSelectPrompt = (promptText) => {
    handleSendMessage([], promptText);
  };

  const handleSendMessage = async (attachments = [], overrideText = "") => {
    const textToSend = overrideText || inputVal;
    if (!textToSend.trim() && attachments.length === 0) return;

    // Save state preview parameters for UI visual responsiveness
    const userMessagePreview = {
      role: "user",
      content: textToSend,
      attachments: attachments.map((item) => ({
        name: item.name,
        isImage: item.isImage,
        previewUrl: item.previewUrl,
      })),
    };

    // Update state to render the user's message immediately
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            title:
              c.title === "New Chat"
                ? textToSend.length > 25
                  ? `${textToSend.substring(0, 22)}...`
                  : textToSend
                : c.title,
            messages: [...c.messages, userMessagePreview],
          };
        }
        return c;
      }),
    );

    setInputVal("");
    setIsGenerating(true);
    setError(null);

    try {
      let uploadedUrl = null;

      // If user provided files, run Multer upload to backend server first
      if (attachments.length > 0) {
        const fileObj = attachments[0].file;
        const uploadResult = await api.uploadImage(fileObj);
        uploadedUrl = uploadResult.url;
      }

      // Check if conversation exists on backend. If temp, do not pass conversationId
      const conIdParam = activeChatId.startsWith("temp-")
        ? undefined
        : activeChatId;

      const responseData = await api.sendChat({
        conversationId: conIdParam,
        content: textToSend,
        useCase: currentMode,
        mediaUrl: uploadedUrl,
      });

      // Map response models
      const apiUserMessage = {
        role: responseData.userMessage.role,
        content: responseData.userMessage.content,
        attachments: responseData.userMessage.mediaUrl
          ? [
              {
                name: "Attachment",
                isImage: true,
                previewUrl: responseData.userMessage.mediaUrl,
              },
            ]
          : [],
      };

      const apiAssistantMessage = {
        role: responseData.assistantMessage.role,
        content: responseData.assistantMessage.content,
        images:
          responseData.assistantMessage.mediaUrls &&
          responseData.assistantMessage.mediaUrls.length > 0
            ? responseData.assistantMessage.mediaUrls.map((url, index) => ({
                url,
                alt: `AI Output ${index + 1}`,
              }))
            : responseData.assistantMessage.mediaUrl
              ? [{ url: responseData.assistantMessage.mediaUrl, alt: "AI Output 1" }]
              : [],
      };

      // Set conversation list state containing new ids
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              id: responseData.conversationId,
              title: responseData.conversationTitle || c.title,
              mode: currentMode,
              messages: [
                ...c.messages.slice(0, -1),
                apiUserMessage,
                apiAssistantMessage,
              ],
            };
          }
          return c;
        }),
      );

      // Force selection focus to the new conversation id
      setActiveChatId(responseData.conversationId);
    } catch (err) {
      console.error("Failed to generate chat response:", err);
      setError(
        "Failed to fetch AI response. Please check backend connection and API key configurations.",
      );

      // Roll back the empty visual state loading
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: c.messages.slice(0, -1),
            };
          }
          return c;
        }),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredChats = chats.filter(
    (c) => normalizeMode(c.mode) === currentMode,
  );

  return (
    <MainLayout
      sidebar={
        <Sidebar
          chats={filteredChats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
      }
      navbar={
        <Navbar currentMode={currentMode} onModeChange={setCurrentMode} />
      }
    >
      <div className="flex h-full flex-col bg-white">
        {/* Error Notification Bar */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-100 flex justify-between items-center shrink-0">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="font-bold text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeChat.messages.length === 0 ? (
            <EmptyState
              currentMode={currentMode}
              onSelectPrompt={handleSelectPrompt}
            />
          ) : (
            <div className="w-full">
              {activeChat.messages.map((msg, idx) => (
                <MessageItem key={idx} message={msg} />
              ))}
              {/* Show loading item when generating response */}
              {isGenerating && <MessageItem isGenerating={true} />}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Bar Wrapper */}
        <div className="border-t border-neutral-100 bg-white p-4 md:p-6 shrink-0">
          <ChatInput
            value={inputVal}
            onChange={setInputVal}
            onSubmit={handleSendMessage}
            isGenerating={isGenerating}
            placeholder={`Message Vizzy (${currentMode} mode)...`}
          />
        </div>
      </div>
    </MainLayout>
  );
}
