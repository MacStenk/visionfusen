import { useState, useEffect } from 'react';

interface ProfileData {
  username: string;
  npub: string;
  bio: string;
  website: string;
  lightning: string;
  links: Array<{ id: string; label: string; url: string }>;
  fediverse: string;
  memberSince: string;
}

export default function PublicProfile() {
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Get username from hash: /profil#steven
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setNotFound(true);
      return;
    }
    setUsername(hash);

    // Check localStorage for this user
    const stored = localStorage.getItem('visionfusen_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.user?.username === hash) {
          setProfile({
            username: data.user.username,
            npub: data.identity.nostr.npub,
            bio: data.profile?.bio || '',
            website: data.profile?.website || '',
            lightning: data.profile?.lightning || '',
            links: data.profile?.links || [],
            fediverse: data.profile?.fediverse || '',
            memberSince: data.user.createdAt
          });
          return;
        }
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
    setNotFound(true);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (notFound) {
    return (
      <div className="profile-not-found">
        <div className="not-found-icon">◈</div>
        <h1>Profil nicht gefunden</h1>
        <p>Das Profil existiert nicht oder ist nicht öffentlich.</p>
        <a href="/registrieren" className="btn-primary">Selbst beitreten</a>
      </div>
    );
  }

  if (!profile) {
    return <div className="profile-loading">Lädt...</div>;
  }

  return (
    <div className="public-profile">
      <div className="profile-header">
        <div className="profile-avatar">◈</div>
        <h1>{profile.username}</h1>
        <p className="profile-handle">@visionfusen.org</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="profile-member">Mitglied seit {formatDate(profile.memberSince)}</p>
      </div>

      <div className="profile-identities">
        <h2>Identitäten</h2>
        
        <div 
          className="identity-row clickable"
          onClick={() => copyToClipboard(`${profile.username}@visionfusen.org`, 'nostr')}
        >
          <span className="identity-icon">⚡</span>
          <div className="identity-info">
            <span className="identity-label">Nostr</span>
            <span className="identity-value">{profile.username}@visionfusen.org</span>
          </div>
          <span className="identity-action">{copied === 'nostr' ? '✓' : '📋'}</span>
        </div>

        <div 
          className="identity-row clickable"
          onClick={() => copyToClipboard(profile.npub, 'npub')}
        >
          <span className="identity-icon">🔑</span>
          <div className="identity-info">
            <span className="identity-label">Public Key</span>
            <span className="identity-value npub">{profile.npub.slice(0, 20)}...{profile.npub.slice(-8)}</span>
          </div>
          <span className="identity-action">{copied === 'npub' ? '✓' : '📋'}</span>
        </div>

        {profile.fediverse && (
          <a 
            href={`https://${profile.fediverse.replace('@', '').split('@')[1]}/@${profile.fediverse.replace('@', '').split('@')[0]}`}
            className="identity-row"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="identity-icon">🦣</span>
            <div className="identity-info">
              <span className="identity-label">Fediverse</span>
              <span className="identity-value">{profile.fediverse}</span>
            </div>
            <span className="identity-action">↗</span>
          </a>
        )}
      </div>

      {(profile.website || profile.links.length > 0) && (
        <div className="profile-links">
          <h2>Links</h2>
          
          {profile.website && (
            <a 
              href={profile.website}
              className="link-row"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="link-icon">🌐</span>
              <span className="link-label">Website</span>
              <span className="link-url">{profile.website.replace(/^https?:\/\//, '')}</span>
              <span className="link-action">↗</span>
            </a>
          )}

          {profile.links.map((link) => (
            <a 
              key={link.id}
              href={link.url}
              className="link-row"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="link-icon">🔗</span>
              <span className="link-label">{link.label}</span>
              <span className="link-url">{link.url.replace(/^https?:\/\//, '')}</span>
              <span className="link-action">↗</span>
            </a>
          ))}
        </div>
      )}

      {profile.lightning && (
        <div className="profile-lightning">
          <h2>Support</h2>
          <div 
            className="lightning-row clickable"
            onClick={() => copyToClipboard(profile.lightning, 'lightning')}
          >
            <span className="lightning-icon">⚡</span>
            <div className="lightning-info">
              <span className="lightning-label">Lightning Address</span>
              <span className="lightning-value">{profile.lightning}</span>
            </div>
            <span className="lightning-action">{copied === 'lightning' ? '✓ Kopiert!' : 'Kopieren'}</span>
          </div>
        </div>
      )}

      <div className="profile-footer">
        <p>
          Teil von <a href="/">Visionfusen</a> – Dekonditionierung für Mensch und Maschine.
        </p>
        <a href="/registrieren" className="btn-join">Auch beitreten</a>
      </div>
    </div>
  );
}
