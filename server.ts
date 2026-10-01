import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to get active keys
function resolveApiKey(provider: string, clientKey?: string): string | undefined {
  if (clientKey && clientKey.trim()) return clientKey.trim();
  if (provider === 'nvidia') {
    return process.env.NVIDIA_API_KEY;
  }
  if (provider === 'gemini') {
    return process.env.GEMINI_API_KEY;
  }
  return undefined;
}

// Config & Health endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    hasNvidiaServerKey: !!process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...',
    hasGeminiServerKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    defaultProvider: (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'nvapi-...') ? 'nvidia' : 'gemini',
    nvidiaBaseUrl: 'https://integrate.api.nvidia.com/v1',
  });
});

// Key verification endpoint
app.post('/api/verify-key', async (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;
  const key = resolveApiKey(provider, apiKey);

  if (!key) {
    return res.status(400).json({ valid: false, error: 'No API key provided.' });
  }

  if (provider === 'nvidia') {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({
          valid: true,
          modelCount: Array.isArray(data.data) ? data.data.length : 0,
        });
      } else {
        const errText = await response.text();
        return res.status(response.status).json({
          valid: false,
          error: `NVIDIA API responded with ${response.status}: ${errText.slice(0, 200)}`,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message || 'Connection error to NVIDIA API' });
    }
  }

  if (provider === 'gemini') {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });
      return res.json({ valid: true });
    } catch (err: any) {
      return res.status(400).json({ valid: false, error: err.message || 'Gemini key validation failed' });
    }
  }

  return res.json({ valid: true });
});

// Chat completion streaming endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    provider = 'nvidia',
    model,
    messages = [],
    apiKey,
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.95,
    systemPrompt,
  } = req.body;

  const resolvedKey = resolveApiKey(provider, apiKey);

  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const sendError = (errorMessage: string) => {
    sendSSE({ error: errorMessage });
    res.write('data: [DONE]\n\n');
    res.end();
  };

  // 1. Handle NVIDIA NIM API
  if (provider === 'nvidia') {
    if (!resolvedKey) {
      return sendError(
        'NVIDIA API Key is missing. Please add your NVIDIA API key in Settings (or configure NVIDIA_API_KEY). You can get a free key with free credits at https://build.nvidia.com.'
      );
    }

    const selectedModel = model || 'nvidia/llama-3.1-nemotron-70b-instruct';

    // Build OpenAI-compatible messages format
    const formattedMessages: Array<{ role: string; content: string }> = [];

    if (systemPrompt && systemPrompt.trim()) {
      formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    try {
      const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resolvedKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: formattedMessages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          top_p: typeof topP === 'number' ? topP : 1.0,
          max_tokens: typeof maxTokens === 'number' ? maxTokens : 2048,
          stream: true,
        }),
      });

      if (!nvidiaResponse.ok) {
        const errorText = await nvidiaResponse.text();
        let parsedMessage = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedMessage = parsed.message || parsed.error?.message || errorText;
        } catch {
          // keep original
        }
        return sendError(`NVIDIA API Error (${nvidiaResponse.status}): ${parsedMessage}`);
      }

      if (!nvidiaResponse.body) {
        return sendError('NVIDIA API returned an empty response body.');
      }

      // Stream SSE from NVIDIA response to client
      const reader = nvidiaResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            res.write('\ndata: [DONE]\n\n');
            res.end();
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;
            const content = delta?.content || '';
            const reasoning = delta?.reasoning_content || '';

            if (content || reasoning) {
              sendSSE({
                content,
                reasoning,
                model: selectedModel,
              });
            }
          } catch {
            // Ignore parse errors on partial frames
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    } catch (err: any) {
      console.error('NVIDIA fetch error:', err);
      return sendError(`Error connecting to NVIDIA NIM API: ${err.message || String(err)}`);
    }
  }

  // 2. Handle Google Gemini
  if (provider === 'gemini') {
    if (!resolvedKey) {
      return sendError(
        'Gemini API Key is missing. Please provide a key in Settings or set GEMINI_API_KEY in your environment.'
      );
    }

    const selectedModel = model || 'gemini-3.8-flash';

    try {
      const ai = new GoogleGenAI({ apiKey: resolvedKey });

      // Transform messages for Gemini
      const geminiContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const streamResult = await ai.models.generateContentStream({
        model: selectedModel,
        contents: geminiContents,
        config: {
          systemInstruction: systemPrompt || undefined,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        },
      });

      for await (const chunk of streamResult) {
        const text = chunk.text;
        if (text) {
          sendSSE({ content: text, model: selectedModel });
        }
      }

      res.write('\ndata: [DONE]\n\n');
      res.end();
      return;
    } catch (err: any) {
      console.error('Gemini error:', err);
      return sendError(`Gemini API Error: ${err.message || String(err)}`);
    }
  }

  return sendError(`Unsupported provider: ${provider}`);
});

// Setup Vite in Dev or Static in Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
