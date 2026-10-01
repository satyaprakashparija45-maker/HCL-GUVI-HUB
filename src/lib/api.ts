import { AppSettings, ChatMessage, ModelProvider } from '../types';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function fetchServerConfig(): Promise<{
  hasNvidiaServerKey: boolean;
  hasGeminiServerKey: boolean;
  defaultProvider: ModelProvider;
}> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch server config:', err);
  }
  return {
    hasNvidiaServerKey: false,
    hasGeminiServerKey: false,
    defaultProvider: 'nvidia',
  };
}

export async function verifyApiKey(provider: ModelProvider, apiKey: string): Promise<{ valid: boolean; error?: string; modelCount?: number }> {
  try {
    const res = await fetch('/api/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    return await res.json();
  } catch (err: any) {
    return { valid: false, error: err.message || 'Connection failed' };
  }
}

export function streamChatCompletion({
  provider,
  model,
  messages,
  settings,
  abortSignal,
  callbacks,
}: {
  provider: ModelProvider;
  model: string;
  messages: ChatMessage[];
  settings: AppSettings;
  abortSignal?: AbortSignal;
  callbacks: StreamCallbacks;
}): () => void {
  let isAborted = false;

  const activeKey = provider === 'nvidia' ? settings.nvidiaApiKey : settings.geminiApiKey;

  // Prepare clean message payload
  const formattedMessages = messages.map((m) => {
    let content = m.content;
    if (m.attachments && m.attachments.length > 0) {
      const attachmentsText = m.attachments
        .map((a) => `[File Attachment: ${a.name} (${a.type})]\n${a.content}`)
        .join('\n\n');
      content = `${content}\n\n${attachmentsText}`;
    }
    return {
      role: m.role,
      content,
    };
  });

  const fullSystemPrompt = [
    settings.customInstructions || '',
    settings.userContext ? `User Context: ${settings.userContext}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  (async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          provider,
          model,
          messages: formattedMessages,
          apiKey: activeKey,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
          systemPrompt: fullSystemPrompt,
        }),
        signal: abortSignal,
      });

      if (!res.ok) {
        const text = await res.text();
        if (!isAborted) {
          callbacks.onError(`Request failed (${res.status}): ${text.slice(0, 300)}`);
        }
        return;
      }

      if (!res.body) {
        if (!isAborted) callbacks.onError('No response body returned from chat service.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (isAborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Handle lines containing multiple 'data:' or [DONE]
          if (trimmed.includes('[DONE]')) {
            // Check if there is content before [DONE]
            const beforeDone = trimmed.split('[DONE]')[0].trim();
            if (beforeDone && beforeDone.startsWith('data:')) {
              try {
                const subParsed = JSON.parse(beforeDone.replace(/^data:\s*/, ''));
                if (subParsed.content) callbacks.onChunk(subParsed.content);
              } catch {}
            }
            if (!isAborted) callbacks.onDone();
            return;
          }

          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              if (!isAborted) callbacks.onError(parsed.error);
              return;
            }
            if (parsed.reasoning && callbacks.onReasoning) {
              callbacks.onReasoning(parsed.reasoning);
            }
            if (parsed.content) {
              callbacks.onChunk(parsed.content);
            }
          } catch {
            // Partial JSON buffer ignored
          }
        }
      }

      if (!isAborted) callbacks.onDone();
    } catch (err: any) {
      if (err.name === 'AbortError' || isAborted) {
        // User deliberately aborted stream
        callbacks.onDone();
        return;
      }
      callbacks.onError(err.message || 'Stream connection error occurred.');
    }
  })();

  return () => {
    isAborted = true;
  };
}
