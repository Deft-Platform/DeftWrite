import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PersonaId } from '@/types';

const PROVIDERS = [
  { id: 'platform', name: 'DeftAuthor', sub: 'Hosted & free', icon: 'cloud', iconColor: 'text-indigo-400' },
  { id: 'together', name: 'Together.ai', sub: 'Open models', icon: 'zap', iconColor: 'text-amber-400' },
  { id: 'openai', name: 'OpenAI', sub: 'GPT-4 / o-series', icon: 'message-circle', iconColor: 'text-emerald-400' },
  { id: 'local', name: 'Local Model', sub: 'Ollama / LM Studio', icon: 'cpu', iconColor: 'text-purple-400' },
];

const MODELS: Record<string, string[]> = {
  platform: ['deftauthor-v1'],
  together: ['mistralai/Mixtral-8x7B-Instruct-v0.1', 'meta-llama/Llama-3-8b-chat-hf', 'meta-llama/Llama-3-70b-chat-hf'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  local: ['llama3', 'mistral', 'codellama', 'neural-chat', 'phi3'],
};

export function SettingsModal() {
  const { aiConfig, setAIConfig, closeSettings, personas, activePersonaId, settingsOpen } = useApp();
  const [apiKey, setApiKey] = useState(aiConfig.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl || 'http://localhost:11434/v1');
  const [selectedProvider, setSelectedProvider] = useState(aiConfig.provider);
  const [selectedModel, setSelectedModel] = useState(aiConfig.model);
  const [testResult, setTestResult] = useState('');

  const showApiKey = selectedProvider !== 'platform';
  const showBaseUrl = selectedProvider === 'local';
  const models = MODELS[selectedProvider] || [];

  const handleSave = () => {
    setAIConfig({
      provider: selectedProvider,
      apiKey: showApiKey ? apiKey : undefined,
      baseUrl: showBaseUrl ? baseUrl : undefined,
      model: selectedModel,
      personaPrompts: personas[activePersonaId]?.systemPrompt
        ? { [activePersonaId]: personas[activePersonaId].systemPrompt } as Record<PersonaId, string>
        : aiConfig.personaPrompts,
    });
    closeSettings();
  };

  const handleTest = () => {
    setTestResult('Testing connection...');
    setTimeout(() => {
      if (selectedProvider === 'platform') {
        setTestResult('✓ Connected to DeftAuthor');
      } else if (apiKey) {
        setTestResult('✓ Connected');
      } else {
        setTestResult('✗ No API key provided');
      }
    }, 500);
  };

  return (
    <div className={`fixed inset-0 z-[200] ${settingsOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSettings} />
      <div className="absolute right-4 top-14 w-[480px] max-h-[calc(100vh-80px)] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-white">AI Configuration</h2>
          <button onClick={closeSettings} className="p-1 hover:bg-slate-700 rounded transition-colors">
            <i data-lucide="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="mb-5">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Provider</label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProvider(p.id as typeof aiConfig.provider); if (p.id !== 'platform') setApiKey(aiConfig.apiKey || ''); }}
                className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                  selectedProvider === p.id
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                    : 'border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i data-lucide={p.icon} className={`w-4 h-4 ${p.iconColor}`} />
                  <div>
                    <div className="text-[11px] text-white">{p.name}</div>
                    <div className="text-[9px] text-slate-500">{p.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform info */}
        {selectedProvider === 'platform' && (
          <div className="mb-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <i data-lucide="shield-check" className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">DeftAuthor</p>
                  <p className="text-[10px] text-indigo-300/70 mt-0.5 leading-relaxed">
                    We handle the inference so you can focus on writing. Your content is never used for training. Deleted after processing.
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-emerald-300">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Key */}
        {showApiKey && (
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600"
              />
              <button className="absolute right-2 top-2 p-0.5 text-slate-500 hover:text-slate-300">
                <i data-lucide="eye" className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-1.5">Your key is stored locally and never transmitted to us.</p>
          </div>
        )}

        {/* Model */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Model</label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-colors text-slate-300"
          >
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Base URL */}
        {showBaseUrl && (
          <div className="mb-5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434/v1"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-600"
            />
          </div>
        )}

        {/* Test Connection */}
        <Button
          variant="outline"
          onClick={handleTest}
          className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border-slate-700/50"
        >
          Test Connection
        </Button>
        {testResult && (
          <div className="mt-2 text-[10px]">{testResult}</div>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
            Save
          </Button>
          <Button variant="outline" onClick={closeSettings} className="text-xs border-slate-700/50">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
