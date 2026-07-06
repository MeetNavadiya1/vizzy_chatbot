import React from 'react';
import { Sparkles, FileText, User } from 'lucide-react';
import ImageGrid from './ImageGrid';

// Custom lightweight parser to format basic markdown-like text
function FormattedText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-neutral-800">
      {lines.map((line, idx) => {
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().replace(/^[-*]\s+/, '');
          return (
            <ul key={idx} className="list-disc pl-5 my-1">
              <li className="text-neutral-800">{formatInlineBold(content)}</li>
            </ul>
          );
        }

        // Numbered list
        const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const content = numMatch[2];
          return (
            <ol key={idx} className="list-decimal pl-5 my-1" start={numMatch[1]}>
              <li className="text-neutral-800">{formatInlineBold(content)}</li>
            </ol>
          );
        }

        // Code block or heading (simple fallback)
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-base font-semibold text-neutral-900 mt-3 mb-1">
              {formatInlineBold(line.substring(4))}
            </h4>
          );
        }

        // Standard paragraph
        return line.trim() ? (
          <p key={idx}>{formatInlineBold(line)}</p>
        ) : (
          <div key={idx} className="h-2" />
        );
      })}
    </div>
  );
}

// Formatter for bold text **like this**
function formatInlineBold(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-neutral-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function MessageItem({ message, isGenerating }) {
  // Render skeleton for loading state
  if (isGenerating) {
    return (
      <div className="flex gap-4 py-6 border-b border-neutral-100 max-w-3xl mx-auto px-4 md:px-0">
        {/* Assistant Avatar */}
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-neutral-900 text-white">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        </div>
        {/* Skeleton content */}
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-4 w-[85%] rounded-md bg-neutral-200/70 animate-pulse" />
          <div className="h-4 w-[95%] rounded-md bg-neutral-200/70 animate-pulse" />
          <div className="h-4 w-[60%] rounded-md bg-neutral-200/70 animate-pulse" />
        </div>
      </div>
    );
  }

  const isUser = message?.role === 'user';

  return (
    <div
      className={`flex w-full py-6 border-b border-neutral-100 ${
        isUser ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      <div className="flex gap-4 w-full max-w-3xl mx-auto px-4 md:px-0">
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
            isUser
              ? 'bg-neutral-100 border-neutral-200 text-neutral-600'
              : 'bg-neutral-900 border-neutral-900 text-white'
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>

        {/* Content Panel */}
        <div className="flex-1 space-y-2 pt-0.5 overflow-hidden">
          {/* Header Name */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-900 tracking-wide">
              {isUser ? 'You' : 'Vizzy'}
            </span>
          </div>

          {/* User Attachments (if any) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 mt-1">
              {message.attachments.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/50 p-1.5 pr-2.5 text-xs text-neutral-600"
                >
                  {item.isImage ? (
                    <img
                      src={item.previewUrl || (item.file ? URL.createObjectURL(item.file) : '')}
                      alt={item.name}
                      className="h-8 w-8 rounded-md object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500">
                      <FileText className="h-4 w-4" />
                    </div>
                  )}
                  <span className="max-w-[120px] truncate font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Message Text Content */}
          <div className="prose prose-neutral max-w-none">
            <FormattedText text={message.content} />
          </div>

          {/* Assistant Generated Images (if any) */}
          {!isUser && message.images && message.images.length > 0 && (
            <ImageGrid images={message.images} />
          )}
        </div>
      </div>
    </div>
  );
}
