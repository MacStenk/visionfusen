import { useState, useEffect } from 'react';
import { 
  isValidSeed, 
  seedToPrivateKey, 
  encryptData, 
  decryptData 
} from './seedUtils';

type LoginMethod = 'password' | 'extension' | 'seed' | null;
type LoginState = 'idle' | 'checking' | 'success' | 'error';

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
    };
  }
}

export default function Login() {
  const [method, setMethod] = useState<LoginMethod>(null);
  const [hasLocalKey, setHasLocalKey] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const [localUsername, setLocalUsername] = useState('');
  
  // Form states
  const [password, setPassword] = useState('');
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [state, setState] = useState<LoginState>('idle');
  const [error, setError] = useState('');

  // Check for local key and extension on mount
  useEffect(() => {
    const encryptedKey = localStorage.getItem('nostr_encrypted_key');
    const username = localStorage.getItem('visionfusen_username');
    
    if (encryptedKey && username) {
      setHasLocalKey(true);
      setLocalUsername(username);
    }

    const checkExtension = () => {
      if (window.nostr) {
        setHasExtension(true);
      }
    };
    
    checkExtension();
    const timeout = setTimeout(checkExtension, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  // Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('checking');
    setError('');

    try {
      const encryptedKey = localStorage.getItem('nostr_encrypted_key');
      
      if (!encryptedKey) {
        throw new Error('Kein lokaler Key gefunden');
      }

      const privateKeyHex = await decryptData(encryptedKey, password);
      
      const { getPublicKey } = await import('nostr-tools');
      const pubkey = getPublicKey(privateKeyHex);
      
      localStorage.setItem('nostr_pubkey', pubkey);
      localStorage.setItem('nostr_session_active', 'true');
      
      setState('success');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (err) {
      setState('error');
      setError('Falsches Passwort');
    }
  };

  // Extension login
  const handleExtensionLogin = async () => {
    setState('checking');
    setError('');

    try {
      if (!window.nostr) {
        throw new Error('Keine Nostr-Extension gefunden');
      }

      const pubkey = await window.nostr.getPublicKey();
      
      localStorage.setItem('nostr_pubkey', pubkey);
      localStorage.setItem('nostr_login_method', 'extension');
      localStorage.setItem('nostr_session_active', 'true');
      
      setState('success');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    }
  };

  // Seed recovery
  const handleSeedRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('checking');
    setError('');

    try {
      const seed = seedWords.join(' ').toLowerCase().trim();
      
      if (!isValidSeed(seed)) {
        throw new Error('Ungültige Wörter. Bitte überprüfe die Eingabe.');
      }

      if (newPassword.length < 8) {
        throw new Error('Passwort muss mindestens 8 Zeichen haben');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwörter stimmen nicht überein');
      }

      // Derive keys from seed
      const privateKeyHex = seedToPrivateKey(seed);
      
      const { getPublicKey, nip19 } = await import('nostr-tools');
      const pubkey = getPublicKey(privateKeyHex);

      // Encrypt and store
      const encryptedSeed = await encryptData(seed, newPassword);
      const encryptedKey = await encryptData(privateKeyHex, newPassword);
      
      localStorage.setItem('nostr_encrypted_seed', encryptedSeed);
      localStorage.setItem('nostr_encrypted_key', encryptedKey);
      localStorage.setItem('nostr_pubkey', pubkey);
      localStorage.setItem('nostr_session_active', 'true');
      
      setState('success');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Wiederherstellung fehlgeschlagen');
    }
  };

  // Update seed word
  const handleSeedWordChange = (index: number, value: string) => {
    const newWords = [...seedWords];
    newWords[index] = value.toLowerCase().trim();
    setSeedWords(newWords);
  };

  // Handle paste of full seed
  const handleSeedPaste = (e: React.ClipboardEvent, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    const words = pastedText.toLowerCase().trim().split(/\s+/);
    
    if (words.length === 12) {
      e.preventDefault();
      setSeedWords(words);
    }
  };

  // Success view
  if (state === 'success') {
    return (
      <div className="login-card">
        <div className="success-state">
          <span className="success-icon">✓</span>
          <h2>Willkommen zurück!</h2>
          <p>Du wirst weitergeleitet...</p>
        </div>
      </div>
    );
  }

  // Method: Password login
  if (method === 'password') {
    return (
      <div className="login-card">
        <button className="back-btn" onClick={() => { setMethod(null); setState('idle'); setError(''); }}>
          ← Zurück
        </button>

        <h1>Anmelden</h1>
        <p className="login-intro">
          Willkommen zurück, <strong>{localUsername}</strong>
        </p>

        <form onSubmit={handlePasswordLogin}>
          <div className="input-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dein Passwort"
              autoComplete="current-password"
              disabled={state === 'checking'}
              autoFocus
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={state === 'checking'}
          >
            {state === 'checking' ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <a href="#" onClick={(e) => { e.preventDefault(); setMethod('seed'); setError(''); }}>
              Passwort vergessen? Mit 12 Wörtern anmelden
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Method: Extension login
  if (method === 'extension') {
    return (
      <div className="login-card">
        <button className="back-btn" onClick={() => { setMethod(null); setState('idle'); setError(''); }}>
          ← Zurück
        </button>

        <div className="extension-state">
          {state === 'checking' && (
            <>
              <span className="loading-icon">◈</span>
              <h2>Verbinde mit Extension...</h2>
              <p>Bitte bestätige in deiner Browser-Extension.</p>
            </>
          )}

          {state === 'error' && (
            <>
              <span className="error-icon">✕</span>
              <h2>Verbindung fehlgeschlagen</h2>
              <p>{error}</p>
              <button 
                className="btn-secondary"
                onClick={handleExtensionLogin}
              >
                Erneut versuchen
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Method: Seed recovery
  if (method === 'seed') {
    return (
      <div className="login-card login-card-wide">
        <button className="back-btn" onClick={() => { setMethod(null); setState('idle'); setError(''); setSeedWords(Array(12).fill('')); }}>
          ← Zurück
        </button>

        <h1>Mit 12 Wörtern anmelden</h1>
        <p className="login-intro">
          Gib deine 12 Backup-Wörter ein.
        </p>

        <form onSubmit={handleSeedRecovery}>
          <div className="seed-input-grid">
            {seedWords.map((word, index) => (
              <div key={index} className="seed-input-item">
                <span className="seed-input-number">{index + 1}.</span>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleSeedWordChange(index, e.target.value)}
                  onPaste={(e) => handleSeedPaste(e, index)}
                  placeholder="wort"
                  autoComplete="off"
                  disabled={state === 'checking'}
                />
              </div>
            ))}
          </div>

          <div className="input-group">
            <label htmlFor="newPassword">Neues Passwort für dieses Gerät</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              disabled={state === 'checking'}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              autoComplete="new-password"
              disabled={state === 'checking'}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={state === 'checking' || seedWords.some(w => !w)}
          >
            {state === 'checking' ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>
      </div>
    );
  }

  // Method selection (default)
  return (
    <div className="login-card">
      <h1>Anmelden</h1>
      <p className="login-intro">
        Wähle, wie du dich anmelden möchtest.
      </p>

      <div className="login-methods">
        {/* Password login */}
        {hasLocalKey && (
          <button 
            className="method-btn method-password"
            onClick={() => setMethod('password')}
          >
            <span className="method-icon">🔐</span>
            <span className="method-name">Mit Passwort</span>
            <span className="method-desc">Als {localUsername}</span>
            <span className="method-badge">Dieses Gerät</span>
          </button>
        )}

        {/* Extension login */}
        {hasExtension ? (
          <button 
            className="method-btn method-extension"
            onClick={() => {
              setMethod('extension');
              handleExtensionLogin();
            }}
          >
            <span className="method-icon">🌐</span>
            <span className="method-name">Mit Browser-Extension</span>
            <span className="method-desc">Alby, nos2x, Nostr Connect</span>
            {!hasLocalKey && <span className="method-badge">Empfohlen</span>}
          </button>
        ) : (
          <div className="method-btn method-extension disabled">
            <span className="method-icon">🌐</span>
            <span className="method-name">Mit Browser-Extension</span>
            <span className="method-desc">Keine Extension gefunden</span>
            <a 
              href="https://getalby.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="method-link"
            >
              Alby installieren →
            </a>
          </div>
        )}

        {/* Seed recovery */}
        <button 
          className="method-btn method-seed"
          onClick={() => setMethod('seed')}
        >
          <span className="method-icon">📝</span>
          <span className="method-name">Mit 12 Wörtern</span>
          <span className="method-desc">Neues Gerät oder Passwort vergessen</span>
        </button>
      </div>

      <div className="login-footer">
        <p>Noch kein Mitglied? <a href="/mitmachen">Mitmachen</a></p>
      </div>
    </div>
  );
}
