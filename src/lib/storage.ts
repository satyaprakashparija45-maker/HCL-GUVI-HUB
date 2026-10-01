import { AppSettings, Conversation } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'omnichat_settings_v1',
  CONVERSATIONS: 'omnichat_conversations_v1',
  ACTIVE_CHAT_ID: 'omnichat_active_chat_id_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  nvidiaApiKey: '',
  geminiApiKey: '',
  activeProvider: 'nvidia',
  activeModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.95,
  stream: true,
  customInstructions: 'Be direct, clear, and write production-ready code with clean explanations when needed.',
  userContext: '',
  soundEnabled: true,
  autoScroll: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load conversations:', e);
  }
  return [];
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
  } catch {
    return null;
  }
}

export function saveActiveChatId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
    }
  } catch {
    // ignore
  }
}
