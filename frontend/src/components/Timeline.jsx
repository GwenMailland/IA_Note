import React from 'react';
import NoteCard from './NoteCard';

export default function Timeline({ notes, onGenerateDoc, searchQuery = '', onNoteUpdated, onNoteDeleted, onTagClick, activeTag }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800" />

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="relative pl-12">
            {/* Connector dot */}
            <div className="absolute left-3.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-gray-950" />
            {/* Connector horizontal line */}
            <div className="absolute left-5 top-[1.4rem] h-0.5 w-5 bg-gray-800" />
            <NoteCard
              note={note}
              onGenerateDoc={onGenerateDoc}
              searchQuery={searchQuery}
              onNoteUpdated={onNoteUpdated}
              onNoteDeleted={onNoteDeleted}
              onTagClick={onTagClick}
              activeTag={activeTag}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
