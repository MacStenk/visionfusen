import { useState } from 'react';
import { generateKeyPair, encryptNsec } from '../lib/nostr';
import { saveUser, type UserData } from '../lib/storage';

type Step = 'username' | 'keys' | 'backup' | 'done';

export default function Registration() {
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [keyPair, setKeyPair] = useState<{
    nsec: string;
    npub: string;
    npubHex: string;
  } | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (username.length < 3) {
      setError('Username muss mindestens 3 Zeichen haben');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Nur Kleinbuchstaben, Zahlen und Unterstriche erlaubt');
      return;
    }

    // Validate password
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Generate keys
    const keys = generateKeyPair();
    setKeyPair({
      nsec: keys.nsec,
      npub: keys.npub,
      npubHex: keys.npubHex
    });

    setStep('keys');
  };

  const handleKeysConfirm = () => {
    setStep('backup');
  };

  const handleBackupConfirm = async () => {
    if (!keyPair || !backupConfirmed) return;

    // Encrypt and save
    const encryptedNsec = await encryptNsec(keyPair.nsec, password);
    
    const userData: UserData = {
      user: {
        username,
        createdAt: new Date().toISOString(),
      },
      identity: {
        nostr: {
          npub: keyPair.npub,
          nsec_encrypted: encryptedNsec,
          npub_hex: keyPair.npubHex,
        },
      },
      progress: {
        accountCreated: true,
        keysSaved: true,
        firstPost: false,
        firstMessage: false,
        invitedSomeone: false,
      },
    };

    saveUser(userData);
    setStep('done');
  };

  const downloadBackup = () => {
    if (!keyPair) return;
    
    const backup = `VISIONFUSEN BACKUP - GEHEIM AUFBEWAHREN!
==========================================

Dein Username: ${username}@visionfusen.org

Dein Nostr Private Key (nsec):
${keyPair.nsec}

Dein Nostr Public Key (npub):
${keyPair.npub}

WICHTIG:
- Bewahre dieses Dokument sicher auf
- Teile deinen Private Key (nsec) NIEMALS
- Mit dem Private Key kann jeder als du handeln
- Verlierst du ihn, verlierst du deine Identität

Erstellt am: ${new Date().toLocaleString('de-DE')}
`;

    const blob = new Blob([backup], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionfusen-backup-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="registration">
      {/* Progress indicator */}
      <div className="progress-steps">
        <div className={`progress-step ${step === 'username' ? 'active' : ''} ${['keys', 'backup', 'done'].includes(step) ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Account</span>
        </div>
        <div className={`progress-step ${step === 'keys' ? 'active' : ''} ${['backup', 'done'].includes(step) ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Schlüssel</span>
        </div>
        <div className={`progress-step ${step === 'backup' ? 'active' : ''} ${step === 'done' ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Backup</span>
        </div>
      </div>

      {/* Step 1: Username */}
      {step === 'username' && (
        <form onSubmit={handleUsernameSubmit} className="registration-form">
          <h2>Werde Teil der Bewegung</h2>
          <p className="form-intro">Wähle deinen Username. Er wird deine Identität im dezentralen Netz.</p>
          
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-suffix">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="max"
                autoComplete="username"
                required
              />
              <span className="input-suffix">@visionfusen.org</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              required
            />
            <p className="input-hint">Verschlüsselt deinen Private Key lokal</p>
          </div>

          <div className="input-group">
            <label htmlFor="passwordConfirm">Passwort bestätigen</label>
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Passwort wiederholen"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">
            Weiter
          </button>
        </form>
      )}

      {/* Step 2: Show Keys */}
      {step === 'keys' && keyPair && (
        <div className="keys-display">
          <h2>Deine Schlüssel wurden erstellt</h2>
          <p className="form-intro">
            Diese Schlüssel sind deine Identität. Der Private Key ist wie ein Passwort – 
            teile ihn <strong>niemals</strong>.
          </p>

          <div className="key-box public">
            <div className="key-header">
              <span className="key-label">🔓 Public Key (npub)</span>
              <span className="key-info">Darf geteilt werden</span>
            </div>
            <code className="key-value">{keyPair.npub}</code>
            <button 
              type="button" 
              className="btn-copy"
              onClick={() => copyToClipboard(keyPair.npub)}
            >
              Kopieren
            </button>
          </div>

          <div className="key-box private">
            <div className="key-header">
              <span className="key-label">🔐 Private Key (nsec)</span>
              <span className="key-info">GEHEIM HALTEN!</span>
            </div>
            <code className="key-value">{keyPair.nsec}</code>
            <button 
              type="button" 
              className="btn-copy"
              onClick={() => copyToClipboard(keyPair.nsec)}
            >
              Kopieren
            </button>
          </div>

          <div className="warning-box">
            <p>⚠️ <strong>Wichtig:</strong> Wer deinen Private Key hat, kann als du handeln. 
            Bewahre ihn sicher auf – wie einen Haustürschlüssel.</p>
          </div>

          <button type="button" className="btn-primary" onClick={handleKeysConfirm}>
            Verstanden, weiter
          </button>
        </div>
      )}

      {/* Step 3: Backup */}
      {step === 'backup' && keyPair && (
        <div className="backup-step">
          <h2>Sichere deine Schlüssel</h2>
          <p className="form-intro">
            Lade dein Backup herunter. Ohne dieses Backup kannst du deine Identität nicht wiederherstellen.
          </p>

          <button type="button" className="btn-download" onClick={downloadBackup}>
            📥 Backup herunterladen
          </button>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={backupConfirmed}
                onChange={(e) => setBackupConfirmed(e.target.checked)}
              />
              <span>Ich habe mein Backup sicher gespeichert</span>
            </label>
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleBackupConfirm}
            disabled={!backupConfirmed}
          >
            Abschließen
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="done-step">
          <div className="success-icon">◈</div>
          <h2>Willkommen, {username}!</h2>
          <p className="form-intro">
            Du bist jetzt <strong>{username}@visionfusen.org</strong>
          </p>
          <p>Deine Reise zur digitalen Souveränität beginnt jetzt.</p>

          <a href="/dashboard" className="btn-primary">
            Zum Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
