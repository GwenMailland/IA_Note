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
  let lastError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // keep trailing incomplete chunk

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;

      let data;
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        continue; // skip malformed event
      }

      if (data.error) {
        lastError = new Error(data.error);
        throw lastError;
      }
      if (data.step === 'done') return data.result;

      onProgress(data);
    }
  }

  // Process any remaining buffered data
  if (buffer.trim().startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.trim().slice(6));
      if (data.error) throw new Error(data.error);
      if (data.step === 'done') return data.result;
    } catch (e) {
      if (e.message !== 'Unexpected end of JSON input') throw e;
    }
  }

  throw lastError || new Error('La connexion au serveur a été interrompue');
}
