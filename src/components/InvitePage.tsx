import { useState, useEffect } from 'react';

export default function InvitePage() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    setUsername(hash || null);
  }, []);

  return (
    <div className="invite-card">
      <div className="invite-icon">◈</div>
      
      <h1>Du wurdest eingeladen</h1>
      
      {username ? (
        <p className="invite-from">
          <strong>{username}</strong> möchte, dass du Teil von Visionfusen wirst.
        </p>
      ) : (
        <p className="invite-from">
          Du wurdest eingeladen, Teil von Visionfusen zu werden.
        </p>
      )}

      <div className="invite-quote">
        <p>Dekonditionierung. Für Mensch und Maschine.</p>
      </div>

      <p className="invite-text">
        Visionfusen ist eine Gemeinschaft für Menschen, die ihre digitale 
        Souveränität zurückgewinnen wollen. Keine Abhängigkeit von Plattformen. 
        Echtes Eigentum an deiner Identität.
      </p>

      <div className="invite-benefits">
        <div className="benefit">
          <span className="benefit-icon">⚡</span>
          <span>Deine Nostr-Identität</span>
        </div>
        <div className="benefit">
          <span className="benefit-icon">🔑</span>
          <span>Dein Private Key</span>
        </div>
        <div className="benefit">
          <span className="benefit-icon">👥</span>
          <span>Eine Community die hilft</span>
        </div>
      </div>

      <a href="/registrieren" className="btn-primary">
        Jetzt beitreten
      </a>

      <p className="invite-note">
        Kostenlos. Keine Werbung. Deine Daten bleiben deine.
      </p>
    </div>
  );
}
