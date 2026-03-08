import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ReadmeTab({ notebookId }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/notebooks/${notebookId}/readme`)
      .then(r => r.json())
      .then(d => { setContent(d.content || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [notebookId]);

  if (loading) return <div className="text-center py-8 text-gray-500">...</div>;

  return (
    <div className="card p-6">
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
