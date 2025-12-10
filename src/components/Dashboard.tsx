import { useState, useEffect } from 'react';
import { getUser, updateProgress, exportUserData, clearUser, type UserData } from '../lib/storage';
import ProfileEditor from './ProfileEditor';
import NostrPost from './NostrPost';
import NostrFeed from './NostrFeed';

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      window.location.href = '/registrieren';
      return;
    }
    setUser(userData);
  }, []);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const handleProgressUpdate = (key: keyof UserData['progress']) => {
    updateProgress(key, true);
    setUser(getUser());
  };

  const handleExport = () => {
    const data = exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionfusen-${user?.user.username}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    if (confirm('Bist du sicher? Stelle sicher, dass du dein Backup hast!')) {
      clearUser();
      window.location.href = '/';
    }
  };

  const copyNpub = () => {
    if (user?.identity.nostr.npub) {
      navigator.clipboard.writeText(user.identity.nostr.npub);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInviteLink = () => {
    return `https://visionfusen.org/einladung#${user?.user.username}`;
  };

  const getInviteText = () => {
    return `${user?.user.username} lädt dich ein, Teil von Visionfusen zu werden – einer Gemeinschaft für digitale Souveränität.\n\nDekonditionierung. Für Mensch und Maschine.\n\n${getInviteLink()}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const shareVia = (platform: string) => {
    const text = encodeURIComponent(getInviteText());
    const url = encodeURIComponent(getInviteLink());
    
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(`${user?.user.username} lädt dich ein zu Visionfusen`)}`,
      email: `mailto:?subject=${encodeURIComponent('Einladung zu Visionfusen')}&body=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
    };
    
    window.open(links[platform], '_blank');
    handleProgressUpdate('invitedSomeone');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getProgressPercent = () => {
    if (!user) return 0;
    const items = Object.values(user.progress);
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  if (!user) {
    return <div className="loading">Lädt...</div>;
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div className="welcome-content">
          <span className="welcome-icon">◈</span>
          <div>
            <h1>{getGreeting()}, {user.user.username}.</h1>
            <p className="welcome-subtitle">
              Tag {user.user.daysSinceJoin} deiner Dekonditionierung.
            </p>
          </div>
        </div>
      </section>

      {/* Identity Section */}
      <section className="dashboard-section">
        <h2>Deine Identität</h2>
        <div className="identity-card">
          <div className="identity-main">
            <span className="identity-handle">{user.user.username}@visionfusen.org</span>
            <span className="identity-badge">Nostr</span>
          </div>
          
          <div className="identity-services">
            <div className="service-item active">
              <span className="service-icon">⚡</span>
              <span className="service-name">Nostr</span>
              <span className="service-status">Aktiv</span>
            </div>
            <div className="service-item coming">
              <span className="service-icon">💬</span>
              <span className="service-name">XMPP</span>
              <span className="service-status">Bald</span>
            </div>
            <div className="service-item coming">
              <span className="service-icon">📷</span>
              <span className="service-name">Pixelfed</span>
              <span className="service-status">Bald</span>
            </div>
          </div>

          <div className="identity-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowProfileEditor(true)}
            >
              ✏️ Profil bearbeiten
            </button>
            <a 
              href={`/profil#${user.user.username}`}
              className="btn-secondary"
              target="_blank"
            >
              👤 Profilseite ansehen
            </a>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowKeys(!showKeys)}
            >
              🔑 {showKeys ? 'Schlüssel verbergen' : 'Schlüssel anzeigen'}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={copyNpub}
            >
              {copied ? '✓ Kopiert!' : '📋 npub kopieren'}
            </button>
          </div>

          {showKeys && (
            <div className="keys-reveal">
              <div className="key-display">
                <label>Public Key (npub)</label>
                <code>{user.identity.nostr.npub}</code>
              </div>
              <p className="key-note">
                💡 Dein Private Key ist verschlüsselt gespeichert. 
                Nutze dein Backup um ihn abzurufen.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Nostr Post Section */}
      <section className="dashboard-section">
        <h2>Posten</h2>
        <NostrPost />
      </section>

      {/* Nostr Feed Section */}
      <section className="dashboard-section">
        <h2>Deine Timeline</h2>
        <NostrFeed />
      </section>

      {/* Progress Section */}
      <section className="dashboard-section">
        <h2>Dein Weg</h2>
        <div className="progress-card">
          <div className="progress-header">
            <span>Dein Weg zur Souveränität</span>
            <span className="progress-percent">{getProgressPercent()}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>

          <ul className="progress-list">
            <li className={user.progress.accountCreated ? 'completed' : ''}>
              <span className="check">{user.progress.accountCreated ? '✓' : '○'}</span>
              <span>Account erstellt</span>
            </li>
            <li className={user.progress.keysSaved ? 'completed' : ''}>
              <span className="check">{user.progress.keysSaved ? '✓' : '○'}</span>
              <span>Schlüssel gesichert</span>
            </li>
            <li className={user.progress.firstPost ? 'completed' : ''}>
              <span className="check">{user.progress.firstPost ? '✓' : '○'}</span>
              <span>Ersten Nostr-Post veröffentlicht</span>
              {!user.progress.firstPost && (
                <button 
                  type="button"
                  className="btn-small"
                  onClick={() => handleProgressUpdate('firstPost')}
                >
                  Erledigt ✓
                </button>
              )}
            </li>
            <li className={user.progress.firstMessage ? 'completed' : ''}>
              <span className="check">{user.progress.firstMessage ? '✓' : '○'}</span>
              <span>Erste Nachricht geschrieben</span>
              {!user.progress.firstMessage && (
                <button 
                  type="button"
                  className="btn-small"
                  onClick={() => handleProgressUpdate('firstMessage')}
                >
                  Erledigt ✓
                </button>
              )}
            </li>
            <li className={user.progress.invitedSomeone ? 'completed' : ''}>
              <span className="check">{user.progress.invitedSomeone ? '✓' : '○'}</span>
              <span>Jemanden eingeladen</span>
              {!user.progress.invitedSomeone && (
                <button 
                  type="button"
                  className="btn-small"
                  onClick={() => setShowInvite(true)}
                >
                  Einladen
                </button>
              )}
            </li>
          </ul>
        </div>
      </section>

      {/* Learn Section */}
      <section className="dashboard-section">
        <h2>Verstehen</h2>
        <div className="learn-grid">
          <a href="https://nostr.how" target="_blank" rel="noopener noreferrer" className="learn-card">
            <span className="learn-icon">⚡</span>
            <h3>Was ist Nostr?</h3>
            <p>Dezentrales Protokoll erklärt</p>
          </a>
          <a href="https://primal.net" target="_blank" rel="noopener noreferrer" className="learn-card">
            <span className="learn-icon">📱</span>
            <h3>Primal App</h3>
            <p>Nostr-Client für Einsteiger</p>
          </a>
          <a href="https://damus.io" target="_blank" rel="noopener noreferrer" className="learn-card">
            <span className="learn-icon">🍎</span>
            <h3>Damus (iOS)</h3>
            <p>Nostr auf dem iPhone</p>
          </a>
        </div>
      </section>

      {/* Actions Section */}
      <section className="dashboard-section">
        <h2>Aktionen</h2>
        <div className="actions-grid">
          <button type="button" className="action-card" onClick={() => setShowInvite(true)}>
            <span className="action-icon">💌</span>
            <span className="action-label">Jemanden einladen</span>
          </button>
          <button type="button" className="action-card" onClick={handleExport}>
            <span className="action-icon">📥</span>
            <span className="action-label">Backup exportieren</span>
          </button>
          <button type="button" className="action-card" onClick={handleLogout}>
            <span className="action-icon">🚪</span>
            <span className="action-label">Abmelden</span>
          </button>
        </div>
      </section>

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <ProfileEditor 
          onClose={() => setShowProfileEditor(false)}
          onSave={() => {
            setUser(getUser());
            setShowProfileEditor(false);
          }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInvite(false)}>×</button>
            <h2>Jemanden einladen</h2>
            <p className="modal-intro">
              Teile Visionfusen mit Menschen, die auch frei sein wollen.
            </p>
            
            <div className="invite-link-box">
              <label>Dein persönlicher Einladungslink</label>
              <div className="invite-link-row">
                <code>{getInviteLink()}</code>
                <button onClick={copyInviteLink} className="btn-copy">
                  {inviteCopied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div className="share-buttons">
              <button onClick={() => shareVia('whatsapp')} className="share-btn whatsapp">
                WhatsApp
              </button>
              <button onClick={() => shareVia('telegram')} className="share-btn telegram">
                Telegram
              </button>
              <button onClick={() => shareVia('email')} className="share-btn email">
                Email
              </button>
              <button onClick={() => shareVia('twitter')} className="share-btn twitter">
                X / Twitter
              </button>
            </div>

            <p className="invite-note">
              💡 Wenn jemand über deinen Link beitritt, wissen wir, dass du ein Pionier bist.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
