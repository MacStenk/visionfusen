// LocalStorage utilities for Visionfusen

export interface UserData {
  user: {
    username: string;
    createdAt: string;
    daysSinceJoin?: number;
  };
  identity: {
    nostr: {
      npub: string;
      nsec_encrypted: string; // Encrypted with user password
      npub_hex: string;
    };
  };
  progress: {
    accountCreated: boolean;
    keysSaved: boolean;
    firstPost: boolean;
    firstMessage: boolean;
    invitedSomeone: boolean;
  };
}

const STORAGE_KEY = 'visionfusen_user';

export function saveUser(data: UserData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored) as UserData;
    // Calculate days since join
    if (data.user.createdAt) {
      const created = new Date(data.user.createdAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      data.user.daysSinceJoin = diff + 1; // Day 1 on first day
    }
    return data;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function exportUserData(): string {
  const data = getUser();
  if (!data) return '';
  return JSON.stringify(data, null, 2);
}

export function importUserData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as UserData;
    // Basic validation
    if (!data.user?.username || !data.identity?.nostr?.npub) {
      return false;
    }
    saveUser(data);
    return true;
  } catch {
    return false;
  }
}

export function updateProgress(key: keyof UserData['progress'], value: boolean): void {
  const data = getUser();
  if (data) {
    data.progress[key] = value;
    saveUser(data);
  }
}
