/**
 * Streams a POST request via SSE (text/event-stream).
 * Calls onProgress({ step, progress, label }) for each event.
 * Resolves with the final result or rejects on error.
 */
export async function ssePost(url, body, onProgress) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // keep trailing incomplete chunk

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      const data = JSON.parse(line.slice(6));

      if (data.error) throw new Error(data.error);
      if (data.step === 'done') return data.result;

      onProgress(data);
    }
  }

  throw new Error('Stream ended without result');
}
