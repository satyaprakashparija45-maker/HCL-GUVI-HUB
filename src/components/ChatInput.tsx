import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Square, 
  Paperclip, 
  Mic, 
  MicOff, 
  X, 
  FileText, 
  Image as ImageIcon,
  Sparkles,
  Cpu
} from 'lucide-react';
import { MessageAttachment, ModelInfo } from '../types';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  currentModel: ModelInfo;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
  currentModel,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${Math.max(newHeight, 52)}px`;
    }
  }, [input]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming || disabled) return;

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isText = file.type.startsWith('text/') || /\.(json|js|ts|tsx|jsx|py|java|cpp|c|md|css|html|yaml|yml|sh|sql)$/i.test(file.name);
      
      const reader = new FileReader();
      if (isText) {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              content: content.slice(0, 100000), // Max 100KB text
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        // Fallback or Image info
        reader.onload = (event) => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              content: `[File attached: ${file.name}, size: ${file.size} bytes]`,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 select-none">
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept=".txt,.md,.py,.js,.ts,.tsx,.jsx,.json,.csv,.sql,.html,.css,.yaml,.yml"
      />

      {/* Main input wrapper */}
      <div className="relative rounded-3xl bg-[#2f2f2f] border border-white/10 shadow-2xl focus-within:border-white/20 transition-all duration-200">
        {/* Attachments preview row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0 border-b border-white/5">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs text-neutral-200"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium truncate max-w-[140px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${currentModel.name} on ${currentModel.provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}...`}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 py-3.5 pl-4 pr-24 focus:outline-none resize-none leading-relaxed min-h-[52px]"
        />

        {/* Action icons (attach, voice, send) */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
            title="Attach code or text file"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isRecording
                ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
            }`}
            title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send or Stop button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2 rounded-full bg-white text-neutral-900 hover:bg-neutral-200 transition-colors cursor-pointer shadow-md flex items-center justify-center"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-neutral-900" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md ${
                input.trim() || attachments.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 ring-2 ring-emerald-500/30'
                  : 'bg-white/10 text-neutral-500 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="mt-2 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 flex-wrap">
        <span>OmniChat can make mistakes. Verify sensitive facts.</span>
        <span>•</span>
        <span className="text-emerald-500/80 flex items-center gap-1 font-mono">
          <Cpu className="w-3 h-3 inline" />
          NVIDIA NIM Microservices Ready
        </span>
      </div>
    </div>
  );
};
