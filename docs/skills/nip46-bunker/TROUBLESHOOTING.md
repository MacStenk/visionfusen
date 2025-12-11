# NIP-46 Bunker – Bekannte Probleme & Lösungen

## Branch-Chaos (Railway + GitHub)

**Problem:** Railway deployed den falschen Branch (master statt main).

**Lösung:**
1. GitHub: Settings → Default Branch → `main`
2. Railway: Service Settings → Source → Branch → `main`
3. Push auf main: `git push origin main`

## Volume-Probleme

**Problem:** Config oder Key kaputt, Service crasht im Loop.

**Lösung:**
1. Volume in Railway löschen
2. Redeploy (neues leeres Volume wird erstellt)
3. Key neu hinzufügen per SSH

## Passphrase falsch

**Problem:** `Failed to decrypt with env passphrase`

**Ursache:** 
- Passphrase in Env stimmt nicht mit der beim `add` eingegebenen überein
- Oder iv/data wurden von einer anderen Passphrase generiert

**Lösung:**
1. Volume löschen
2. NSECBUNKER_KEY, NSECBUNKER_PASSPHRASE entfernen
3. Redeploy
4. SSH → Key neu hinzufügen mit neuer Passphrase
5. Env vars wieder setzen

## SSH geht nicht

**Problem:** `Your application is not running or in a unexpected state`

**Ursache:** Service crasht.

**Lösung:**
1. Logs checken
2. Meist: Env var Problem (Key gesetzt aber nicht im Volume)
3. NSECBUNKER_KEY entfernen, redeploy, dann SSH möglich

## Relay Whitelist

**Problem:** NIP-46 Verbindung kommt nicht an.

**Ursache:** Relay hat Whitelist aktiviert. NIP-46 braucht aber dass BEIDE Seiten schreiben können.

**Lösung:** Separates Relay ohne Whitelist für NIP-46:
```toml
# KEINE authorization section!
# KEIN pubkey_whitelist!
```

## npub vs Hex

**Problem:** `Invalid bunker URI: remote is not a valid hex key`

**Lösung:** Hex-Format verwenden, nicht npub.

Konvertierung:
- npub1abc... → Tool wie nak oder nostr-tools
- Oder: In Bunker Logs steht der Hex-Key

## NDK Version

**Problem:** `No relays found for filter` mit komischem Filter (authors = eigener pubkey)

**Ursache:** Alte NDK Version hat Bug.

**Lösung:** In package.json: `"@nostr-dev-kit/ndk": "^2.18.0"`

## Admin Key fehlt

**Problem:** `private key must be 32 bytes, hex or bigint, not undefined`

**Ursache:** Config hat keinen admin.key.

**Lösung:** init-config.js muss admin.key generieren:
```javascript
config.admin.key = crypto.randomBytes(32).toString('hex');
```

## Token vergessen

**Problem:** Verbindung zeigt "nicht autorisiert".

**Lösung:** Neuen Token erstellen und mit `&secret=<token>` verbinden.

## Relay disconnects

**Problem:** `Relay is disconnected, trying to connect`

**Ursache:** Normale Reconnects, meist kein Problem.

**Bei häufigen Disconnects:**
- Relay Logs checken
- Railway Region näher am User wählen
