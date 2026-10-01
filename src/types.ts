export type ModelProvider = 'nvidia' | 'gemini';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  badge?: string;
  icon?: string;
  contextWindow?: string;
  recommendedFor?: string;
}

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // text content or base64 data url
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string; // Thought process (from DeepSeek R1 or reasoning models)
  timestamp: number;
  modelUsed?: string;
  providerUsed?: ModelProvider;
  isStreaming?: boolean;
  error?: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: ChatMessage[];
  modelId: string;
  provider: ModelProvider;
  systemPrompt?: string;
}

export interface AppSettings {
  // Provider keys
  nvidiaApiKey: string;
  geminiApiKey: string;

  // Active choices
  activeProvider: ModelProvider;
  activeModel: string;

  // Generation parameters
  temperature: number;
  maxTokens: number;
  topP: number;
  stream: boolean;

  // Custom instructions / Persona
  customInstructions: string;
  userContext: string;

  // Appearance / options
  soundEnabled: boolean;
  autoScroll: boolean;
}

export const POPULAR_NVIDIA_MODELS: ModelInfo[] = [
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Llama 3.1 Nemotron 70B',
    provider: 'nvidia',
    description: 'NVIDIA custom-aligned flagship delivering state-of-the-art benchmark accuracy and code quality.',
    badge: 'Recommended',
    contextWindow: '128k',
    recommendedFor: 'Coding, Reasoning, High Accuracy',
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2 (123B)',
    provider: 'nvidia',
    description: 'High performance frontier model with exceptional multilingual comprehension and agentic logic.',
    badge: 'Frontier 123B',
    contextWindow: '128k',
    recommendedFor: 'Multilingual, Code & Complex Tasks',
  },
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    name: 'Nemotron 4 340B',
    provider: 'nvidia',
    description: 'Massive scale 340-billion parameter powerhouse designed for heavy synthetic reasoning.',
    badge: 'Massive Scale',
    contextWindow: '128k',
    recommendedFor: 'Complex Research & System Architecture',
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    provider: 'nvidia',
    description: 'High-capability Meta model with multimodal and advanced text reasoning.',
    badge: 'High IQ',
    contextWindow: '128k',
    recommendedFor: 'Deep Analysis & Vision',
  },
  {
    id: 'deepseek-ai/deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'nvidia',
    description: 'High-speed reasoning model with optimized latency on NVIDIA TensorRT-LLM.',
    badge: 'Fast Reasoning',
    contextWindow: '64k',
    recommendedFor: 'Logic, Math & Fast Answers',
  },
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    provider: 'nvidia',
    description: 'Ultra-fast and lightweight model for near-instant responses.',
    badge: 'Ultra Fast',
    contextWindow: '128k',
    recommendedFor: 'Quick Queries & Chat',
  },
];

export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Next-gen balanced model built for fast, high-frequency text and multimodal requests.',
    badge: 'Lightning Fast',
    contextWindow: '1M',
    recommendedFor: 'Daily Tasks & Fast Answers',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    description: 'Advanced reasoning and frontier intelligence for high-complexity coding and STEM.',
    badge: 'STEM & Logic',
    contextWindow: '2M',
    recommendedFor: 'Complex Engineering & Deep Analysis',
  },
];

export const ALL_MODELS: ModelInfo[] = [...POPULAR_NVIDIA_MODELS, ...GEMINI_MODELS];
