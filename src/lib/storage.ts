// LocalStorage utilities for Visionfusen

export interface UserLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

export interface UserProfile {
  bio: string;
  website: string;
  lightning: string;
  links: UserLink[];
  fediverse: string;
  xmpp: string;
}

export interface UserData {
  user: {
    username: string;
    createdAt: string;
    daysSinceJoin?: number;
  };
  identity: {
    nostr: {
      npub: string;
      nsec_encrypted: string;
      npub_hex: string;
    };
  };
  profile: UserProfile;
  progress: {
    accountCreated: boolean;
    keysSaved: boolean;
    firstPost: boolean;
    firstMessage: boolean;
    invitedSomeone: boolean;
    profileCompleted: boolean;
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
      data.user.daysSinceJoin = diff + 1;
    }
    // Ensure profile exists (migration)
    if (!data.profile) {
      data.profile = {
        bio: '',
        website: '',
        lightning: '',
        links: [],
        fediverse: '',
        xmpp: ''
      };
    }
    // Ensure new progress fields exist
    if (data.progress.profileCompleted === undefined) {
      data.progress.profileCompleted = false;
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

export function updateProfile(profile: Partial<UserProfile>): void {
  const data = getUser();
  if (data) {
    data.profile = { ...data.profile, ...profile };
    // Check if profile is complete enough
    if (data.profile.bio || data.profile.website || data.profile.links.length > 0) {
      data.progress.profileCompleted = true;
    }
    saveUser(data);
  }
}

export function addLink(link: Omit<UserLink, 'id'>): void {
  const data = getUser();
  if (data) {
    const newLink: UserLink = {
      ...link,
      id: Date.now().toString()
    };
    data.profile.links.push(newLink);
    saveUser(data);
  }
}

export function removeLink(id: string): void {
  const data = getUser();
  if (data) {
    data.profile.links = data.profile.links.filter(l => l.id !== id);
    saveUser(data);
  }
}

// Get public profile data (safe to share)
export function getPublicProfile(data: UserData) {
  return {
    username: data.user.username,
    npub: data.identity.nostr.npub,
    bio: data.profile.bio,
    website: data.profile.website,
    lightning: data.profile.lightning,
    links: data.profile.links,
    fediverse: data.profile.fediverse,
    memberSince: data.user.createdAt
  };
}
