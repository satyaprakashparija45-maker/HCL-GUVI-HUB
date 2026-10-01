import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AppSettings, 
  Conversation, 
  ChatMessage, 
  ModelInfo, 
  ALL_MODELS, 
  MessageAttachment 
} from './types';
import { 
  loadSettings, 
  saveSettings, 
  loadConversations, 
  saveConversations, 
  loadActiveChatId, 
  saveActiveChatId 
} from './lib/storage';
import { fetchServerConfig, streamChatCompletion } from './lib/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { EmptyChat } from './components/EmptyChat';
import { SettingsModal } from './components/SettingsModal';
import { CustomInstructionsModal } from './components/CustomInstructionsModal';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeChatId, setActiveChatId] = useState<string | null>(loadActiveChatId);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('nvidia');
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);

  const [hasServerNvidiaKey, setHasServerNvidiaKey] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync server keys on load
  useEffect(() => {
    fetchServerConfig().then((config) => {
      setHasServerNvidiaKey(config.hasNvidiaServerKey);
      setHasServerGeminiKey(config.hasGeminiServerKey);

      // If user has not set a preferred provider or keys, match server key availability
      setSettings((prev) => {
        if (!prev.nvidiaApiKey && config.hasNvidiaServerKey && prev.activeProvider !== 'nvidia') {
          return { ...prev, activeProvider: 'nvidia' };
        }
        return prev;
      });
    });
  }, []);

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Save conversations when changed
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Save active chat ID when changed
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  // Keyboard shortcut listener: Cmd/Ctrl + N for new chat, Cmd/Ctrl + B for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Current active conversation
  const currentChat = conversations.find((c) => c.id === activeChatId) || null;

  // Selected Model info
  const currentModel: ModelInfo = 
    ALL_MODELS.find((m) => m.id === (currentChat?.modelId || settings.activeModel)) || {
      id: settings.activeModel,
      name: settings.activeModel.split('/').pop() || settings.activeModel,
      provider: settings.activeProvider,
      description: 'Configured model',
    };

  // Check if NVIDIA or Gemini keys are configured
  const hasNvidiaKey = !!settings.nvidiaApiKey || hasServerNvidiaKey;
  const hasGeminiKey = !!settings.geminiApiKey || hasServerGeminiKey;

  // Create a new chat
  const handleNewChat = useCallback(() => {
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setActiveChatId(null);
  }, []);

  // Select existing chat
  const handleSelectChat = useCallback((id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setActiveChatId(id);
  }, []);

  // Delete a chat
  const handleDeleteChat = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }, [activeChatId]);

  // Rename a chat
  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  }, []);

  // Toggle pin
  const handleTogglePin = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  // Clear all chats
  const handleClearAllChats = useCallback(() => {
    setConversations([]);
    setActiveChatId(null);
  }, []);

  // Clear messages in current chat
  const handleClearCurrentChat = useCallback(() => {
    if (!activeChatId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: [] } : c))
    );
  }, [activeChatId]);

  // Model selection
  const handleSelectModel = useCallback((model: ModelInfo) => {
    setSettings((prev) => ({
      ...prev,
      activeModel: model.id,
      activeProvider: model.provider,
    }));

    if (activeChatId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, modelId: model.id, provider: model.provider }
            : c
        )
      );
    }
  }, [activeChatId]);

  // Stop active streaming
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Update message state to remove streaming indicator
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        };
      })
    );
  }, [activeChatId]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string, attachments?: MessageAttachment[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;

      let chatId = activeChatId;
      let isBrandNewChat = false;

      // Create new conversation if none active
      if (!chatId) {
        isBrandNewChat = true;
        const newId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        // Title from first prompt
        const truncatedTitle =
          content.trim().slice(0, 36) + (content.trim().length > 36 ? '...' : '') ||
          attachments?.[0]?.name ||
          'New Chat';

        const newChat: Conversation = {
          id: newId,
          title: truncatedTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          modelId: settings.activeModel,
          provider: settings.activeProvider,
        };

        setConversations((prev) => [newChat, ...prev]);
        setActiveChatId(newId);
        chatId = newId;
      }

      const userMsgId = `msg_${Date.now()}_user`;
      const assistantMsgId = `msg_${Date.now() + 1}_assistant`;

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content,
        attachments,
        timestamp: Date.now(),
      };

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        modelUsed: currentModel.name,
        providerUsed: settings.activeProvider,
        isStreaming: true,
      };

      // Add user and initial placeholder assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage],
          };
        })
      );

      // Setup streaming
      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Compile message history
      const activeConvo = conversations.find((c) => c.id === chatId);
      const messageHistory = [
        ...(activeConvo?.messages || []),
        userMessage,
      ];

      let accumulatedContent = '';
      let accumulatedReasoning = '';

      streamChatCompletion({
        provider: settings.activeProvider,
        model: settings.activeModel,
        messages: messageHistory,
        settings,
        abortSignal: controller.signal,
        callbacks: {
          onChunk: (chunk: string) => {
            accumulatedContent += chunk;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== chatId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent }
                      : m
                  ),
                };
              })
            );
          },
          onReasoning: (reasoning: string) => {
            accumulatedReasoning += reasoning;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== chatId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, reasoning: accumulatedReasoning }
                      : m
                  ),
                };
              })
            );
          },
          onError: (errorText: string) => {
            setIsStreaming(false);
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== chatId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: errorText,
                          content: accumulatedContent || '',
                        }
                      : m
                  ),
                };
              })
            );
          },
          onDone: () => {
            setIsStreaming(false);
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== chatId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, isStreaming: false }
                      : m
                  ),
                };
              })
            );
          },
        },
      });
    },
    [activeChatId, settings, currentModel, conversations]
  );

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    if (!currentChat || currentChat.messages.length === 0 || isStreaming) return;

    // Find last user message
    const msgs = [...currentChat.messages];
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const lastUserMsg = msgs[lastUserIdx];
    // Remove subsequent messages and re-send
    const trimmedMsgs = msgs.slice(0, lastUserIdx);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentChat.id ? { ...c, messages: trimmedMsgs } : c
      )
    );

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments);
  }, [currentChat, isStreaming, handleSendMessage]);

  // Edit user message and re-send
  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      if (!currentChat || isStreaming) return;

      const idx = currentChat.messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;

      // Slice up to that message
      const trimmed = currentChat.messages.slice(0, idx);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentChat.id ? { ...c, messages: trimmed } : c
        )
      );

      handleSendMessage(newContent);
    },
    [currentChat, isStreaming, handleSendMessage]
  );

  // Export chat as Markdown
  const handleExportChat = useCallback(() => {
    if (!currentChat || currentChat.messages.length === 0) return;

    let md = `# ${currentChat.title}\n`;
    md += `*Model: ${currentChat.modelId} (${currentChat.provider})*\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*\n\n---\n\n`;

    currentChat.messages.forEach((m) => {
      const author = m.role === 'user' ? '### User' : `### Assistant (${m.modelUsed || currentModel.name})`;
      md += `${author}\n\n${m.content}\n\n`;
      if (m.reasoning) {
        md += `> **Thought Process:**\n> ${m.reasoning.replace(/\n/g, '\n> ')}\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentChat, currentModel]);

  // Export all conversations as JSON
  const handleExportAllChats = useCallback(() => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omnichat_conversations_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [conversations]);

  // Import conversations from JSON file
  const handleImportChats = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setConversations((prev) => [...parsed, ...prev]);
            alert(`Imported ${parsed.length} conversations successfully!`);
          }
        } catch (err) {
          alert('Failed to parse imported JSON file.');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        onClearAll={handleClearAllChats}
        onOpenSettings={(tab) => {
          setSettingsInitialTab(tab || 'nvidia');
          setSettingsModalOpen(true);
        }}
        onCloseSidebarMobile={() => setSidebarOpen(false)}
        hasNvidiaKey={hasNvidiaKey}
        activeProvider={settings.activeProvider}
      />

      {/* Main chat layout */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header
          currentModel={currentModel}
          onSelectModel={handleSelectModel}
          onOpenSettings={(tab) => {
            setSettingsInitialTab(tab || 'nvidia');
            setSettingsModalOpen(true);
          }}
          onOpenInstructions={() => setInstructionsModalOpen(true)}
          onClearChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          toggleSidebar={() => setSidebarOpen((prev) => !prev)}
          hasNvidiaKey={hasNvidiaKey}
          hasGeminiKey={hasGeminiKey}
          hasMessages={!!currentChat && currentChat.messages.length > 0}
        />

        {/* Chat Messages or Empty Hero */}
        {currentChat && currentChat.messages.length > 0 ? (
          <ChatArea
            messages={currentChat.messages}
            currentModel={currentModel}
            isStreaming={isStreaming}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
            onOpenSettings={(tab) => {
              setSettingsInitialTab(tab || 'nvidia');
              setSettingsModalOpen(true);
            }}
          />
        ) : (
          <EmptyChat
            currentModel={currentModel}
            provider={settings.activeProvider}
            hasNvidiaKey={hasNvidiaKey}
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            onOpenSettings={() => {
              setSettingsInitialTab('nvidia');
              setSettingsModalOpen(true);
            }}
          />
        )}

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          currentModel={currentModel}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        initialTab={settingsInitialTab}
        hasServerNvidiaKey={hasServerNvidiaKey}
        hasServerGeminiKey={hasServerGeminiKey}
        onExportAllChats={handleExportAllChats}
        onImportChats={handleImportChats}
        onClearAllChats={handleClearAllChats}
      />

      {/* Custom Instructions Modal */}
      <CustomInstructionsModal
        isOpen={instructionsModalOpen}
        onClose={() => setInstructionsModalOpen(false)}
        customInstructions={settings.customInstructions}
        userContext={settings.userContext}
        onSave={(instructions, context) =>
          setSettings((prev) => ({
            ...prev,
            customInstructions: instructions,
            userContext: context,
          }))
        }
      />
    </div>
  );
}
