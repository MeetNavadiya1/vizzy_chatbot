import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, ArrowUp, X, FileText } from 'lucide-react';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isGenerating,
  placeholder = "Message Vizzy..."
}) {
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-grow height function
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map((file) => {
      const isImage = file.type.startsWith('image/');
      return {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset file input value to allow selecting same file again
    e.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSend = () => {
    if ((!value.trim() && attachments.length === 0) || isGenerating) return;
    onSubmit(attachments);
    setAttachments([]);
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Clean up ObjectURLs to avoid memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const hasContent = value.trim() || attachments.length > 0;

  return (
    <div className="w-full">
      <div className="relative flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xs focus-within:border-neutral-300 focus-within:shadow-xs transition-all max-w-3xl mx-auto">
        {/* Attachments Preview Area */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4 border-b border-neutral-100 pb-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 pr-2.5 text-xs text-neutral-700"
              >
                {item.isImage ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-8 w-8 rounded-md object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
                <span className="max-w-[120px] truncate font-medium">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(item.id)}
                  className="rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Area & Actions */}
        <div className="flex items-end gap-2 p-2 pr-3">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            disabled={isGenerating}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 active:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            className="flex-1 resize-none bg-transparent py-2.5 px-1.5 text-sm text-neutral-900 placeholder-neutral-400 outline-hidden focus:ring-0 disabled:cursor-not-allowed min-h-[38px] max-h-[200px]"
            style={{ height: 'auto' }}
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent || isGenerating}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all focus:outline-hidden ${
              hasContent && !isGenerating
                ? 'bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-102 active:scale-98'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-neutral-400">
        Vizzy Chat can make mistakes. Please check important info.
      </div>
    </div>
  );
}
