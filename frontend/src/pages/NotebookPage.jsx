import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import NoteForm from '../components/NoteForm';
import Timeline from '../components/Timeline';
import DocumentsTab from '../components/DocumentsTab';
import ReadmeTab from '../components/ReadmeTab';
import NotebookChat from '../components/NotebookChat';
import WeeklySummaryBanner from '../components/WeeklySummaryBanner';
import EditContextModal from '../components/EditContextModal';
import GenerateDocModal from '../components/GenerateDocModal';
import Spinner from '../components/Spinner';

const TABS = ['timeline', 'documents', 'readme', 'chat'];

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
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);

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

  function handleNoteUpdated(updated) {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  }

  function handleNoteDeleted(noteId) {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }

  function handleGenerateDoc(note = null) {
    setGenerateDocNote(note);
    setShowGenerateDoc(true);
  }

  function handleWeeklySummaryGenerated(slug) {
    setDocsKey(k => k + 1);
    setTab('documents');
    // Refresh notebook to get updated lastWeeklySummary
    fetch(`http://localhost:3001/api/notebooks/${id}`)
      .then(r => r.json())
      .then(setNotebook)
      .catch(() => {});
  }

  const sortedNotes = newestFirst ? notes : [...notes].reverse();
  const filteredNotes = sortedNotes.filter(n => {
    const matchesSearch = !search.trim() ||
      n.noteContext?.toLowerCase().includes(search.toLowerCase()) ||
      n.structuredContent?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || n.meta?.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(notes.flatMap(n => n.meta?.tags || []))].sort();

  // Weekly summary banner logic
  const notesThisWeek = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return notes.filter(n => new Date(n.createdAt) >= cutoff).length;
  }, [notes]);

  const showWeeklyBanner = useMemo(() => {
    if (!notebook || notesThisWeek === 0) return false;
    if (!notebook.lastWeeklySummary) return true;
    const daysSince = (Date.now() - new Date(notebook.lastWeeklySummary)) / (1000 * 60 * 60 * 24);
    return daysSince >= 6;
  }, [notebook, notesThisWeek]);

  if (loading) return <div className="py-16"><Spinner size="lg" /></div>;
  if (!notebook) return <div className="text-center py-16 text-red-400">Notebook not found</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--nf-text-faint)' }}>
        <Link to="/" className="hover:text-gray-300 transition-colors" style={{ color: 'var(--nf-text-muted)' }}>
          {t('nav.notebooks')}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--nf-text-sec)' }} className="truncate">{notebook.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--nf-text)', letterSpacing: '-0.02em' }}>
              {notebook.title}
            </h1>
            {notebook.context && (
              <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--nf-text-faint)' }}>
                {notebook.context}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowEditContext(true)} className="btn btn-ghost text-xs">
              {t('notebook.editContext')}
            </button>
            <button onClick={() => handleGenerateDoc(null)} className="btn btn-secondary text-xs">
              + {t('noteCard.generateDoc')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b" style={{ borderColor: 'var(--nf-border)' }}>
          {TABS.map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === tabKey
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent hover:text-gray-300'
              }`}
              style={tab !== tabKey ? { color: 'var(--nf-text-faint)' } : {}}
            >
              {tabKey === 'chat' ? (
                <span className="flex items-center gap-1.5">
                  <span style={{ fontSize: '0.7em' }}>◆</span>
                  {t('notebook.chat')}
                </span>
              ) : t(`notebook.${tabKey}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'timeline' && (
        <div>
          <NoteForm notebookId={id} onNoteAdded={handleNoteAdded} />

          {showWeeklyBanner && (
            <WeeklySummaryBanner
              notebookId={id}
              notesThisWeek={notesThisWeek}
              onGenerated={handleWeeklySummaryGenerated}
            />
          )}

          <div className="flex items-center gap-3 mt-4 mb-2">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('notebook.search')}
              className="input text-sm py-1.5 flex-1"
            />
            <span className="text-sm shrink-0" style={{ color: 'var(--nf-text-faint)' }}>
              {filteredNotes.length} {filteredNotes.length === 1 ? t('home.note') : t('home.notes')}
            </span>
            <button onClick={() => setNewestFirst(v => !v)} className="btn btn-ghost text-xs shrink-0">
              {newestFirst ? t('notebook.newestFirst') : t('notebook.oldestFirst')}
            </button>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="text-xs px-2 py-0.5 rounded-full transition-all"
                  style={activeTag === tag ? {
                    backgroundColor: 'var(--nf-accent-bg)',
                    color: 'var(--nf-accent-text)',
                  } : {
                    backgroundColor: 'var(--nf-elevated)',
                    color: 'var(--nf-text-muted)',
                    border: '1px solid var(--nf-border)',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {notes.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--nf-text-faint)' }}>{t('notebook.noNotes')}</p>
          ) : filteredNotes.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--nf-text-faint)' }}>{t('notebook.noResults')}</p>
          ) : (
            <Timeline
              notes={filteredNotes}
              onGenerateDoc={handleGenerateDoc}
              searchQuery={search}
              onNoteUpdated={handleNoteUpdated}
              onNoteDeleted={handleNoteDeleted}
              onTagClick={tag => setActiveTag(activeTag === tag ? null : tag)}
              activeTag={activeTag}
            />
          )}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentsTab key={docsKey} notebookId={id} onGenerate={() => handleGenerateDoc(null)} />
      )}

      {tab === 'readme' && (
        <ReadmeTab notebookId={id} />
      )}

      {tab === 'chat' && (
        <div className="card p-6">
          <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--nf-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--nf-text)' }}>
              {t('chat.title')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--nf-text-muted)' }}>
              {t('chat.subtitle')}
            </p>
          </div>
          <NotebookChat notebookId={id} />
        </div>
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
