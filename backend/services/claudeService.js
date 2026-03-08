const Anthropic = require('@anthropic-ai/sdk');

async function chat(prompt, systemPrompt, model, apiKey) {
  if (!apiKey) throw new Error('Claude API key not configured');

  const client = new Anthropic({ apiKey });

  const messages = [{ role: 'user', content: prompt }];

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt || undefined,
    messages
  });

  return response.content[0]?.text || '';
}

async function testKey(apiKey) {
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return true;
  } catch {
    return false;
  }
}

module.exports = { chat, testKey };
