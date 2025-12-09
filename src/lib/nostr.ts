// Nostr utilities for Visionfusen
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

export interface NostrKeyPair {
  nsec: string;      // Private key in bech32 format
  npub: string;      // Public key in bech32 format
  npubHex: string;   // Public key in hex (for nostr.json)
  nsecHex: Uint8Array; // Private key bytes (for encryption)
}

export function generateKeyPair(): NostrKeyPair {
  // Generate a new private key
  const secretKey = generateSecretKey();
  const publicKey = getPublicKey(secretKey);
  
  // Convert to bech32 format
  const nsec = nip19.nsecEncode(secretKey);
  const npub = nip19.npubEncode(publicKey);
  
  return {
    nsec,
    npub,
    npubHex: publicKey,
    nsecHex: secretKey
  };
}

// Simple encryption with password (XOR-based for MVP, NOT production-secure!)
// In production, use Web Crypto API with proper key derivation
export async function encryptNsec(nsec: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(nsec);
  const key = encoder.encode(password);
  
  // Simple XOR encryption (MVP only!)
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  
  // Convert to base64
  return btoa(String.fromCharCode(...encrypted));
}

export async function decryptNsec(encrypted: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = encoder.encode(password);
  
  // Decode from base64
  const data = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)));
  
  // XOR decrypt
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key[i % key.length];
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Validate npub format
export function isValidNpub(npub: string): boolean {
  try {
    const decoded = nip19.decode(npub);
    return decoded.type === 'npub';
  } catch {
    return false;
  }
}

// Validate nsec format
export function isValidNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec);
    return decoded.type === 'nsec';
  } catch {
    return false;
  }
}

// Get hex pubkey from npub
export function npubToHex(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === 'npub') {
      return decoded.data as string;
    }
    return null;
  } catch {
    return null;
  }
}
