# NIP-46 Bunker einrichten – Kurzanleitung

## Was du bekommst

- Dein privater Schlüssel (nsec) liegt verschlüsselt auf deiner eigenen Infrastruktur
- Kein Client hat je deinen nsec
- Du kannst dich von überall einloggen – sicher

## Voraussetzungen

- GitHub Account
- Railway Account (railway.app)
- Domain mit Cloudflare DNS
- Ca. 30 Minuten Zeit

## Schritt 1: NIP-46 Relay

1. Repository erstellen: https://github.com/[username]/nip46-relay-railway
2. Dateien von Vorlage kopieren
3. Railway → Deploy from GitHub
4. Volume: `/app/db`
5. Domain: `nip46.deinedomain.de` (DNS only!)

**Test:** `curl -H "Accept: application/nostr+json" https://nip46.deinedomain.de/`

## Schritt 2: Bunker

1. Fork: https://github.com/kind-0/nsecbunkerd
2. Anpassungen laut SKILL.md
3. Railway → Deploy from GitHub
4. **Branch auf `main` setzen!**
5. Volume: `/app/config`
6. Env: `ADMIN_NPUBS` + `DATABASE_URL`

## Schritt 3: Key hinzufügen

```bash
railway ssh
node dist/index.js add --name "meinname"
# Passphrase + nsec eingeben
exit
```

Env ergänzen:
- `NSECBUNKER_KEY=meinname`
- `NSECBUNKER_PASSPHRASE=...`

## Schritt 4: Autorisieren

Per SSH Token erstellen (siehe SKILL.md).

## Schritt 5: Verbinden

In noStrudel/Coracle:
```
bunker://<dein-hex-pubkey>?relay=wss://nip46.deinedomain.de&secret=<token>
```

Fertig. 🎉

## Backup nicht vergessen!

```
iv: ...
data: ...
passphrase: ...
```

Oder deinen nsec separat sichern.
