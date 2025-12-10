import { useState } from 'react';

type IdentityType = 'realname' | 'pseudonym';
type FormStep = 'form' | 'submitting' | 'submitted' | 'error';

export default function ApplicationForm() {
  const [step, setStep] = useState<FormStep>('form');
  const [identityType, setIdentityType] = useState<IdentityType>('realname');
  const [formData, setFormData] = useState({
    displayName: '',
    realName: '',
    email: '',
    reason: '',
    website: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (!formData.displayName.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }

    if (identityType === 'pseudonym' && !formData.realName.trim()) {
      setError('Bitte gib deinen echten Namen ein (nur für uns sichtbar)');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Bitte gib eine gültige Email-Adresse ein');
      return;
    }

    if (!formData.reason.trim() || formData.reason.trim().length < 20) {
      setError('Bitte erzähl uns etwas mehr darüber, warum du dabei sein möchtest');
      return;
    }

    setStep('submitting');

    try {
      // Sende an ntfy
      const response = await fetch('https://ntfy.stevennoack.de/visionfusen-bewerbungen', {
        method: 'POST',
        headers: {
          'Title': `Neue Bewerbung: ${formData.displayName}`,
          'Priority': '4',
          'Tags': 'bust_in_silhouette,sparkles',
          'Actions': `view, Email öffnen, mailto:${formData.email}`
        },
        body: `📋 NEUE BEWERBUNG

👤 Name: ${formData.displayName}
${identityType === 'pseudonym' ? `🔒 Echter Name: ${formData.realName}\n` : ''}📧 Email: ${formData.email}
🏷️ Typ: ${identityType === 'realname' ? 'Klarname' : 'Pseudonym'}
🔗 Website: ${formData.website || '-'}

💬 Warum Visionfusen:
${formData.reason}

---
Gesendet: ${new Date().toLocaleString('de-DE')}`
      });

      if (response.ok) {
        setStep('submitted');
      } else {
        throw new Error('Senden fehlgeschlagen');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut oder schreib direkt an hello@visionfusen.org');
      setStep('error');
    }
  };

  // Erfolgs-Ansicht
  if (step === 'submitted') {
    return (
      <div className="application-form">
        <div className="success-card">
          <div className="success-icon">📬</div>
          <h2>Bewerbung eingegangen!</h2>
          <p>
            Danke für dein Interesse an Visionfusen. Wir schauen uns jede Bewerbung 
            persönlich an.
          </p>
          
          <div className="status-box">
            <p>
              <strong>Status:</strong> Anwärter<br />
              <strong>Email:</strong> {formData.email}
            </p>
          </div>

          <p>
            Du bekommst eine Email, sobald wir deine Bewerbung geprüft haben. 
            Das dauert normalerweise 2-5 Tage.
          </p>

          <a href="/" className="btn-secondary">
            Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  // Fehler-Ansicht
  if (step === 'error') {
    return (
      <div className="application-form">
        <div className="success-card">
          <div className="success-icon">⚠️</div>
          <h2>Etwas ist schiefgelaufen</h2>
          <p>{error}</p>
          
          <button 
            onClick={() => setStep('form')} 
            className="btn-secondary"
            style={{ marginRight: '1rem' }}
          >
            Nochmal versuchen
          </button>
          
          <a href="mailto:hello@visionfusen.org" className="btn-secondary">
            Email schreiben
          </a>
        </div>
      </div>
    );
  }

  // Formular
  return (
    <div className="application-form">
      <h1>Bewerbung</h1>
      <p className="form-intro">
        Erzähl uns ein bisschen von dir. Wir prüfen jede Bewerbung persönlich – 
        das ist kein automatischer Prozess.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Identitäts-Auswahl */}
        <div className="input-group">
          <label>Wie möchtest du auftreten?</label>
          <div className="identity-choice">
            <label 
              className={`identity-option ${identityType === 'realname' ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="identity"
                value="realname"
                checked={identityType === 'realname'}
                onChange={() => setIdentityType('realname')}
              />
              <strong>Mit Klarnamen</strong>
              <span>Dein echter Name ist sichtbar</span>
            </label>
            
            <label 
              className={`identity-option ${identityType === 'pseudonym' ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="identity"
                value="pseudonym"
                checked={identityType === 'pseudonym'}
                onChange={() => setIdentityType('pseudonym')}
              />
              <strong>Mit Pseudonym</strong>
              <span>Nur wir kennen deinen echten Namen</span>
            </label>
          </div>
        </div>

        {/* Name/Pseudonym */}
        <div className="input-group">
          <label htmlFor="displayName">
            {identityType === 'realname' ? 'Dein Name' : 'Dein Pseudonym'}
          </label>
          <div className="input-with-suffix">
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder={identityType === 'realname' ? 'Max Mustermann' : 'z.B. Leselampe'}
              required
            />
            <span className="input-suffix">@visionfusen.org</span>
          </div>
          <p className="input-hint">
            {identityType === 'realname' 
              ? 'So wirst du in der Community sichtbar sein'
              : 'Dieses Pseudonym wird deine öffentliche Identität'
            }
          </p>
        </div>

        {/* Echter Name (nur bei Pseudonym) */}
        {identityType === 'pseudonym' && (
          <div className="input-group">
            <label htmlFor="realName">
              Dein echter Name
              <span className="input-optional">(nur für Hafenmeister sichtbar)</span>
            </label>
            <input
              type="text"
              id="realName"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              placeholder="Max Mustermann"
              required
            />
            <p className="input-hint">
              Wir brauchen deinen echten Namen für die Verifizierung. 
              Er wird niemals öffentlich angezeigt.
            </p>
          </div>
        )}

        {/* Email */}
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="max@beispiel.de"
            required
          />
          <p className="input-hint">
            Für die Benachrichtigung über deine Bewerbung
          </p>
        </div>

        {/* Motivation */}
        <div className="input-group">
          <label htmlFor="reason">Warum Visionfusen?</label>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Was interessiert dich an digitaler Souveränität? Was möchtest du hier finden oder beitragen?"
            required
          />
          <p className="input-hint">
            Keine Roman-Länge nötig. Ein paar Sätze reichen.
          </p>
        </div>

        {/* Website (optional) */}
        <div className="input-group">
          <label htmlFor="website">
            Website / Social
            <span className="input-optional">(optional)</span>
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://deine-website.de"
          />
          <p className="input-hint">
            Hilft uns, dich besser einzuschätzen
          </p>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button 
          type="submit" 
          className="btn-primary"
          disabled={step === 'submitting'}
        >
          {step === 'submitting' ? 'Wird gesendet...' : 'Bewerbung absenden'}
        </button>
      </form>
    </div>
  );
}
