/**
 * Parses the AI response which may contain ---AI_META--- separator.
 * Returns { structured: string, meta: object }
 */
function parseAIResponse(rawContent) {
  const separator = '---AI_META---';
  const idx = rawContent.indexOf(separator);

  if (idx === -1) {
    return { structured: rawContent.trim(), meta: {} };
  }

  const structured = rawContent.substring(0, idx).trim();
  const metaStr = rawContent.substring(idx + separator.length).trim();

  let meta = {};
  try {
    // Extract JSON from possible surrounding text
    const jsonMatch = metaStr.match(/\{[^}]*\}/);
    if (jsonMatch) {
      meta = JSON.parse(jsonMatch[0]);
    }
  } catch {
    meta = {};
  }

  return { structured, meta };
}

/**
 * Generates a URL-safe slug from a title.
 * max 50 chars, lowercase, hyphens, no accents.
 */
function slugify(title) {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  return slug || `document-${Date.now()}`;
}

module.exports = { parseAIResponse, slugify };
