import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Spinner from './Spinner';

export default function ReadmeTab({ notebookId }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/notebooks/${notebookId}/readme`)
      .then(r => r.json())
      .then(d => { setContent(d.content || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [notebookId]);

  if (loading) return <div className="py-8"><Spinner /></div>;

  return (
    <div className="card p-6">
      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:text-white prose-headings:font-semibold
        prose-h1:text-xl prose-h2:text-lg prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-1
        prose-p:text-gray-300 prose-p:my-2
        prose-li:text-gray-300 prose-li:my-0.5
        prose-strong:text-white
        prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
        prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
        prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400
        prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
