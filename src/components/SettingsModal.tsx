import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  Sparkles, 
  Sliders, 
  Database, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { AppSettings, POPULAR_NVIDIA_MODELS, GEMINI_MODELS } from '../types';
import { verifyApiKey } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  initialTab?: string;
  hasServerNvidiaKey: boolean;
  hasServerGeminiKey: boolean;
  onExportAllChats: () => void;
  onImportChats: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  initialTab = 'nvidia',
  hasServerNvidiaKey,
  hasServerGeminiKey,
  onExportAllChats,
  onImportChats,
  onClearAllChats,
}) => {
  const [activeTab, setActiveTab] = useState<'nvidia' | 'gemini' | 'params' | 'data'>(
    (initialTab as any) || 'nvidia'
  );
  const [formState, setFormState] = useState<AppSettings>({ ...settings });
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid?: boolean;
    error?: string;
    modelCount?: number;
  } | null>(null);
  const [customNvidiaModel, setCustomNvidiaModel] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    const res = await verifyApiKey('nvidia', formState.nvidiaApiKey);
    setIsVerifying(false);
    setVerificationResult(res);
  };

  const handleSave = () => {
    let updated = { ...formState };
    if (customNvidiaModel.trim()) {
      updated.activeModel = customNvidiaModel.trim();
    }
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Platform Settings</h2>
              <p className="text-xs text-neutral-400">Configure NVIDIA NIM, Gemini, and inference options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 px-6 bg-[#181818] overflow-x-auto">
          <button
            onClick={() => setActiveTab('nvidia')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'nvidia'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>NVIDIA NIM API</span>
            {formState.nvidiaApiKey || hasServerNvidiaKey ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'gemini'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab('params')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'params'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inference Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'data'
                ? 'border-neutral-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data & Backups</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: NVIDIA NIM */}
          {activeTab === 'nvidia' && (
            <div className="space-y-5">
              {/* Informative Callout */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
                    <Key className="w-4 h-4" />
                    How to get your free NVIDIA API Key:
                  </span>
                  <a
                    href="https://build.nvidia.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium underline"
                  >
                    <span>build.nvidia.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 leading-relaxed">
                  <li>Visit <strong className="text-white">build.nvidia.com</strong> and create a free NVIDIA developer account.</li>
                  <li>Go to any model (e.g. <strong className="text-white">Meta Llama 3.3 70B</strong> or <strong className="text-white">DeepSeek R1</strong>).</li>
                  <li>Click <strong className="text-white">"Get API Key"</strong> and copy your key (starts with <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">nvapi-...</code>).</li>
                  <li>Paste it into the field below. NVIDIA gives 1,000 free credits to every account!</li>
                </ol>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>NVIDIA API Key (NIM Microservices)</span>
                  {hasServerNvidiaKey && !formState.nvidiaApiKey && (
                    <span className="text-[11px] text-emerald-400 font-normal">
                      ✓ Server-side NVIDIA_API_KEY detected in .env
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showNvidiaKey ? 'text' : 'password'}
                    placeholder="nvapi-..."
                    value={formState.nvidiaApiKey}
                    onChange={(e) => {
                      setFormState({ ...formState, nvidiaApiKey: e.target.value.trim() });
                      setVerificationResult(null);
                    }}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono pr-20"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNvidiaKey(!showNvidiaKey)}
                      className="p-1 rounded text-neutral-400 hover:text-white"
                      title={showNvidiaKey ? 'Hide key' : 'Show key'}
                    >
                      {showNvidiaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isVerifying || (!formState.nvidiaApiKey && !hasServerNvidiaKey)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Verifying with NVIDIA...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Test NVIDIA Connection</span>
                    </>
                  )}
                </button>

                {verificationResult?.valid && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Key verified! {verificationResult.modelCount ? `(${verificationResult.modelCount} NIM models available)` : ''}
                  </span>
                )}

                {verificationResult && !verificationResult.valid && (
                  <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verificationResult.error || 'Invalid key.'}</span>
                  </span>
                )}
              </div>

              {/* Select Default NVIDIA Model */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-neutral-300">
                  Select NVIDIA NIM Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_NVIDIA_MODELS.map((model) => {
                    const isSelected = formState.activeModel === model.id && formState.activeProvider === 'nvidia';
                    return (
                      <div
                        key={model.id}
                        onClick={() => {
                          setFormState({
                            ...formState,
                            activeProvider: 'nvidia',
                            activeModel: model.id,
                          });
                          setCustomNvidiaModel('');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                            : 'bg-white/5 border-white/5 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{model.name}</span>
                          {model.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                          {model.recommendedFor}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Model ID */}
                <div className="pt-2">
                  <label className="text-[11px] font-medium text-neutral-400">
                    Or enter any custom NVIDIA NIM model ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. qwen/qwen2.5-72b-instruct"
                    value={customNvidiaModel}
                    onChange={(e) => {
                      setCustomNvidiaModel(e.target.value);
                      if (e.target.value) {
                        setFormState({
                          ...formState,
                          activeProvider: 'nvidia',
                          activeModel: e.target.value.trim(),
                        });
                      }
                    }}
                    className="mt-1 w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE GEMINI */}
          {activeTab === 'gemini' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-neutral-300 space-y-1.5">
                <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Google Gemini Multimodal Models
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Fast, versatile reasoning models. You can use your server's configured Gemini key or provide a custom key below.
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Gemini API Key</span>
                  {hasServerGeminiKey && !formState.geminiApiKey && (
                    <span className="text-[11px] text-blue-400 font-normal">
                      ✓ Server GEMINI_API_KEY active
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={formState.geminiApiKey}
                    onChange={(e) =>
                      setFormState({ ...formState, geminiApiKey: e.target.value.trim() })
                    }
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 font-mono pr-20"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="p-1 rounded text-neutral-400 hover:text-white"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Select Gemini Model */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-neutral-300">Select Gemini Model</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GEMINI_MODELS.map((model) => {
                    const isSelected = formState.activeModel === model.id && formState.activeProvider === 'gemini';
                    return (
                      <div
                        key={model.id}
                        onClick={() =>
                          setFormState({
                            ...formState,
                            activeProvider: 'gemini',
                            activeModel: model.id,
                          })
                        }
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/40 text-white shadow-sm'
                            : 'bg-white/5 border-white/5 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{model.name}</span>
                          {model.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                          {model.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INFERENCE PARAMETERS */}
          {activeTab === 'params' && (
            <div className="space-y-6">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-200">Temperature</span>
                  <span className="font-mono text-emerald-400 font-bold">{formState.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={formState.temperature}
                  onChange={(e) =>
                    setFormState({ ...formState, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 bg-neutral-700 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>0.0 (Deterministic / Exact Code)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (High Creativity)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-200">Max Tokens</span>
                  <span className="font-mono text-emerald-400 font-bold">{formState.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={formState.maxTokens}
                  onChange={(e) =>
                    setFormState({ ...formState, maxTokens: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-emerald-500 bg-neutral-700 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>512</span>
                  <span>2048</span>
                  <span>4096</span>
                  <span>8192</span>
                </div>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-200">Top P (Nucleus Sampling)</span>
                  <span className="font-mono text-emerald-400 font-bold">{formState.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={formState.topP}
                  onChange={(e) =>
                    setFormState({ ...formState, topP: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 bg-neutral-700 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Stream toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="text-xs font-semibold text-neutral-200">Real-Time Streaming</div>
                  <div className="text-[11px] text-neutral-400">Stream tokens as they are generated by NVIDIA NIM</div>
                </div>
                <input
                  type="checkbox"
                  checked={formState.stream}
                  onChange={(e) => setFormState({ ...formState, stream: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: DATA MANAGEMENT */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="font-semibold text-xs text-white">Conversation Backups</div>
                <p className="text-xs text-neutral-400">
                  Export all your conversations to a local JSON file or import previously exported chats.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={onExportAllChats}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export All Chats (JSON)</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Import Chats</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImportChats}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <div className="font-semibold text-xs text-rose-300">Danger Zone</div>
                <p className="text-xs text-neutral-400">
                  Permanently delete all stored chats and message history from this browser.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all chat history?')) {
                      onClearAllChats();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Conversations</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#181818] border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {saveSuccess && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved successfully
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
