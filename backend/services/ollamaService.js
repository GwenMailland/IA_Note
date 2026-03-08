const OLLAMA_BASE = 'http://localhost:11434';

async function ping() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false };
    const data = await res.json();
    return { available: true, models: data.models || [] };
  } catch {
    return { available: false, models: [] };
  }
}

async function listModels() {
  const result = await ping();
  if (!result.available) return [];
  return result.models.map(m => m.name);
}

async function chat(prompt, systemPrompt, model) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(300000) // 5 minutes max for large models
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.message?.content || '';
}

module.exports = { ping, listModels, chat };
