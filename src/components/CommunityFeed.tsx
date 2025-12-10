import { useState, useEffect } from 'react';
import { SimplePool } from 'nostr-tools/pool';

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  content: string;
}

interface UserInfo {
  name: string;
  pubkey: string;
}

const RELAYS = [
  'wss://relay.stevennoack.de',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

export default function CommunityFeed() {
  const [posts, setPosts] = useState<NostrEvent[]>([]);
  const [users, setUsers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const loadCommunityPosts = async () => {
    try {
      // Fetch nostr.json to get all VF users
      const response = await fetch('/.well-known/nostr.json');
      if (!response.ok) {
        throw new Error('Konnte User-Liste nicht laden');
      }
      
      const data = await response.json();
      const names = data.names || {};
      
      // Build pubkey -> name map
      const userMap = new Map<string, string>();
      const pubkeys: string[] = [];
      
      for (const [name, pubkey] of Object.entries(names)) {
        userMap.set(pubkey as string, name);
        pubkeys.push(pubkey as string);
      }
      
      setUsers(userMap);

      if (pubkeys.length === 0) {
        setLoading(false);
        return;
      }

      // Create pool and subscribe to all VF users' posts
      const pool = new SimplePool();
      const events: NostrEvent[] = [];
      
      const sub = pool.subscribeMany(
        RELAYS,
        [
          {
            kinds: [1],
            authors: pubkeys,
            limit: 50
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
      }, 8000);

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
    loadCommunityPosts();
  };

  if (loading) {
    return (
      <div className="community-feed">
        <div className="feed-loading">
          <span className="loading-icon">◈</span>
          <p>Lade Community-Posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-feed">
        <div className="feed-error">
          <p>{error}</p>
          <button onClick={refresh} className="btn-refresh">Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="community-feed">
      <div className="community-header">
        <div className="community-stats">
          <span className="stat">{users.size} Mitglieder</span>
          <span className="stat">{posts.length} Posts</span>
        </div>
        <button onClick={refresh} className="btn-refresh-small" title="Aktualisieren">
          ↻
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="feed-empty">
          <p>Noch keine Posts in der Community.</p>
          <p className="feed-empty-hint">Sei der Erste!</p>
        </div>
      ) : (
        <div className="community-posts">
          {posts.map((post) => (
            <div key={post.id} className="community-post">
              <div className="post-author">
                <span className="author-icon">◈</span>
                <span className="author-name">{users.get(post.pubkey) || 'Unbekannt'}</span>
                <span className="author-handle">@visionfusen.org</span>
              </div>
              <div className="post-content">{post.content}</div>
              <div className="post-time">{formatDate(post.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
