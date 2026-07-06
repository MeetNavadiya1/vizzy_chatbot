import React from 'react';
import { SquarePen, MessageSquare, Trash2 } from 'lucide-react';

export default function Sidebar({
  chats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) {
  return (
    <div className="flex h-full flex-col bg-white px-4 py-4">
      {/* App Logo / Header */}
      <div className="flex items-center gap-2 px-2 pb-5 border-b border-neutral-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
          >
            <path d="M12 3a9 9 0 0 0-9 9c0 1.5.4 3 1.1 4.3L3 21l4.7-1.1c1.3.7 2.8 1.1 4.3 1.1a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <span className="font-semibold text-neutral-900 tracking-tight text-lg">Vizzy Chat</span>
      </div>

      {/* New Chat Button */}
      <div className="mt-4 px-1">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-all focus:outline-hidden"
        >
          <span>New Chat</span>
          <SquarePen className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      {/* Scrollable Chat List */}
      <div className="mt-6 flex-1 overflow-y-auto px-1">
        <div className="space-y-1">
          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No recent chats
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all focus:outline-hidden ${
                    isActive
                      ? 'bg-neutral-100 font-medium text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <MessageSquare
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-900'
                    }`}
                  />
                  <span className="truncate flex-1">{chat.title}</span>
                  
                  {/* Delete Button */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this chat session?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-neutral-200/80 text-neutral-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
