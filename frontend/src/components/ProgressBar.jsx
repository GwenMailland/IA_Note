import React from 'react';

export default function ProgressBar({ progress, label }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span className="truncate pr-2">{label}</span>
        <span className="shrink-0">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: 'var(--nf-accent)' }}
        />
      </div>
    </div>
  );
}
