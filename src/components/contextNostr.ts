// Nostr Event Utilities für Personal Context
// Kind 30078 = Application-specific data

import { PersonalContext, contextToEventContent } from './PersonalContext';

// Nostr Event Struktur
interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey?: string;
  id?: string;
  sig?: string;
}

// Event für Personal Context erstellen
export function createContextEvent(context: PersonalContext): NostrEvent {
  return {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', 'personal-context'],           // Unique identifier für diesen Typ
      ['client', 'visionfusen'],           // Welche App
      ['version', context.version],         // Schema-Version
      ['name', context.identity.name],      // Für einfaches Filtern
    ],
    content: contextToEventContent(context),
  };
}

// Event signieren und publishen (mit Extension)
export async function publishContextWithExtension(
  context: PersonalContext
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    if (!window.nostr) {
      return { success: false, error: 'Keine Nostr-Extension gefunden' };
    }

    const event = createContextEvent(context);
    
    // Extension signiert das Event
    const signedEvent = await window.nostr.signEvent(event);
    
    // An Relays publishen
    const relays = [
      'wss://relay.visionfusen.org',
      'wss://relay.damus.io',
      'wss://nos.lol',
    ];

    const results = await Promise.allSettled(
      relays.map(url => publishToRelay(url, signedEvent))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    if (successCount > 0) {
      return { success: true, eventId: signedEvent.id };
    } else {
      return { success: false, error: 'Konnte nicht zu Relays publishen' };
    }
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unbekannter Fehler' 
    };
  }
}

// Event mit lokalem Key signieren und publishen
export async function publishContextWithKey(
  context: PersonalContext,
  privateKeyHex: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const { finalizeEvent, getPublicKey } = await import('nostr-tools');
    
    const event = createContextEvent(context);
    const signedEvent = finalizeEvent(event, privateKeyHex);
    
    const relays = [
      'wss://relay.visionfusen.org',
      'wss://relay.damus.io',
      'wss://nos.lol',
    ];

    const results = await Promise.allSettled(
      relays.map(url => publishToRelay(url, signedEvent))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    if (successCount > 0) {
      return { success: true, eventId: signedEvent.id };
    } else {
      return { success: false, error: 'Konnte nicht zu Relays publishen' };
    }
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unbekannter Fehler' 
    };
  }
}

// Zu einem Relay publishen
async function publishToRelay(url: string, event: NostrEvent): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        ws.send(JSON.stringify(['EVENT', event]));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data[0] === 'OK' && data[1] === event.id) {
            clearTimeout(timeout);
            ws.close();
            resolve(data[2] === true);
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

// Context von Relays laden
export async function fetchContext(pubkey: string): Promise<PersonalContext | null> {
  const relays = [
    'wss://relay.visionfusen.org',
    'wss://relay.damus.io',
    'wss://nos.lol',
  ];

  for (const url of relays) {
    try {
      const event = await fetchFromRelay(url, pubkey);
      if (event) {
        const context = JSON.parse(event.content);
        if (context.version && context.identity) {
          return context as PersonalContext;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

// Von einem Relay laden
async function fetchFromRelay(url: string, pubkey: string): Promise<NostrEvent | null> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      let event: NostrEvent | null = null;
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(event);
      }, 5000);

      ws.onopen = () => {
        const filter = {
          kinds: [30078],
          authors: [pubkey],
          '#d': ['personal-context'],
          limit: 1,
        };
        ws.send(JSON.stringify(['REQ', 'context', filter]));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data[0] === 'EVENT' && data[1] === 'context') {
            event = data[2];
          }
          if (data[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(event);
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

// Lokal speichern (als Backup)
export function saveContextLocally(context: PersonalContext): void {
  localStorage.setItem('visionfusen_context', JSON.stringify(context));
  localStorage.setItem('visionfusen_context_updated', new Date().toISOString());
}

// Lokal laden
export function loadContextLocally(): PersonalContext | null {
  try {
    const stored = localStorage.getItem('visionfusen_context');
    if (stored) {
      return JSON.parse(stored) as PersonalContext;
    }
  } catch {
    // Ignore
  }
  return null;
}
