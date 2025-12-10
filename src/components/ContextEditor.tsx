import { useState, useEffect } from 'react';
import { 
  PersonalContext, 
  emptyContext, 
  contextToMarkdown,
  contextToEventContent,
  parseContextFromEvent
} from './PersonalContext';

type EditorTab = 'identity' | 'human_design' | 'communication' | 'focus' | 'llm' | 'preview';
type Visibility = 'public' | 'private';

interface Props {
  initialContext?: PersonalContext;
  onSave?: (context: PersonalContext) => void;
  onPublish?: (context: PersonalContext, visibility: Visibility) => void;
}

export default function ContextEditor({ initialContext, onSave, onPublish }: Props) {
  const [context, setContext] = useState<PersonalContext>(initialContext || emptyContext);
  const [activeTab, setActiveTab] = useState<EditorTab>('identity');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper für Array-Felder
  const updateArrayField = (
    section: keyof PersonalContext,
    field: string,
    value: string
  ) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    setContext(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: items
      }
    }));
  };

  // Helper für String-Felder
  const updateField = (
    section: keyof PersonalContext,
    field: string,
    value: string
  ) => {
    setContext(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  // Markdown kopieren
  const handleCopyMarkdown = async () => {
    const md = contextToMarkdown(context);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Als Datei herunterladen
  const handleDownload = () => {
    const md = contextToMarkdown(context);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontext-${context.identity.name || 'mein'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Publishen
  const handlePublish = async () => {
    if (onPublish) {
      setIsSaving(true);
      await onPublish(context, visibility);
      setIsSaving(false);
    }
  };

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'identity', label: 'Identität' },
    { id: 'human_design', label: 'Human Design' },
    { id: 'communication', label: 'Kommunikation' },
    { id: 'focus', label: 'Fokus' },
    { id: 'llm', label: 'KI-Anweisungen' },
    { id: 'preview', label: 'Vorschau' },
  ];

  return (
    <div className="context-editor">
      <div className="editor-header">
        <h1>Dein Kontext</h1>
        <p className="editor-intro">
          Definiere, wer du bist und wie du arbeitest. 
          Diesen Kontext kannst du mit KIs teilen.
        </p>
      </div>

      {/* Tabs */}
      <div className="editor-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="editor-content">
        
        {/* IDENTITÄT */}
        {activeTab === 'identity' && (
          <div className="tab-panel">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={context.identity.name}
                onChange={e => updateField('identity', 'name', e.target.value)}
                placeholder="Dein Name oder Pseudonym"
              />
            </div>

            <div className="form-group">
              <label>Rolle / Beruf</label>
              <input
                type="text"
                value={context.identity.role || ''}
                onChange={e => updateField('identity', 'role', e.target.value)}
                placeholder="z.B. System-Builder, Designer, Autor"
              />
            </div>

            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                value={context.identity.location || ''}
                onChange={e => updateField('identity', 'location', e.target.value)}
                placeholder="z.B. Berlin, Remote"
              />
            </div>

            <div className="form-group">
              <label>Sprachen (kommagetrennt)</label>
              <input
                type="text"
                value={context.identity.languages?.join(', ') || ''}
                onChange={e => updateArrayField('identity', 'languages', e.target.value)}
                placeholder="z.B. de, en"
              />
            </div>
          </div>
        )}

        {/* HUMAN DESIGN */}
        {activeTab === 'human_design' && (
          <div className="tab-panel">
            <p className="tab-hint">
              Optional. Hilft KIs und anderen, deine Mechanik zu verstehen.
            </p>

            <div className="form-group">
              <label>Typ</label>
              <select
                value={context.human_design?.type || ''}
                onChange={e => updateField('human_design', 'type', e.target.value)}
              >
                <option value="">— Auswählen —</option>
                <option value="Generator">Generator</option>
                <option value="Manifesting Generator">Manifestierender Generator</option>
                <option value="Projector">Projektor</option>
                <option value="Manifestor">Manifestor</option>
                <option value="Reflector">Reflektor</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Profil</label>
                <input
                  type="text"
                  value={context.human_design?.profile || ''}
                  onChange={e => updateField('human_design', 'profile', e.target.value)}
                  placeholder="z.B. 1/3, 4/6"
                />
              </div>

              <div className="form-group">
                <label>Autorität</label>
                <input
                  type="text"
                  value={context.human_design?.authority || ''}
                  onChange={e => updateField('human_design', 'authority', e.target.value)}
                  placeholder="z.B. Sakral, Emotional"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Strategie</label>
              <input
                type="text"
                value={context.human_design?.strategy || ''}
                onChange={e => updateField('human_design', 'strategy', e.target.value)}
                placeholder="z.B. Warten auf Reaktion"
              />
            </div>

            <div className="form-group">
              <label>Nicht-Selbst-Thema</label>
              <input
                type="text"
                value={context.human_design?.not_self || ''}
                onChange={e => updateField('human_design', 'not_self', e.target.value)}
                placeholder="z.B. Frustration, Bitterkeit"
              />
            </div>

            <div className="form-group">
              <label>Definition</label>
              <input
                type="text"
                value={context.human_design?.definition || ''}
                onChange={e => updateField('human_design', 'definition', e.target.value)}
                placeholder="z.B. Single, Split, Triple Split"
              />
            </div>
          </div>
        )}

        {/* KOMMUNIKATION */}
        {activeTab === 'communication' && (
          <div className="tab-panel">
            <div className="form-group">
              <label>Ton</label>
              <input
                type="text"
                value={context.communication?.tone || ''}
                onChange={e => updateField('communication', 'tone', e.target.value)}
                placeholder="z.B. direkt, keine Floskeln"
              />
            </div>

            <div className="form-group">
              <label>Tiefe / Niveau</label>
              <input
                type="text"
                value={context.communication?.depth || ''}
                onChange={e => updateField('communication', 'depth', e.target.value)}
                placeholder="z.B. technisch versiert, Einsteiger"
              />
            </div>

            <div className="form-group">
              <label>Entscheidungsstil</label>
              <input
                type="text"
                value={context.communication?.decision_style || ''}
                onChange={e => updateField('communication', 'decision_style', e.target.value)}
                placeholder="z.B. Ja/Nein-Fragen, brauche Zeit"
              />
            </div>

            <div className="form-group">
              <label>Bevorzugt (kommagetrennt)</label>
              <input
                type="text"
                value={context.communication?.prefer?.join(', ') || ''}
                onChange={e => updateArrayField('communication', 'prefer', e.target.value)}
                placeholder="z.B. Klartext, Tabellen, Beispiele"
              />
            </div>

            <div className="form-group">
              <label>Vermeiden (kommagetrennt)</label>
              <input
                type="text"
                value={context.communication?.avoid?.join(', ') || ''}
                onChange={e => updateArrayField('communication', 'avoid', e.target.value)}
                placeholder="z.B. Marketing-Sprache, Smalltalk"
              />
            </div>

            <div className="form-group">
              <label>Energie-Muster</label>
              <input
                type="text"
                value={context.communication?.energy_pattern || ''}
                onChange={e => updateField('communication', 'energy_pattern', e.target.value)}
                placeholder="z.B. Morgens am produktivsten"
              />
            </div>
          </div>
        )}

        {/* FOKUS */}
        {activeTab === 'focus' && (
          <div className="tab-panel">
            <div className="form-group">
              <label>Aktuelle Projekte (kommagetrennt)</label>
              <input
                type="text"
                value={context.focus?.projects?.join(', ') || ''}
                onChange={e => updateArrayField('focus', 'projects', e.target.value)}
                placeholder="z.B. Visionfusen, Buch schreiben"
              />
            </div>

            <div className="form-group">
              <label>Interessen (kommagetrennt)</label>
              <input
                type="text"
                value={context.focus?.interests?.join(', ') || ''}
                onChange={e => updateArrayField('focus', 'interests', e.target.value)}
                placeholder="z.B. Digitale Souveränität, Nostr, Bitcoin"
              />
            </div>

            <div className="form-group">
              <label>Lerne gerade (kommagetrennt)</label>
              <input
                type="text"
                value={context.focus?.learning?.join(', ') || ''}
                onChange={e => updateArrayField('focus', 'learning', e.target.value)}
                placeholder="z.B. Rust, Machine Learning"
              />
            </div>

            <div className="form-group">
              <label>Ziele (kommagetrennt)</label>
              <input
                type="text"
                value={context.focus?.goals?.join(', ') || ''}
                onChange={e => updateArrayField('focus', 'goals', e.target.value)}
                placeholder="z.B. Community aufbauen, Produkt launchen"
              />
            </div>

            <div className="form-group">
              <label>Expertise / Domains (kommagetrennt)</label>
              <input
                type="text"
                value={context.expertise?.domains?.join(', ') || ''}
                onChange={e => updateArrayField('expertise', 'domains', e.target.value)}
                placeholder="z.B. TypeScript, React, Nostr"
              />
            </div>

            <div className="form-group">
              <label>Tools (kommagetrennt)</label>
              <input
                type="text"
                value={context.expertise?.tools?.join(', ') || ''}
                onChange={e => updateArrayField('expertise', 'tools', e.target.value)}
                placeholder="z.B. VS Code, Cursor, Claude"
              />
            </div>
          </div>
        )}

        {/* KI-ANWEISUNGEN */}
        {activeTab === 'llm' && (
          <div className="tab-panel">
            <p className="tab-hint">
              Spezifische Anweisungen für KI-Assistenten wie Claude oder ChatGPT.
            </p>

            <div className="form-group">
              <label>Bevorzugte Sprache</label>
              <select
                value={context.llm_instructions?.language || 'de'}
                onChange={e => updateField('llm_instructions', 'language', e.target.value)}
              >
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
              </select>
            </div>

            <div className="form-group">
              <label>Antwort-Format</label>
              <input
                type="text"
                value={context.llm_instructions?.format || ''}
                onChange={e => updateField('llm_instructions', 'format', e.target.value)}
                placeholder="z.B. knapp, Tabellen wenn sinnvoll"
              />
            </div>

            <div className="form-group">
              <label>Immer tun (kommagetrennt)</label>
              <input
                type="text"
                value={context.llm_instructions?.always?.join(', ') || ''}
                onChange={e => updateArrayField('llm_instructions', 'always', e.target.value)}
                placeholder="z.B. Optionen anbieten, Code-Beispiele"
              />
            </div>

            <div className="form-group">
              <label>Niemals tun (kommagetrennt)</label>
              <input
                type="text"
                value={context.llm_instructions?.never?.join(', ') || ''}
                onChange={e => updateArrayField('llm_instructions', 'never', e.target.value)}
                placeholder="z.B. Floskeln, unnötige Warnungen"
              />
            </div>

            <div className="form-group">
              <label>Zusätzliche Hinweise</label>
              <textarea
                value={context.llm_instructions?.context_hints || ''}
                onChange={e => updateField('llm_instructions', 'context_hints', e.target.value)}
                placeholder="Freitext für alles, was die KI noch wissen sollte..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* VORSCHAU */}
        {activeTab === 'preview' && (
          <div className="tab-panel preview-panel">
            <div className="preview-header">
              <h3>Markdown-Vorschau</h3>
              <p>So sieht dein Kontext aus, wenn du ihn einer KI gibst:</p>
            </div>
            
            <pre className="preview-content">
              {contextToMarkdown(context)}
            </pre>

            <div className="preview-actions">
              <button 
                className="btn-secondary"
                onClick={handleCopyMarkdown}
              >
                {copied ? '✓ Kopiert!' : '📋 Markdown kopieren'}
              </button>
              
              <button 
                className="btn-secondary"
                onClick={handleDownload}
              >
                📥 Als Datei speichern
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer mit Publish */}
      <div className="editor-footer">
        <div className="visibility-toggle">
          <label>Sichtbarkeit:</label>
          <div className="toggle-buttons">
            <button
              className={visibility === 'public' ? 'active' : ''}
              onClick={() => setVisibility('public')}
            >
              🌐 Öffentlich
            </button>
            <button
              className={visibility === 'private' ? 'active' : ''}
              onClick={() => setVisibility('private')}
            >
              🔒 Nur für mich
            </button>
          </div>
        </div>

        <button 
          className="btn-primary"
          onClick={handlePublish}
          disabled={isSaving || !context.identity.name}
        >
          {isSaving ? 'Wird gespeichert...' : 'Als Nostr-Event speichern'}
        </button>
      </div>
    </div>
  );
}
