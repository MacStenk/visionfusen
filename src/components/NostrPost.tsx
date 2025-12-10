import { useState } from 'react';
import { finalizeEvent, verifyEvent } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';
import { getUser, updateProgress } from '../lib/storage';
import { decryptNsec } from '../lib/nostr';

const RELAYS = [
  'wss://relay.stevennoack.de',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

export default function NostrPost() {
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePost = async () => {
    if (!message.trim() || !password) return;

    const user = getUser();
    if (!user) {
      setStatus('error');
      setStatusMessage('Kein User gefunden');
      return;
    }

    setStatus('posting');
    setStatusMessage('Signiere...');

    try {
      // Decrypt the nsec
      const nsec = await decryptNsec(user.identity.nostr.nsec_encrypted, password);
      
      // Validate nsec format
      if (!nsec.startsWith('nsec1')) {
        throw new Error('Falsches Passwort');
      }

      // Decode nsec to get secret key bytes
      const { nip19 } = await import('nostr-tools');
      const decoded = nip19.decode(nsec);
      if (decoded.type !== 'nsec') {
        throw new Error('Ungültiger Schlüssel');
      }
      const secretKey = decoded.data as Uint8Array;

      // Create event
      const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: message.trim()
      };

      // Sign event
      const signedEvent = finalizeEvent(eventTemplate, secretKey);

      // Verify our own signature
      if (!verifyEvent(signedEvent)) {
        throw new Error('Signatur ungültig');
      }

      setStatusMessage('Sende an Relays...');

      // Send to relays
      let successCount = 0;
      const errors: string[] = [];

      for (const relayUrl of RELAYS) {
        try {
          const relay = await Relay.connect(relayUrl);
          await relay.publish(signedEvent);
          relay.close();
          successCount++;
        } catch (e) {
          errors.push(relayUrl);
        }
      }

      if (successCount > 0) {
        setStatus('success');
        setStatusMessage(`✓ Veröffentlicht auf ${successCount} Relay${successCount > 1 ? 's' : ''}`);
        setMessage('');
        setPassword('');
        setShowPassword(false);
        
        // Update progress
        updateProgress('firstPost', true);
      } else {
        throw new Error('Kein Relay erreichbar');
      }

    } catch (e: any) {
      setStatus('error');
      setStatusMessage(e.message || 'Fehler beim Posten');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handlePost();
    }
  };

  return (
    <div className="nostr-post">
      <h3>Posten auf Nostr</h3>
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Was möchtest du teilen?"
        rows={3}
        disabled={status === 'posting'}
        maxLength={500}
      />
      <div className="post-meta">
        <span className="char-count">{message.length}/500</span>
        <span className="post-hint">⌘+Enter zum Posten</span>
      </div>

      {!showPassword && message.trim() && (
        <button 
          type="button" 
          className="btn-show-password"
          onClick={() => setShowPassword(true)}
        >
          Weiter zum Posten
        </button>
      )}

      {showPassword && (
        <div className="password-section">
          <label htmlFor="post-password">Passwort zum Signieren</label>
          <input
            type="password"
            id="post-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Dein Visionfusen-Passwort"
            disabled={status === 'posting'}
          />
          <button
            type="button"
            className="btn-post"
            onClick={handlePost}
            disabled={!message.trim() || !password || status === 'posting'}
          >
            {status === 'posting' ? 'Wird gepostet...' : '⚡ Posten'}
          </button>
        </div>
      )}

      {status !== 'idle' && (
        <div className={`post-status ${status}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
