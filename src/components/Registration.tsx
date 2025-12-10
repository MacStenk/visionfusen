import { useState } from 'react';
import { 
  generateSeed, 
  seedToPrivateKey, 
  encryptData, 
  generateBackupFile,
  downloadBackup 
} from './seedUtils';

type Step = 'form' | 'warning' | 'seed' | 'complete';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
}

interface KeyData {
  seed: string;
  privateKeyHex: string;
  publicKey: string;
  nsec: string;
  npub: string;
}

interface Props {
  invitedBy?: string;
  onComplete?: () => void;
}

export default function Registration({ invitedBy, onComplete }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [keyData, setKeyData] = useState<KeyData | null>(null);
  const [error, setError] = useState('');
  const [checkboxes, setCheckboxes] = useState({
    written: false,
    understood: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const username = formData.username.trim().toLowerCase();

    if (username.length < 3) {
      setError('Username muss mindestens 3 Zeichen haben');
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      setError('Username darf nur Kleinbuchstaben, Zahlen, - und _ enthalten');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate seed and derive keys
      const seed = generateSeed();
      const privateKeyHex = await seedToPrivateKey(seed);
      
      // Import nostr-tools for key conversion
      const { getPublicKey, nip19 } = await import('nostr-tools');
      const publicKey = getPublicKey(privateKeyHex);
      
      // Convert to bech32 format
      const nsec = nip19.nsecEncode(privateKeyHex);
      const npub = nip19.npubEncode(publicKey);

      setKeyData({
        seed,
        privateKeyHex,
        publicKey,
        nsec,
        npub,
      });

      // Move to warning step
      setStep('warning');
    } catch (err) {
      setError('Fehler bei der Key-Generierung');
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: User acknowledges warning
  const handleWarningContinue = () => {
    setStep('seed');
  };

  // Step 3: Download backup file
  const handleDownloadBackup = () => {
    if (!keyData) return;
    
    const content = generateBackupFile(
      formData.username,
      keyData.seed,
      keyData.nsec,
      keyData.npub
    );
    
    downloadBackup(content, formData.username);
  };

  // Step 3: Complete registration
  const handleComplete = async () => {
    if (!keyData) return;
    
    setIsGenerating(true);
    
    try {
      // Encrypt seed and private key with password
      const encryptedSeed = await encryptData(keyData.seed, formData.password);
      const encryptedKey = await encryptData(keyData.privateKeyHex, formData.password);

      // Store in localStorage
      localStorage.setItem('visionfusen_username', formData.username);
      localStorage.setItem('nostr_encrypted_seed', encryptedSeed);
      localStorage.setItem('nostr_encrypted_key', encryptedKey);
      localStorage.setItem('nostr_pubkey', keyData.publicKey);
      localStorage.setItem('nostr_session_active', 'true');

      setStep('complete');

      // Redirect after short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          window.location.href = '/dashboard';
        }
      }, 2000);

    } catch (err) {
      setError('Fehler beim Speichern');
      setIsGenerating(false);
    }
  };

  // STEP 1: Form
  if (step === 'form') {
    return (
      <div className="registration">
        <h1>Account erstellen</h1>
        
        {invitedBy && (
          <p className="invited-by">
            Eingeladen von <strong>{invitedBy}</strong>
          </p>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-suffix">
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="deinname"
                autoComplete="username"
                disabled={isGenerating}
              />
              <span className="input-suffix">@visionfusen.org</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              disabled={isGenerating}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Passwort wiederholen"
              autoComplete="new-password"
              disabled={isGenerating}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? 'Wird erstellt...' : 'Weiter'}
          </button>
        </form>
      </div>
    );
  }

  // STEP 2: Warning
  if (step === 'warning') {
    return (
      <div className="registration">
        <div className="warning-box">
          <div className="warning-icon">⚠️</div>
          
          <h1>STOPP. LIES DAS.</h1>
          
          <p className="warning-lead">
            Was du gleich siehst, siehst du nur einmal.
          </p>

          <div className="warning-content">
            <p>
              Diese 12 Wörter <strong>SIND</strong> deine Identität.
            </p>
            <p>
              Nicht eine Kopie. Nicht ein Backup.<br />
              <strong>DER Schlüssel. Der einzige.</strong>
            </p>
          </div>

          <div className="warning-list">
            <p>Wenn du ihn verlierst:</p>
            <ul>
              <li>Können wir nicht helfen.</li>
              <li>Gibt es kein "Passwort zurücksetzen".</li>
              <li>Ist dein Account weg. Für immer.</li>
              <li>Sind deine Inhalte weg.</li>
              <li>Sind deine Sats weg.</li>
            </ul>
          </div>

          <p className="warning-physics">
            Das ist keine Drohung. Das ist Physik.<br />
            So funktioniert echte Souveränität.
          </p>

          <button 
            className="btn-primary"
            onClick={handleWarningContinue}
          >
            Ich verstehe. Wörter anzeigen.
          </button>
        </div>
      </div>
    );
  }

  // STEP 3: Seed display
  if (step === 'seed' && keyData) {
    const words = keyData.seed.split(' ');
    
    return (
      <div className="registration">
        <div className="seed-box">
          <h1>DEINE 12 WÖRTER</h1>
          
          <p className="seed-instruction">
            Schreib sie auf Papier. Nicht digital.<br />
            Papier kann nicht gehackt werden.
          </p>

          <div className="seed-grid">
            {words.map((word, index) => (
              <div key={index} className="seed-word">
                <span className="seed-number">{index + 1}.</span>
                <span className="seed-text">{word}</span>
              </div>
            ))}
          </div>

          <button 
            className="btn-secondary btn-download"
            onClick={handleDownloadBackup}
          >
            📥 Zusätzlich: Backup-Datei herunterladen
          </button>
          <p className="download-hint">
            Für schnellen Import auf neuem Gerät
          </p>

          <div className="seed-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkboxes.written}
                onChange={(e) => setCheckboxes({ ...checkboxes, written: e.target.checked })}
              />
              <span>Ich habe die Wörter aufgeschrieben.</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkboxes.understood}
                onChange={(e) => setCheckboxes({ ...checkboxes, understood: e.target.checked })}
              />
              <span>Ich verstehe: Verloren = Weg.</span>
            </label>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            className="btn-primary"
            onClick={handleComplete}
            disabled={!checkboxes.written || !checkboxes.understood || isGenerating}
          >
            {isGenerating ? 'Wird gespeichert...' : 'Weiter'}
          </button>
        </div>
      </div>
    );
  }

  // STEP 4: Complete
  if (step === 'complete') {
    return (
      <div className="registration">
        <div className="complete-box">
          <div className="complete-icon">✓</div>
          <h1>Willkommen bei Visionfusen</h1>
          <p>
            Dein Account ist erstellt.<br />
            Du wirst weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
