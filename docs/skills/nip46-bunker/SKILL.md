# NIP-46 Remote Signer (nsecbunker) Setup

## Übersicht

Diese Dokumentation beschreibt das Setup eines selbst-gehosteten NIP-46 Remote Signers. Der User's private Key (nsec) wird verschlüsselt auf eigener Infrastruktur gespeichert. Clients (noStrudel, Coracle, etc.) verbinden sich per NIP-46 Protokoll – der nsec verlässt nie den Bunker.

## Architektur

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Nostr Client   │────▶│  NIP-46 Relay        │◀────│  nsecbunkerd    │
│  (noStrudel)    │     │  (offen, no whitelist)│     │  (Remote Signer)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │  Verschlüsselter│
                                                     │  nsec (Volume)  │
                                                     └─────────────────┘
```

### Zwei Relays (wichtig!)

1. **Privates Relay** (z.B. `relay.domain.de`)
   - Whitelist aktiviert
   - Nur eigener pubkey kann schreiben
   - Für eigene Posts/Events

2. **NIP-46 Relay** (z.B. `nip46.domain.de`)
   - **Keine Whitelist** (kritisch!)
   - Offen für alle pubkeys
   - NIP-46 braucht bidirektionale Kommunikation
   - Client UND Bunker müssen schreiben können

## Teil 1: NIP-46 Relay Setup

### Repository erstellen

```
nip46-relay-railway/
├── Dockerfile
├── start.sh
├── README.md
└── .gitignore
```

### Dockerfile

```dockerfile
FROM rust:1.83-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    git \
    protobuf-compiler \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 https://github.com/scsibug/nostr-rs-relay.git .
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p /app/db

COPY --from=builder /build/target/release/nostr-rs-relay /app/nostr-rs-relay
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

### start.sh

```bash
#!/bin/bash
set -e

echo "🔗 NIP-46 Relay Startup..."

RELAY_URL="${RELAY_URL:-wss://localhost:8080}"
RELAY_NAME="${RELAY_NAME:-NIP-46 Relay}"
RELAY_DESCRIPTION="${RELAY_DESCRIPTION:-NIP-46 Remote Signer Relay}"
RELAY_PUBKEY="${RELAY_PUBKEY:-}"
RELAY_CONTACT="${RELAY_CONTACT:-}"
PORT="${PORT:-8080}"

cat > /app/config.toml << ENDCONFIG
[info]
relay_url = "${RELAY_URL}"
name = "${RELAY_NAME}"
description = "${RELAY_DESCRIPTION}"
pubkey = "${RELAY_PUBKEY}"
contact = "${RELAY_CONTACT}"

[database]
data_directory = "/app/db"

[network]
port = ${PORT}
address = "0.0.0.0"

[limits]
messages_per_sec = 10
subscriptions_per_client = 20
max_event_bytes = 131072
max_ws_message_bytes = 131072

[retention]
max_events = 10000
max_event_age_days = 7

[logging]
folder = "/app/db"
level = "info"
ENDCONFIG

echo "✅ Config generated!"
echo "🔓 Open relay for NIP-46 communication"

exec /app/nostr-rs-relay --config /app/config.toml
```

### Railway Deployment

1. Repository auf GitHub pushen
2. Railway → New Project → Deploy from GitHub
3. Volume hinzufügen: `/app/db`
4. Environment Variables:
   ```
   RELAY_URL=wss://nip46.deinedomain.de
   RELAY_NAME=NIP-46 Relay
   RELAY_DESCRIPTION=Remote Signer Relay
   RELAY_PUBKEY=<dein-hex-pubkey>
   RELAY_CONTACT=contact@deinedomain.de
   ```
5. Custom Domain: `nip46.deinedomain.de` (Cloudflare DNS only, kein Proxy!)

### Verifizieren

```bash
curl -H "Accept: application/nostr+json" https://nip46.deinedomain.de/
```

Sollte zeigen: `"restricted_writes": false`

## Teil 2: nsecbunkerd Setup

### Repository forken

Fork von: https://github.com/kind-0/nsecbunkerd

### Wichtige Änderungen

#### package.json

```json
{
  "dependencies": {
    "@nostr-dev-kit/ndk": "^2.18.0",
    "nostr-tools": "^2.7.0"
  }
}
```

#### scripts/init-config.js (neu erstellen)

