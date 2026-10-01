import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';

interface CustomInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customInstructions: string;
  userContext: string;
  onSave: (instructions: string, context: string) => void;
}

export const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = ({
  isOpen,
  onClose,
  customInstructions,
  userContext,
  onSave,
}) => {
  const [instructions, setInstructions] = useState(customInstructions);
  const [context, setContext] = useState(userContext);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(instructions, context);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Custom Instructions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-200">
              What would you like OmniChat to know about you?
            </label>
            <p className="text-neutral-400 text-xs">
              e.g., "I'm a senior TypeScript engineer working on cloud infrastructure with Kubernetes and React."
            </p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Where are you based, what's your role, or what technologies do you use?"
              rows={3}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-200">
              How would you like OmniChat to respond?
            </label>
            <p className="text-neutral-400 text-xs">
              e.g., "Keep code examples clean and modular, cite technical trade-offs, avoid conversational fluff."
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Preferred tone, formatting preferences, code standards, etc."
              rows={4}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#181818] border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Instructions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
