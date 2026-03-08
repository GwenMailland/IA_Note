import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import NoteForm from '../components/NoteForm';
import Timeline from '../components/Timeline';
import DocumentsTab from '../components/DocumentsTab';
import ReadmeTab from '../components/ReadmeTab';
import EditContextModal from '../components/EditContextModal';
import GenerateDocModal from '../components/GenerateDocModal';

const TABS = ['timeline', 'documents', 'readme'];

export default function NotebookPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [notebook, setNotebook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [showEditContext, setShowEditContext] = useState(false);
  const [showGenerateDoc, setShowGenerateDoc] = useState(false);
  const [generateDocNote, setGenerateDocNote] = useState(null);
  const [newestFirst, setNewestFirst] = useState(true);
  const [docsKey, setDocsKey] = useState(0);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [nbRes, notesRes] = await Promise.all([
        fetch(`http://localhost:3001/api/notebooks/${id}`),
        fetch(`http://localhost:3001/api/notebooks/${id}/notes`)
      ]);
      setNotebook(await nbRes.json());
      setNotes(await notesRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleNoteAdded(note) {
    setNotes(prev => [note, ...prev]);
  }

  function handleGenerateDoc(note = null) {
    setGenerateDocNote(note);
    setShowGenerateDoc(true);
  }

  const sortedNotes = newestFirst ? notes : [...notes].reverse();

  if (loading) return <div className="text-center py-16 text-gray-500">...</div>;
  if (!notebook) return <div className="text-center py-16 text-red-400">Notebook not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{notebook.title}</h1>
            {notebook.context && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notebook.context}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowEditContext(true)}
              className="btn btn-ghost text-xs"
            >
              {t('notebook.editContext')}
            </button>
            <button
              onClick={() => handleGenerateDoc(null)}
              className="btn btn-secondary text-xs"
            >
              + {t('noteCard.generateDoc')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-gray-800">
          {TABS.map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === tabKey
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t(`notebook.${tabKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'timeline' && (
        <div>
          <NoteForm notebookId={id} onNoteAdded={handleNoteAdded} />
          <div className="flex items-center justify-between mt-6 mb-3">
            <h2 className="text-sm font-medium text-gray-400">
              {notes.length} {notes.length === 1 ? t('home.note') : t('home.notes')}
            </h2>
            <button
              onClick={() => setNewestFirst(v => !v)}
              className="btn btn-ghost text-xs"
            >
              {newestFirst ? t('notebook.newestFirst') : t('notebook.oldestFirst')}
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-center py-8 text-gray-600">{t('notebook.noNotes')}</p>
          ) : (
            <Timeline notes={sortedNotes} onGenerateDoc={handleGenerateDoc} />
          )}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentsTab key={docsKey} notebookId={id} onGenerate={() => handleGenerateDoc(null)} />
      )}

      {tab === 'readme' && (
        <ReadmeTab notebookId={id} />
      )}

      {/* Modals */}
      {showEditContext && (
        <EditContextModal
          notebook={notebook}
          onSaved={(updated) => { setNotebook(updated); setShowEditContext(false); }}
          onClose={() => setShowEditContext(false)}
        />
      )}

      {showGenerateDoc && (
        <GenerateDocModal
          notebookId={id}
          note={generateDocNote}
          onGenerated={() => { setShowGenerateDoc(false); setDocsKey(k => k + 1); setTab('documents'); }}
          onClose={() => setShowGenerateDoc(false)}
        />
      )}
    </div>
  );
}
