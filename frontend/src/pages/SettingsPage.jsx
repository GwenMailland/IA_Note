import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Spinner from '../components/Spinner';

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

const CLAUDE_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6'
];

export default function SettingsPage() {
  const { t, lang, setLang } = useTranslation();
  const [config, setConfig] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [groqTest, setGroqTest] = useState('');
  const [claudeTest, setClaudeTest] = useState('');
  const [exportDir, setExportDir] = useState('~/Downloads');
  const [exportDirResolved, setExportDirResolved] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfig(); checkOllama(); loadExportDir(); }, []);

  async function loadConfig() {
    try {
      const r = await fetch('http://localhost:3001/api/config');
      const cfg = await r.json();
      setConfig(cfg);
      setGroqApiKey(cfg.ai?.groq?.apiKey || '');
      setClaudeApiKey(cfg.ai?.claude?.apiKey || '');
      if (cfg.exportDir) setExportDir(cfg.exportDir);
    } catch (e) { console.error(e); }
  }

  async function loadExportDir() {
    try {
      const r = await fetch('http://localhost:3001/api/export/dir');
      const d = await r.json();
      setExportDirResolved(d.resolved || '');
    } catch (e) {}
  }

  async function checkOllama() {
    try {
      const r = await fetch('http://localhost:3001/api/ai/ollama/status');
      const data = await r.json();
      setOllamaStatus(data.available);
      if (data.available) {
        const mr = await fetch('http://localhost:3001/api/ai/ollama/models');
        const md = await mr.json();
        setOllamaModels(md.models || []);
      }
    } catch { setOllamaStatus(false); }
  }

  function updateConfig(path, value) {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...config,
        exportDir,
        ai: {
          ...config.ai,
          groq: { ...config.ai.groq, apiKey: groqApiKey },
          claude: { ...config.ai.claude, apiKey: claudeApiKey }
        }
      };
      await fetch('http://localhost:3001/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function testGroq() {
    setGroqTest('testing');
    try {
      const r = await fetch('http://localhost:3001/api/ai/groq/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: groqApiKey })
      });
      const d = await r.json();
      setGroqTest(d.ok ? 'ok' : 'fail');
    } catch { setGroqTest('fail'); }
    setTimeout(() => setGroqTest(''), 3000);
  }

  async function testClaude() {
    setClaudeTest('testing');
    try {
      const r = await fetch('http://localhost:3001/api/ai/claude/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: claudeApiKey })
      });
      const d = await r.json();
      setClaudeTest(d.ok ? 'ok' : 'fail');
    } catch { setClaudeTest('fail'); }
    setTimeout(() => setClaudeTest(''), 3000);
  }

  if (!config) return <div className="py-16"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h1>

      {/* Language */}
      <section className="card p-5 mb-4">
        <h2 className="font-semibold text-white mb-3">{t('settings.language')}</h2>
        <div className="flex gap-3">
          {['fr', 'en'].map(l => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lang"
                value={l}
                checked={lang === l}
                onChange={() => { setLang(l); updateConfig('language', l); }}
                className="accent-indigo-500"
              />
              <span className="text-sm text-gray-300">
                {l === 'fr' ? t('settings.french') : t('settings.english')}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Active provider */}
      <section className="card p-5 mb-4">
        <h2 className="font-semibold text-white mb-3">{t('settings.activeProvider')}</h2>
        <div className="flex gap-3">
          {['ollama', 'groq', 'claude'].map(p => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value={p}
                checked={config.ai?.provider === p}
                onChange={() => updateConfig('ai.provider', p)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-gray-300">{t(`providers.${p}`)}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Ollama */}
      <section className="card p-5 mb-4">
        <h2 className="font-semibold text-white mb-3">{t('settings.ollama.title')}</h2>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-400">{t('settings.ollama.status')} :</span>
          {ollamaStatus === null ? (
            <span className="badge badge-gray"><Spinner size="sm" /></span>
          ) : ollamaStatus ? (
            <span className="badge badge-green">{t('settings.ollama.available')}</span>
          ) : (
            <span className="badge badge-yellow">{t('settings.ollama.unavailable')}</span>
          )}
        </div>
        {ollamaStatus === false && (
          <p className="text-xs text-yellow-400 mb-3 font-mono bg-yellow-950/30 px-3 py-2 rounded">
            {t('settings.ollama.helpText')}
          </p>
        )}
        {ollamaStatus && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('settings.ollama.model')}</label>
            {ollamaModels.length === 0 ? (
              <p className="text-xs text-gray-600">{t('settings.ollama.noModels')}</p>
            ) : (
              <select
                value={config.ai?.ollama?.model || ''}
                onChange={e => updateConfig('ai.ollama.model', e.target.value)}
                className="input text-sm"
              >
                {ollamaModels.map(m => (
                  <option key={m} value={m}>
                    {m} {m === 'qwen2.5:72b' ? `(${t('settings.ollama.recommended')})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </section>

      {/* Groq */}
      <section className="card p-5 mb-4">
        <h2 className="font-semibold text-white mb-3">{t('settings.groq.title')}</h2>
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">{t('settings.groq.apiKey')}</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={groqApiKey}
              onChange={e => setGroqApiKey(e.target.value)}
              placeholder={t('settings.groq.apiKeyPlaceholder')}
              className="input flex-1 text-sm"
            />
            <button onClick={testGroq} disabled={groqTest === 'testing'} className="btn btn-secondary text-sm">
              {groqTest === 'testing' ? t('settings.groq.testing')
                : groqTest === 'ok' ? t('settings.groq.testOk')
                : groqTest === 'fail' ? t('settings.groq.testFail')
                : t('settings.groq.test')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('settings.groq.model')}</label>
          <select
            value={config.ai?.groq?.model || GROQ_MODELS[0]}
            onChange={e => updateConfig('ai.groq.model', e.target.value)}
            className="input text-sm"
          >
            {GROQ_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </section>

      {/* Claude */}
      <section className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-3">{t('settings.claude.title')}</h2>
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">{t('settings.claude.apiKey')}</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={claudeApiKey}
              onChange={e => setClaudeApiKey(e.target.value)}
              placeholder={t('settings.claude.apiKeyPlaceholder')}
              className="input flex-1 text-sm"
            />
            <button onClick={testClaude} disabled={claudeTest === 'testing'} className="btn btn-secondary text-sm">
              {claudeTest === 'testing' ? t('settings.claude.testing')
                : claudeTest === 'ok' ? t('settings.claude.testOk')
                : claudeTest === 'fail' ? t('settings.claude.testFail')
                : t('settings.claude.test')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('settings.claude.model')}</label>
          <select
            value={config.ai?.claude?.model || CLAUDE_MODELS[0]}
            onChange={e => updateConfig('ai.claude.model', e.target.value)}
            className="input text-sm"
          >
            {CLAUDE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </section>

      {/* Export destination */}
      <section className="card p-5 mb-6">
        <h2 className="font-semibold mb-1" style={{ color: 'var(--nf-text)' }}>{t('settings.exportDir.title')}</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--nf-text-muted)' }}>{t('settings.exportDir.description')}</p>
        <input
          type="text"
          value={exportDir}
          onChange={e => setExportDir(e.target.value)}
          placeholder="~/Downloads"
          className="input text-sm w-full font-mono"
        />
        {exportDirResolved && (
          <p className="text-xs mt-1.5 font-mono" style={{ color: 'var(--nf-text-faint)' }}>
            → {exportDirResolved}
          </p>
        )}
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary px-6"
      >
        {saved ? t('settings.saved') : saving ? '…' : t('settings.save')}
      </button>
    </div>
  );
}
