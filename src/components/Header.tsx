import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Settings, 
  Trash2, 
  Download, 
  Sliders, 
  Menu, 
  Key, 
  Check, 
  Cpu, 
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import { ALL_MODELS, ModelInfo, ModelProvider } from '../types';

interface HeaderProps {
  currentModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  onOpenSettings: (tab?: string) => void;
  onOpenInstructions: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  toggleSidebar: () => void;
  hasNvidiaKey: boolean;
  hasGeminiKey: boolean;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onSelectModel,
  onOpenSettings,
  onOpenInstructions,
  onClearChat,
  onExportChat,
  toggleSidebar,
  hasNvidiaKey,
  hasGeminiKey,
  hasMessages,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nvidiaModels = ALL_MODELS.filter((m) => m.provider === 'nvidia');
  const geminiModels = ALL_MODELS.filter((m) => m.provider === 'gemini');

  return (
    <header className="h-14 border-b border-white/10 bg-[#212121]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left section: Sidebar toggle & Model selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Model Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 text-neutral-200 hover:text-white transition-all text-sm font-semibold cursor-pointer group border border-transparent hover:border-white/10"
          >
            <span className="flex items-center gap-1.5">
              {currentModel.provider === 'nvidia' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-500/20"></span>
              )}
              <span>{currentModel.name}</span>
            </span>

            {currentModel.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal hidden sm:inline-block ${
                currentModel.provider === 'nvidia' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {currentModel.badge}
              </span>
            )}

            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180 text-white' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-84 sm:w-96 rounded-2xl bg-[#1e1e1e] border border-white/15 shadow-2xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  NVIDIA NIM Models
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {hasNvidiaKey ? 'Key Connected' : 'API Key Configurable'}
                </span>
              </div>

              <div className="space-y-1 mb-2">
                {nvidiaModels.map((model) => {
                  const isSelected = currentModel.id === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white' 
                          : 'hover:bg-white/5 text-neutral-300 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-100">{model.name}</span>
                          {model.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {model.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-blue-400 uppercase flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 mt-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Google Gemini Models
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {hasGeminiKey ? 'Active' : 'Server/Key'}
                </span>
              </div>

              <div className="space-y-1">
                {geminiModels.map((model) => {
                  const isSelected = currentModel.id === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-500/20 border border-blue-500/40 text-white' 
                          : 'hover:bg-white/5 text-neutral-300 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-100">{model.name}</span>
                          {model.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {model.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] px-1">
                <span className="text-neutral-400">Want more models?</span>
                <button
                  onClick={() => {
                    setModelDropdownOpen(false);
                    onOpenSettings('nvidia');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  Configure Custom NIM Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Quick actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Provider badge indicator */}
        <button
          onClick={() => onOpenSettings(currentModel.provider)}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            currentModel.provider === 'nvidia'
              ? hasNvidiaKey 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
          }`}
          title="Click to manage API key"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            currentModel.provider === 'nvidia'
              ? hasNvidiaKey ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              : 'bg-blue-400'
          }`}></span>
          <span>{currentModel.provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}</span>
          {!hasNvidiaKey && currentModel.provider === 'nvidia' && (
            <span className="text-[10px] text-amber-200 underline">Add Key</span>
          )}
        </button>

        {/* Custom Instructions / Persona button */}
        <button
          onClick={onOpenInstructions}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Custom instructions / System prompt"
          aria-label="Custom instructions"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Export Chat */}
        {hasMessages && (
          <button
            onClick={onExportChat}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Export conversation"
            aria-label="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Clear Chat */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Clear current messages"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => onOpenSettings()}
          className="relative p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Platform settings & API keys"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
          {!hasNvidiaKey && currentModel.provider === 'nvidia' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>
    </header>
  );
};
