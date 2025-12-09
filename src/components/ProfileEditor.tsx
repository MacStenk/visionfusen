import { useState, useEffect } from 'react';
import { getUser, updateProfile, addLink, removeLink, type UserProfile, type UserLink } from '../lib/storage';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditor({ onClose, onSave }: Props) {
  const [profile, setProfile] = useState<UserProfile>({
    bio: '',
    website: '',
    lightning: '',
    links: [],
    fediverse: '',
    xmpp: ''
  });
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.profile) {
      setProfile(user.profile);
    }
  }, []);

  const handleSave = () => {
    updateProfile(profile);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSave();
    }, 1500);
  };

  const handleAddLink = () => {
    if (newLink.label && newLink.url) {
      const link: UserLink = {
        id: Date.now().toString(),
        label: newLink.label,
        url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`
      };
      setProfile(prev => ({
        ...prev,
        links: [...prev.links, link]
      }));
      setNewLink({ label: '', url: '' });
    }
  };

  const handleRemoveLink = (id: string) => {
    setProfile(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== id)
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Profil bearbeiten</h2>
        <p className="modal-intro">
          Diese Infos erscheinen auf deiner öffentlichen Profilseite.
        </p>

        <div className="profile-form">
          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio">Über dich</label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Kurze Bio, wer du bist..."
              rows={3}
              maxLength={200}
            />
            <span className="char-count">{profile.bio.length}/200</span>
          </div>

          {/* Website */}
          <div className="form-group">
            <label htmlFor="website">🌐 Website</label>
            <input
              type="url"
              id="website"
              value={profile.website}
              onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://deine-website.de"
            />
          </div>

          {/* Fediverse */}
          <div className="form-group">
            <label htmlFor="fediverse">🦣 Fediverse / Mastodon</label>
            <input
              type="text"
              id="fediverse"
              value={profile.fediverse}
              onChange={(e) => setProfile(prev => ({ ...prev, fediverse: e.target.value }))}
              placeholder="@user@mastodon.social"
            />
          </div>

          {/* Lightning */}
          <div className="form-group">
            <label htmlFor="lightning">⚡ Lightning Address</label>
            <input
              type="text"
              id="lightning"
              value={profile.lightning}
              onChange={(e) => setProfile(prev => ({ ...prev, lightning: e.target.value }))}
              placeholder="du@getalby.com"
            />
          </div>

          {/* Custom Links */}
          <div className="form-group">
            <label>🔗 Weitere Links</label>
            
            {profile.links.length > 0 && (
              <div className="links-list">
                {profile.links.map((link) => (
                  <div key={link.id} className="link-item">
                    <span className="link-label">{link.label}</span>
                    <span className="link-url">{link.url}</span>
                    <button 
                      type="button" 
                      className="link-remove"
                      onClick={() => handleRemoveLink(link.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-link-form">
              <input
                type="text"
                value={newLink.label}
                onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Label (z.B. Blog)"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="URL"
              />
              <button 
                type="button" 
                className="btn-add-link"
                onClick={handleAddLink}
                disabled={!newLink.label || !newLink.url}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            {saved ? '✓ Gespeichert!' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
