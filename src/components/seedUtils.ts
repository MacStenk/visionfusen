// Seed und Key Utilities für Visionfusen
// Verwendet BIP39 für 12-Wort-Seed und leitet Nostr-Keys daraus ab

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';

// Generiert 12 Wörter (128 bit entropy)
export function generateSeed(): string {
  return generateMnemonic(wordlist, 128);
}

// Prüft ob Seed gültig ist
export function isValidSeed(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

// Leitet Private Key aus Seed ab
export function seedToPrivateKey(mnemonic: string): string {
  const seed = mnemonicToSeedSync(mnemonic);
  // Verwende SHA256 des Seeds als Private Key (32 bytes)
  const privateKeyBytes = sha256(seed.slice(0, 32));
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
