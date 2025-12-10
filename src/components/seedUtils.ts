// Seed und Key Utilities für Visionfusen
// Verwendet BIP39 für 12-Wort-Seed und leitet Nostr-Keys daraus ab

import * as bip39 from '@scure/bip39';

// English wordlist inline (BIP39 standard)
// This avoids the problematic subpath import
const wordlist = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
  'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
  'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
  'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
  // ... truncated for brevity - we'll use dynamic import instead
];

// Eigene Hex-Konvertierung (statt @noble/hashes/utils)
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// SHA256 mit Web Crypto API (statt @noble/hashes/sha256)
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

// Lazy load wordlist to avoid SSR issues
let _wordlist: string[] | null = null;

async function getWordlist(): Promise<string[]> {
  if (_wordlist) return _wordlist;
  
  // Dynamic import works better for SSR
  const { wordlist } = await import('@scure/bip39/wordlists/english');
  _wordlist = wordlist;
  return _wordlist;
}

// Generiert 12 Wörter (128 bit entropy)
export async function generateSeed(): Promise<string> {
  const wordlist = await getWordlist();
  return bip39.generateMnemonic(wordlist, 128);
}

// Prüft ob Seed gültig ist
export async function isValidSeed(mnemonic: string): Promise<boolean> {
  const wordlist = await getWordlist();
  return bip39.validateMnemonic(mnemonic, wordlist);
}

// Leitet Private Key aus Seed ab (async wegen Web Crypto)
export async function seedToPrivateKey(mnemonic: string): Promise<string> {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  // Verwende SHA256 des Seeds als Private Key (32 bytes)
  const privateKeyBytes = await sha256(seed.slice(0, 32));
  return bytesToHex(privateKeyBytes);
}

// AES Verschlüsselung
export async function encryptData(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );

  return btoa(JSON.stringify({
    salt: Array.from(salt),
    iv: Array.from(iv),
    encrypted: Array.from(new Uint8Array(encrypted))
  }));
}

// AES Entschlüsselung
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const data = JSON.parse(atob(encryptedData));
  const salt = new Uint8Array(data.salt);
  const iv = new Uint8Array(data.iv);
  const encrypted = new Uint8Array(data.encrypted);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// Generiert Backup-Datei Inhalt
export function generateBackupFile(
  username: string,
  seed: string,
  nsec: string,
  npub: string
): string {
  const now = new Date().toLocaleString('de-DE');

  return `VISIONFUSEN BACKUP - GEHEIM AUFBEWAHREN!
==========================================

Erstellt am: ${now}

DEIN USERNAME
${username}@visionfusen.org

DEINE 12 WÖRTER (Seed)
${seed.split(' ').map((w, i) => `${(i + 1).toString().padStart(2, ' ')}. ${w}`).join('\n')}

DEIN NOSTR PRIVATE KEY (nsec)
${nsec}

DEIN NOSTR PUBLIC KEY (npub)
${npub}

==========================================
WICHTIG:
- Wer diese Datei hat, HAT deinen Account
- Teile sie mit NIEMANDEM
- Speichere sie NICHT in der Cloud
- Druck sie aus und lösche die Datei
- Verlierst du alles, ist dein Account WEG
==========================================
`;
}

// Download-Funktion für Backup-Datei
export function downloadBackup(content: string, username: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visionfusen-backup-${username}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Re-export für Kompatibilität
export { bytesToHex, hexToBytes };
