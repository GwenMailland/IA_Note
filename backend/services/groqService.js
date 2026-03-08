const OpenAI = require('openai');

async function chat(prompt, systemPrompt, model, apiKey) {
  if (!apiKey) throw new Error('Groq API key not configured');

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const completion = await client.chat.completions.create({ model, messages });
  return completion.choices[0]?.message?.content || '';
}

async function testKey(apiKey) {
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

module.exports = { chat, testKey };
