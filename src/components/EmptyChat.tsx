import React from 'react';
import { 
  Sparkles, 
  Code2, 
  BrainCircuit, 
  Cpu, 
  FileText, 
  Layers, 
  Key, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ModelInfo, ModelProvider } from '../types';

interface EmptyChatProps {
  currentModel: ModelInfo;
  provider: ModelProvider;
  hasNvidiaKey: boolean;
  onSelectPrompt: (prompt: string) => void;
  onOpenSettings: () => void;
}

const PROMPT_SUGGESTIONS = [
  {
    category: 'Coding & Architecture',
    icon: Code2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Design a distributed rate limiter',
    prompt: 'Design a distributed rate-limiting system using Redis and token bucket algorithm in TypeScript. Include error handling and concurrency race-condition mitigations.',
  },
  {
    category: 'Deep Reasoning',
    icon: BrainCircuit,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    title: 'Compare Mamba vs Transformer LLMs',
    prompt: 'Provide an in-depth technical comparison between Transformer attention mechanisms and State Space Models (e.g. Mamba). Analyze inference latency, memory scaling, and long-context capabilities.',
  },
  {
    category: 'Full-Stack Engineering',
    icon: Layers,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    title: 'React 19 Server Actions & Optimistic UI',
    prompt: 'Explain how React 19 Server Actions work with useOptimistic and useActionState. Give a complete, runnable example with form submission and rollback on failure.',
  },
  {
    category: 'Creative & Strategy',
    icon: FileText,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'Launch announcement for AI platform',
    prompt: 'Draft an exciting, highly professional product launch announcement for an enterprise AI platform powered by NVIDIA NIM inference. Highlight latency, privacy, and open weights model flexibility.',
  },
];

export const EmptyChat: React.FC<EmptyChatProps> = ({
  currentModel,
  provider,
  hasNvidiaKey,
  onSelectPrompt,
  onOpenSettings,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8 text-center select-none">
      {/* Platform Logo / Badge */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#1e1e1e] border border-emerald-500/40 text-[10px] font-semibold text-emerald-400 flex items-center gap-1 shadow">
          <Sparkles className="w-2.5 h-2.5" />
          <span>NIM</span>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        What would you like to build or explore?
      </h1>
      
      <p className="text-sm sm:text-base text-neutral-400 max-w-lg mb-6">
        ChatGPT-grade experience powered by <span className="text-emerald-400 font-medium">NVIDIA NIM</span> microservices and Google Gemini models.
      </p>

      {/* NVIDIA NIM Status Banner */}
      {!hasNvidiaKey && provider === 'nvidia' ? (
        <div className="w-full max-w-xl mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/40 border border-emerald-500/30 text-left flex items-start gap-3.5 shadow-md">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Ready for NVIDIA API Key</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Free Credits</span>
            </div>
            <p className="text-neutral-400 mt-1 leading-relaxed">
              Get an instant API key from <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">build.nvidia.com</a> with 1,000 free inference credits for Llama 3.3, DeepSeek R1, and Nemotron.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                Configure Key in Settings
              </button>
              <span className="text-[11px] text-neutral-500">or switch to Gemini in top bar</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl mb-6 px-3.5 py-2 rounded-lg bg-[#2a2a2a]/60 border border-white/10 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-white">{currentModel.name}</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400 capitalize">{provider} Provider Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Connected</span>
          </div>
        </div>
      )}

      {/* Suggestion prompt cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
        {PROMPT_SUGGESTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-3.5 rounded-xl bg-[#282828] hover:bg-[#303030] border border-white/5 hover:border-emerald-500/40 transition-all duration-200 text-left flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-emerald-950/20"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg border ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">{item.category}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-200 group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Try prompt</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
