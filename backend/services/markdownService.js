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
    // Try direct parse first, then extract JSON block
    const trimmed = metaStr.trim();
    if (trimmed.startsWith('{')) {
      meta = JSON.parse(trimmed);
    } else {
      const start = metaStr.indexOf('{');
      const end = metaStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        meta = JSON.parse(metaStr.slice(start, end + 1));
      }
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
