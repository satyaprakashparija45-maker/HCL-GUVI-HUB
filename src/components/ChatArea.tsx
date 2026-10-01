import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Cpu, 
  AlertCircle,
  FileText,
  Edit3,
  ArrowDown
} from 'lucide-react';
import { ChatMessage, ModelInfo } from '../types';
import { renderMarkdown, extractReasoningBlocks } from '../lib/markdown';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentModel: ModelInfo;
  isStreaming: boolean;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onOpenSettings: (tab?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentModel,
  isStreaming,
  onRegenerate,
  onEditMessage,
  onOpenSettings,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | undefined>>({});

  // Auto-scroll when messages change or stream
  useEffect(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom || isStreaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Track scroll position to show/hide "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Delegated copy code block click handler
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement | null;
      if (!target) return;

      const codeEncoded = target.getAttribute('data-code');
      if (codeEncoded) {
        const code = decodeURIComponent(codeEncoded);
        navigator.clipboard.writeText(code);
        const originalText = target.innerHTML;
        target.innerHTML = `
          <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="text-emerald-400">Copied!</span>
        `;
        setTimeout(() => {
          target.innerHTML = originalText;
        }, 2000);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined : type,
    }));
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-[#212121]">
      {/* Scrollable conversation thread */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isLastMessage = index === messages.length - 1;
            const parsed = !isUser
              ? extractReasoningBlocks(message.content, message.reasoning)
              : null;
            const isThoughtExpanded = expandedThoughts[message.id] ?? true;

            return (
              <div
                key={message.id}
                className={`group flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="shrink-0 pt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md ring-1 ring-white/10">
                      {message.providerUsed === 'nvidia' || currentModel.provider === 'nvidia' ? (
                        <Cpu className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${
                    isUser ? 'items-end' : 'items-start flex-1 min-w-0'
                  }`}
                >
                  {/* Model header info for assistant */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-neutral-400">
                      <span className="font-semibold text-neutral-200">
                        {message.modelUsed || currentModel.name}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="capitalize text-emerald-400 font-mono text-[10px]">
                        {message.providerUsed || currentModel.provider}
                      </span>
                    </div>
                  )}

                  {/* User Bubble or Assistant Container */}
                  {isUser ? (
                    <div className="flex flex-col items-end">
                      {/* Attachments if any */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
                          {message.attachments.map((att, attIdx) => (
                            <div
                              key={attIdx}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-medium truncate max-w-[150px]">{att.name}</span>
                              <span className="text-[10px] text-neutral-500">
                                ({Math.round(att.size / 1024)}KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {editingId === message.id ? (
                        <div className="w-full min-w-[280px] sm:min-w-[400px] p-2 rounded-2xl bg-[#2f2f2f] border border-white/20">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={3}
                            className="w-full bg-transparent text-sm text-white resize-none focus:outline-none p-1"
                          />
                          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                onEditMessage(message.id, editingText);
                                setEditingId(null);
                              }}
                              className="px-3 py-1 text-xs bg-emerald-500 text-neutral-950 font-semibold rounded hover:bg-emerald-400 cursor-pointer"
                            >
                              Save & Resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/bubble">
                          <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-[#2f2f2f] text-neutral-100 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm border border-white/5">
                            {message.content}
                          </div>

                          {/* Hover edit action */}
                          <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingId(message.id);
                                setEditingText(message.content);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Edit and resend"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Copy"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full text-neutral-200 text-sm sm:text-[15px] leading-relaxed">
                      {/* DeepSeek R1 / Reasoning block */}
                      {parsed?.hasReasoning && (
                        <div className="mb-4 rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden">
                          <button
                            onClick={() => toggleThought(message.id)}
                            className="w-full flex items-center justify-between px-3.5 py-2 bg-white/5 hover:bg-white/10 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="font-semibold text-emerald-300">Thought Process</span>
                              {!parsed.isReasoningComplete && (
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  (Reasoning...)
                                </span>
                              )}
                            </div>
                            {isThoughtExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isThoughtExpanded && (
                            <div className="p-3.5 text-xs text-neutral-400 font-mono bg-black/30 border-t border-white/5 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                              {parsed.reasoningText}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error Banner */}
                      {message.error ? (
                        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1 font-medium">{message.error}</div>
                          </div>
                          {message.error.toLowerCase().includes('nvidia') && (
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                onClick={() => onOpenSettings('nvidia')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-semibold text-xs hover:bg-emerald-400 cursor-pointer"
                              >
                                Configure NVIDIA API Key
                              </button>
                              <a
                                href="https://build.nvidia.com"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-neutral-400 hover:underline"
                              >
                                Get free key at build.nvidia.com ↗
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Markdown Parsed Content */
                        <div className="prose prose-invert max-w-none text-neutral-200">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(parsed?.responseText || message.content),
                            }}
                          />
                          {message.isStreaming && (
                            <span className="streaming-cursor"></span>
                          )}
                        </div>
                      )}

                      {/* Assistant Actions Toolbar */}
                      {!message.isStreaming && !message.error && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 text-neutral-400">
                          <button
                            onClick={() =>
                              handleCopyMessage(message.id, parsed?.responseText || message.content)
                            }
                            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleSpeak(message.id, parsed?.responseText || message.content)
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              speakingId === message.id
                                ? 'text-emerald-400 bg-emerald-500/20'
                                : 'hover:text-white hover:bg-white/10'
                            }`}
                            title="Read aloud"
                          >
                            {speakingId === message.id ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isLastMessage && (
                            <button
                              onClick={onRegenerate}
                              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="h-3 w-px bg-white/10 mx-1"></div>

                          <button
                            onClick={() => handleFeedback(message.id, 'up')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedback[message.id] === 'up'
                                ? 'text-emerald-400 bg-emerald-500/20'
                                : 'hover:text-white hover:bg-white/10'
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleFeedback(message.id, 'down')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedback[message.id] === 'down'
                                ? 'text-rose-400 bg-rose-500/20'
                                : 'hover:text-white hover:bg-white/10'
                            }`}
                            title="Poor response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="shrink-0 pt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-neutral-700 flex items-center justify-center text-white ring-1 ring-white/10">
                      <User className="w-4 h-4 text-neutral-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-8 p-2 rounded-full bg-[#2f2f2f] text-neutral-300 hover:text-white border border-white/15 shadow-xl hover:bg-neutral-700 transition-all cursor-pointer z-10 animate-bounce"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
