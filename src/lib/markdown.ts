import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface ParsedModelOutput {
  hasReasoning: boolean;
  isReasoningComplete: boolean;
  reasoningText: string;
  responseText: string;
}

/**
 * Extracts <think>...</think> reasoning blocks from DeepSeek R1 or similar models
 */
export function extractReasoningBlocks(rawText: string, extraReasoning?: string): ParsedModelOutput {
  let reasoning = extraReasoning || '';
  let response = rawText;

  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/i;
  const match = thinkRegex.exec(rawText);

  if (match) {
    const matchedThink = match[1];
    const isComplete = rawText.includes('</think>');
    reasoning = reasoning ? `${reasoning}\n${matchedThink}` : matchedThink;
    // Remove the think block from response
    response = rawText.replace(thinkRegex, '').trim();

    return {
      hasReasoning: true,
      isReasoningComplete: isComplete,
      reasoningText: reasoning.trim(),
      responseText: response,
    };
  }

  if (reasoning) {
    return {
      hasReasoning: true,
      isReasoningComplete: true,
      reasoningText: reasoning.trim(),
      responseText: response.trim(),
    };
  }

  return {
    hasReasoning: false,
    isReasoningComplete: true,
    reasoningText: '',
    responseText: response,
  };
}

/**
 * Convert markdown to HTML with enhanced code block wrappers
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  try {
    // Custom renderer for code blocks
    const renderer = new marked.Renderer();

    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
      const language = lang || 'plaintext';
      const escapedCode = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      return `
        <div class="code-block-wrapper my-4 rounded-lg overflow-hidden border border-white/10 bg-[#171717] shadow-lg">
          <div class="flex items-center justify-between px-4 py-2 bg-[#212121] border-b border-white/10 text-xs text-neutral-400 font-mono">
            <span class="flex items-center gap-1.5 font-medium text-emerald-400 uppercase tracking-wider text-[11px]">
              <span class="w-2 h-2 rounded-full bg-emerald-500/80"></span>
              ${language}
            </span>
            <button class="copy-code-btn flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer" data-code="${encodeURIComponent(text)}">
              <svg class="copy-icon w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>Copy code</span>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-neutral-200"><code>${escapedCode}</code></pre>
        </div>
      `;
    };

    return marked(markdown, { renderer }) as string;
  } catch (e) {
    console.error('Markdown parse error:', e);
    return `<p>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }
}
