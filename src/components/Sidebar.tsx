import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Trash2, 
  Edit2, 
  Pin, 
  PinOff, 
  Check, 
  X, 
  Cpu, 
  Settings, 
  Key, 
  Sparkles,
  ChevronRight,
  Archive
} from 'lucide-react';
import { Conversation, ModelProvider } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeChatId: string | null;
  isOpen: boolean;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: (tab?: string) => void;
  onCloseSidebarMobile: () => void;
  hasNvidiaKey: boolean;
  activeProvider: ModelProvider;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeChatId,
  isOpen,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onClearAll,
  onOpenSettings,
  onCloseSidebarMobile,
  hasNvidiaKey,
  activeProvider,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Start editing title
  const handleStartEdit = (e: React.MouseEvent, chat: Conversation) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  // Save title edit
  const handleSaveEdit = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  // Group conversations by date
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];
    const pinned: Conversation[] = [];

    filteredConversations.forEach((chat) => {
      if (chat.pinned) {
        pinned.push(chat);
        return;
      }
      const diff = now - chat.updatedAt;
      if (diff < oneDay) {
        today.push(chat);
      } else if (diff < 2 * oneDay) {
        yesterday.push(chat);
      } else if (diff < 7 * oneDay) {
        last7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredConversations]);

  const renderChatItem = (chat: Conversation) => {
    const isActive = chat.id === activeChatId;
    const isEditing = chat.id === editingChatId;

    return (
      <div
        key={chat.id}
        onClick={() => {
          onSelectChat(chat.id);
          onCloseSidebarMobile();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/10'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
          
          {isEditing ? (
            <form onSubmit={(e) => handleSaveEdit(e, chat.id)} className="flex items-center gap-1 flex-1 mr-1">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-[#171717] border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                onClick={(e) => handleSaveEdit(e, chat.id)}
                className="p-1 hover:text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChatId(null);
                }}
                className="p-1 hover:text-rose-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate flex-1">{chat.title}</span>
          )}
        </div>

        {/* Hover Action icons */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(chat.id);
              }}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title={chat.pinned ? 'Unpin' : 'Pin chat'}
            >
              {chat.pinned ? <PinOff className="w-3 h-3 text-emerald-400" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => handleStartEdit(e, chat)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-500/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onCloseSidebarMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#171717] border-r border-white/10 flex flex-col transition-all duration-300 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'
        }`}
      >
        {/* Top Header & New Chat button */}
        <div className="p-3 border-b border-white/5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">OmniChat</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
              NIM v1
            </span>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseSidebarMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group border border-white/10"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Chat</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-black/30 rounded border border-white/5">
              ⌘N
            </kbd>
          </button>

          {/* Search box */}
          {conversations.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#212121] border border-white/5 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-neutral-500 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p>No chat history yet.</p>
              <p className="text-[11px] mt-1 text-neutral-600">Start a conversation above.</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">
              No chats matching "{searchQuery}"
            </div>
          ) : (
            <>
              {/* Pinned Chats */}
              {grouped.pinned.length > 0 && (
                <div>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-emerald-400" />
                    <span>PINNED</span>
                  </div>
                  <div className="space-y-0.5">{grouped.pinned.map(renderChatItem)}</div>
                </div>
              )}

              {/* Today */}
              {grouped.today.length > 0 && (
                <div>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500">TODAY</div>
                  <div className="space-y-0.5">{grouped.today.map(renderChatItem)}</div>
                </div>
              )}

              {/* Yesterday */}
              {grouped.yesterday.length > 0 && (
                <div>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500">YESTERDAY</div>
                  <div className="space-y-0.5">{grouped.yesterday.map(renderChatItem)}</div>
                </div>
              )}

              {/* Last 7 Days */}
              {grouped.last7Days.length > 0 && (
                <div>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500">PREVIOUS 7 DAYS</div>
                  <div className="space-y-0.5">{grouped.last7Days.map(renderChatItem)}</div>
                </div>
              )}

              {/* Older */}
              {grouped.older.length > 0 && (
                <div>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500">OLDER</div>
                  <div className="space-y-0.5">{grouped.older.map(renderChatItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Profile & Settings Section */}
        <div className="p-3 border-t border-white/10 bg-[#141414] space-y-2">
          {/* NVIDIA Key status pill */}
          <div 
            onClick={() => onOpenSettings('nvidia')}
            className={`p-2 rounded-xl text-xs flex items-center justify-between border cursor-pointer transition-colors ${
              hasNvidiaKey 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15'
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px] leading-tight">
                  {hasNvidiaKey ? 'NVIDIA Key Active' : 'Configure NVIDIA Key'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {hasNvidiaKey ? 'build.nvidia.com' : 'Click to setup API key'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          </div>

          {/* User profile & Settings launcher */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onOpenSettings()}
              className="flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20">
                AI
              </div>
              <div className="text-left">
                <div className="font-medium group-hover:text-emerald-400 transition-colors">Settings</div>
                <div className="text-[10px] text-neutral-500">Models & Preferences</div>
              </div>
            </button>

            {conversations.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Clear all chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
