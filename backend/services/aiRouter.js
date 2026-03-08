const storageService = require('./storageService');
const ollamaService = require('./ollamaService');
const groqService = require('./groqService');
const claudeService = require('./claudeService');

/**
 * Main entry point for all AI calls.
 * @param {string} prompt
 * @param {string} systemPrompt
 * @param {object} options - { provider?: string } to override config
 * @returns {{ content: string, provider: string, model: string }}
 */
async function callAI(prompt, systemPrompt = '', options = {}) {
  const config = storageService.getConfig();
  const provider = options.provider || config.ai.provider || 'ollama';

  switch (provider) {
    case 'ollama': {
      const model = config.ai.ollama?.model || 'qwen2.5:72b';
      const content = await ollamaService.chat(prompt, systemPrompt, model);
      return { content, provider: 'ollama', model };
    }
    case 'groq': {
      const model = config.ai.groq?.model || 'llama-3.3-70b-versatile';
      const apiKey = config.ai.groq?.apiKey || '';
      const content = await groqService.chat(prompt, systemPrompt, model, apiKey);
      return { content, provider: 'groq', model };
    }
    case 'claude': {
      const model = config.ai.claude?.model || 'claude-haiku-4-5-20251001';
      const apiKey = config.ai.claude?.apiKey || '';
      const content = await claudeService.chat(prompt, systemPrompt, model, apiKey);
      return { content, provider: 'claude', model };
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

module.exports = { callAI };
