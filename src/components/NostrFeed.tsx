import { useState, useEffect } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import { nip19 } from 'nostr-tools';
import { getUser } from '../lib/storage';

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  content: string;
}

const RELAYS = [
  'wss://relay.stevennoack.de',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

export default function NostrFeed() {
  const [posts, setPosts] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const user = getUser();
    if (!user) {
      setError('Kein User gefunden');
      setLoading(false);
      return;
    }

    try {
      // Get hex pubkey from npub
      const decoded = nip19.decode(user.identity.nostr.npub);
      if (decoded.type !== 'npub') {
        throw new Error('Ungültiger Public Key');
      }
      const pubkeyHex = decoded.data as string;

      // Create pool and subscribe
      const pool = new SimplePool();
      
      const events: NostrEvent[] = [];
      
      const sub = pool.subscribeMany(
        RELAYS,
        [
          {
            kinds: [1],
            authors: [pubkeyHex],
            limit: 20
          }
        ],
        {
          onevent(event) {
            events.push({
              id: event.id,
              pubkey: event.pubkey,
              created_at: event.created_at,
              content: event.content
            });
          },
          oneose() {
            // Sort by date, newest first
            events.sort((a, b) => b.created_at - a.created_at);
            setPosts(events);
            setLoading(false);
            sub.close();
          }
        }
      );

      // Timeout fallback
      setTimeout(() => {
        if (loading) {
          events.sort((a, b) => b.created_at - a.created_at);
          setPosts(events);
          setLoading(false);
          sub.close();
        }
      }, 5000);

    } catch (e: any) {
      setError(e.message || 'Fehler beim Laden');
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    if (hours < 24) return `vor ${hours} Std.`;
    if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const refresh = () => {
    setLoading(true);
    setPosts([]);
    setError(null);
    loadPosts();
  };

  if (loading) {
    return (
      <div className="nostr-feed">
        <div className="feed-header">
          <h3>Deine Posts</h3>
        </div>
        <div className="feed-loading">
          <span className="loading-icon">◈</span>
          <p>Lade Posts von Relays...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nostr-feed">
        <div className="feed-header">
          <h3>Deine Posts</h3>
        </div>
        <div className="feed-error">
          <p>{error}</p>
          <button onClick={refresh} className="btn-refresh">Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="nostr-feed">
      <div className="feed-header">
        <h3>Deine Posts</h3>
        <button onClick={refresh} className="btn-refresh-small" title="Aktualisieren">
          ↻
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="feed-empty">
          <p>Noch keine Posts.</p>
          <p className="feed-empty-hint">Schreibe oben deinen ersten Post!</p>
        </div>
      ) : (
        <div className="feed-posts">
          {posts.map((post) => (
            <div key={post.id} className="feed-post">
              <div className="post-content">{post.content}</div>
              <div className="post-time">{formatDate(post.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
