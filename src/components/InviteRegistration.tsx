import { useState, useEffect } from 'react';
import { generateKeyPair, encryptNsec } from '../lib/nostr';
import { saveUser, type UserData } from '../lib/storage';

type Step = 'loading' | 'invalid' | 'form' | 'keys' | 'backup' | 'done';

interface InviteData {
  inviterName: string;
  inviterUsername: string;
  expiresAt: string;
  isValid: boolean;
}

interface Props {
  token: string;
}

export default function InviteRegistration({ token }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
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

  // Token validieren beim Laden
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      // TODO: API-Call zur Token-Validierung
      // const response = await fetch(`/api/invitations/${token}`);
      // const data = await response.json();

      // Simuliere API-Call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulierte Daten - in Produktion von API
      // Prüfe ob Token gültig aussieht (mindestens 6 Zeichen)
      if (token && token.length >= 6) {
        setInviteData({
          inviterName: 'Steven',
          inviterUsername: 'steven',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isValid: true,
        });
        setStep('form');
      } else {
        setStep('invalid');
      }
    } catch (err) {
      setStep('invalid');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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
        invitedBy: inviteData?.inviterUsername,
        status: 'member', // Sofort Mitglied bei Einladung!
      },
      identity: {
        nostr: {
          npub: keyPair.npub,
          nsec_encrypted: encryptedNsec,
          npub_hex: keyPair.npubHex,
        },
      },
      profile: {
        bio: '',
        website: '',
        lightning: '',
        links: [],
        fediverse: '',
        xmpp: '',
      },
      progress: {
        accountCreated: true,
        keysSaved: true,
        firstPost: false,
        firstMessage: false,
        invitedSomeone: false,
        profileCompleted: false,
      },
    };

    saveUser(userData);

    // TODO: API-Call um Einladung als verwendet zu markieren
    // await fetch(`/api/invitations/${token}/use`, { method: 'POST' });

    setStep('done');
  };

  const downloadBackup = () => {
    if (!keyPair) return;
    
    const backup = `VISIONFUSEN BACKUP - GEHEIM AUFBEWAHREN!
==========================================

Dein Username: ${username}@visionfusen.org
Eingeladen von: ${inviteData?.inviterName} (@${inviteData?.inviterUsername})

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

  // Loading
  if (step === 'loading') {
    return (
      <div className="invite-card">
        <div className="invite-header">
          <div className="invite-icon">◈</div>
          <p>Einladung wird geprüft...</p>
        </div>
      </div>
    );
  }

  // Invalid Token
  if (step === 'invalid') {
    return (
      <div className="invite-card">
        <div className="invalid-token">
          <div className="invalid-icon">❌</div>
          <h2>Einladung ungültig</h2>
          <p>
            Dieser Einladungs-Link ist ungültig oder bereits abgelaufen.
          </p>
          <a href="/mitmachen" className="btn-secondary">
            Andere Optionen ansehen
          </a>
        </div>
      </div>
    );
  }

  // Form
  if (step === 'form' && inviteData) {
    return (
      <div className="invite-card">
        <div className="invite-header">
          <div className="invite-icon">✉️</div>
          <h1>Du wurdest eingeladen</h1>
          <p className="invite-from">
            <strong>{inviteData.inviterName}</strong> möchte, dass du Teil von Visionfusen wirst.
          </p>
        </div>

        <div className="invite-benefits">
          <div className="benefit">
            <span className="benefit-icon">⚡</span>
            <span>Sofort Mitglied (kein Anwärter-Status)</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🎁</span>
            <span>150 Starter-Sats geschenkt</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔑</span>
            <span>Deine eigene Nostr-Identität</span>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="input-group">
            <label htmlFor="username">Wähle deinen Username</label>
            <div className="input-with-suffix">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="dein-name"
                autoComplete="username"
                required
              />
              <span className="input-suffix">@visionfusen.org</span>
            </div>
            <p className="input-hint">
              Kleinbuchstaben, Zahlen und Unterstriche erlaubt
            </p>
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

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary">
            Weiter
          </button>
        </form>
      </div>
    );
  }

  // Keys
  if (step === 'keys' && keyPair) {
    return (
      <div className="invite-card">
        <div className="progress-steps">
          <div className="progress-step completed">
            <span className="step-number">1</span>
            <span className="step-label">Account</span>
          </div>
          <div className="progress-step active">
            <span className="step-number">2</span>
            <span className="step-label">Schlüssel</span>
          </div>
          <div className="progress-step">
            <span className="step-number">3</span>
            <span className="step-label">Backup</span>
          </div>
        </div>

        <h1>Deine Schlüssel</h1>
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
          Bewahre ihn sicher auf.</p>
        </div>

        <button type="button" className="btn-primary" onClick={handleKeysConfirm}>
          Verstanden, weiter
        </button>
      </div>
    );
  }

  // Backup
  if (step === 'backup' && keyPair) {
    return (
      <div className="invite-card">
        <div className="progress-steps">
          <div className="progress-step completed">
            <span className="step-number">1</span>
            <span className="step-label">Account</span>
          </div>
          <div className="progress-step completed">
            <span className="step-number">2</span>
            <span className="step-label">Schlüssel</span>
          </div>
          <div className="progress-step active">
            <span className="step-number">3</span>
            <span className="step-label">Backup</span>
          </div>
        </div>

        <h1>Sichere deine Schlüssel</h1>
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
    );
  }

  // Done
  if (step === 'done') {
    return (
      <div className="invite-card">
        <div className="success-card">
          <div className="success-icon">◈</div>
          <h1>Willkommen, {username}!</h1>
          <p className="invite-from">
            Du bist jetzt <strong>{username}@visionfusen.org</strong>
          </p>
          <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
            Eingeladen von {inviteData?.inviterName}. Deine 150 Starter-Sats warten auf dich.
          </p>

          <a href="/dashboard" className="btn-primary">
            Zum Dashboard
          </a>
        </div>
      </div>
    );
  }

  return null;
}