```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const configPath = '/app/config/nsecbunker.json';

function generateAdminKey() {
  return crypto.randomBytes(32).toString('hex');
}

const defaultConfig = {
  "nostr": {
    "relays": [
      "wss://nip46.deinedomain.de"  // ANPASSEN!
    ]
  },
  "admin": {
    "npubs": [
      "npub1..."  // ANPASSEN! Dein Admin npub
    ],
    "adminRelays": [
      "wss://nip46.deinedomain.de"  // ANPASSEN!
    ],
    "key": generateAdminKey(),
    "notifyAdminsOnBoot": true
  },
  "database": "sqlite://nsecbunker.db",
  "logs": "./nsecbunker.log",
  "keys": {},
  "verbose": true,
  "version": "0.10.5"
};

if (!fs.existsSync(configPath)) {
  console.log('📝 Creating default config...');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log('✅ Config created at', configPath);
} else {
  console.log('✅ Config exists at', configPath);
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!config.admin || !config.admin.key) {
    console.log('🔑 Adding missing admin key...');
    if (!config.admin) config.admin = {};
    config.admin.key = generateAdminKey();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Admin key added');
  }
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const keyName = process.env.NSECBUNKER_KEY;
const keyIv = process.env.NSECBUNKER_KEY_IV;
const keyData = process.env.NSECBUNKER_KEY_DATA;

if (keyName && keyIv && keyData && !config.keys[keyName]) {
  console.log(`🔑 Adding key "${keyName}" from env vars...`);
  config.keys[keyName] = { iv: keyIv, data: keyData };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Key "${keyName}" added`);
} else if (keyName && config.keys[keyName]) {
  console.log(`✅ Key "${keyName}" already exists`);
}

console.log('📋 Current keys:', Object.keys(config.keys));
```

#### Dockerfile

```dockerfile
FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

RUN mkdir -p /app/config

EXPOSE 3000

CMD sh -c "node ./scripts/init-config.js && if [ -n \"$NSECBUNKER_KEY\" ]; then node ./scripts/start.js start --key $NSECBUNKER_KEY; else node ./scripts/start.js start; fi"
```

### Railway Deployment

1. Repository pushen
2. Railway → New Project → Deploy from GitHub
3. **WICHTIG:** Branch auf `main` setzen (nicht `master`)!
4. Volume hinzufügen: `/app/config`
5. Environment Variables (initial nur):
   ```
   ADMIN_NPUBS=npub1...
   DATABASE_URL=file:/app/config/nsecbunker.db
   ```

### Key hinzufügen (nach Deploy)

```bash
railway ssh --project=<project-id> --environment=<env-id> --service=<service-id>
```

Im Container:
```bash
node dist/index.js add --name "username"
# Passphrase eingeben
# nsec eingeben
```

Config prüfen:
```bash
cat /app/config/nsecbunker.json
```

Die `iv` und `data` Werte notieren für Backup!

### Environment Variables ergänzen

Nach dem Key hinzufügen:
```
NSECBUNKER_KEY=username
NSECBUNKER_PASSPHRASE=<die-eingegebene-passphrase>
```

Redeploy.

## Teil 3: User autorisieren

### Policy und Token erstellen (per SSH)

```bash
# Policy erstellen
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.policy.create({
  data: {
    name: 'full-access',
    rules: {
      create: [
        { method: 'connect' },
        { method: 'sign_event' },
        { method: 'nip04_encrypt' },
        { method: 'nip04_decrypt' },
        { method: 'nip44_encrypt' },
        { method: 'nip44_decrypt' },
        { method: 'get_public_key' }
      ]
    }
  }
}).then(console.log)
"

# Token erstellen
node -e "
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const token = crypto.randomBytes(16).toString('hex');
p.token.create({
  data: {
    token: token,
    keyName: 'username',
    policyId: 1,
    clientName: 'noStrudel',
    createdBy: 'admin'
  }
}).then(t => console.log('Token:', t.token))
"
```

### Verbinden

Im Client (noStrudel, Coracle, etc.):

```
bunker://<hex-pubkey>?relay=wss://nip46.deinedomain.de&secret=<token>
```

## Troubleshooting

### "Invalid bunker URI: remote is not a valid hex key"
- Client erwartet Hex, nicht npub
- Konvertieren: `npub1...` → Hex-Format

### "No relays found for filter"
- NDK Version zu alt → Update auf ^2.18.0

### "private key must be 32 bytes"
- Admin key fehlt in config
- init-config.js muss admin.key generieren

### "Failed to decrypt with env passphrase"
- Passphrase stimmt nicht
- Oder iv/data passen nicht zur Passphrase
- Lösung: Volume löschen, Key neu hinzufügen

### SSH "application not running"
- Service crasht → Logs checken
- Env vars prüfen (NSECBUNKER_KEY ohne Key im Volume?)

### Railway baut nicht neu
- Branch prüfen! `main` vs `master`
- Auto-deploy aktiviert?

### Client verbindet nicht
- Relay erreichbar? `curl -H "Accept: application/nostr+json" https://...`
- `restricted_writes: false`?
- Bunker Logs checken: kommt Anfrage an?

## Backup

Sichere diese Werte (Passwortmanager, offline):

```
iv: <aus config>
data: <aus config>
passphrase: <die du eingegeben hast>
```

Oder den original nsec separat.

## Glossar

- **nsec**: Privater Nostr-Schlüssel (bech32-Format)
- **npub**: Öffentlicher Nostr-Schlüssel (bech32-Format)
- **NIP-46**: Nostr Protocol für Remote Signing
- **Bunker**: Server der den nsec hält und Signing-Anfragen bearbeitet
- **Token**: Einmal-Code für Autorisierung neuer Clients
- **Policy**: Berechtigungen (welche Methoden erlaubt)
