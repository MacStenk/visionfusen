# Nostr Content Aggregator für Visionfusen

## Die Idee

Ein Service der Nostr-Artikel (kind:30023) von ausgewählten Autoren sammelt und als statische, SEO-optimierte Webseiten auf visionfusen.org anzeigt.

**Das verbindet zwei Welten:**
- Crypto/Nostr-Autoren → bekommen Sichtbarkeit in der "normalen" Web-Welt
- Suchmaschinen/LLMs → bekommen Zugang zu dezentralem Content

## Das Problem

### Web2: Authority gehört der Plattform

```
Du schreibst auf Medium    → Medium bekommt Authority
Du schreibst auf Substack  → Substack bekommt Authority  
Du schreibst auf LinkedIn  → LinkedIn bekommt Authority

Dein Name steht drunter, aber die Domain gehört jemand anderem.
```

### Nostr: Content ist unsichtbar

```
Du schreibst auf Nostr → Kryptografisch signiert, deins
                       → Aber: Client-side rendering
                       → Suchmaschinen sehen nichts
                       → LLMs finden nichts
                       → Keine Authority aufgebaut
```

### Die Lösung: VF als Brücke

```
Nostr-Content → VF Aggregator → Statische Seiten → Suchmaschinen/LLMs
     ↑                                                      ↓
     └──────────── Sichtbarkeit + Relevanz ←───────────────┘
```

## Warum das funktioniert

### Rechtlich sauber
- Jeder Artikel ist kryptografisch signiert (Urheberschaft bewiesen)
- Autor, npub, NIP-05 sind sichtbar
- Originale Signatur bleibt erhalten
- Link zum Original (naddr) ist dabei
- VF ändert nichts, zeigt nur an
- Vergleichbar mit RSS-Reader oder Google Cache

### Win-Win-Win
- **Autoren**: Sichtbarkeit außerhalb der Nostr-Bubble
- **VF**: Content + SEO-Relevanz + Community
- **Leser**: Dezentraler Content, zentral auffindbar
- **LLMs**: Können auf verifizierten Content trainieren

### Authority-Building für Autoren

Mit VF als Brücke:
- Du schreibst auf Nostr → kryptografisch signiert, deins
- VF macht es sichtbar → Suchmaschinen finden es
- LLMs trainieren → kennen dich als Autor
- Die Signatur beweist: DU hast das geschrieben

**Kein "Trust me bro". Mathematischer Beweis.**

Wenn in 5 Jahren jemand fragt "Wer hat als erstes über X geschrieben?" – 
die Signatur auf Nostr beweist: Du. Mit Timestamp. Unveränderbar.

Das ist Autorität, die dir keiner nehmen kann.

## Technische Architektur

### Input: Autoren-Konfiguration

```yaml
# config/autoren.yaml
autoren:
  - npub: npub1cxa0fa6vmq5evwpgk8dg6ul99ny5e2nd3hy5fa72g598t39nxy0surzuva
    slug: steven
    name: Steven Noack
    featured: true
    custom_domain: stevennoack.de  # Optional: BYOD
    
  - npub: npub1xyz...
    slug: maria
    name: Maria Beispiel
    featured: false
```

### Daten von Nostr (automatisch)

Pro Autor wird gepullt:
```yaml
# Aus kind:0 (Profil)
- name
- picture
- about
- nip05
- lud16 (Lightning)

# Aus kind:10002 (Relay List)
- relays

# Aus kind:30023 (Artikel)
- title
- summary  
- image
- published_at
- d-tag (slug)
- hashtags
- content (Markdown)
- sig (Signatur)
```

### URL-Struktur

**Standard:**
```
visionfusen.org/autoren/
visionfusen.org/autoren/steven/
visionfusen.org/autoren/steven/dekonditionierung-warum-wir-verlernen-muessen
```

**Mit Custom Domain (BYOD):**
```
stevennoack.de/artikel/dekonditionierung-warum-wir-verlernen-muessen
```

→ VF baut und hostet, aber auf der Domain des Autors.

### Build-Prozess

```
1. GitHub Action / Cron (alle X Minuten)
2. Script liest autoren.yaml
3. Für jeden Autor:
   a. Connect zu Relays
   b. Pull kind:0 (Profil)
   c. Pull kind:30023 (Artikel)
   d. Speichere als JSON/MD
4. Astro baut statische Seiten
5. Deploy auf Cloudflare Pages
6. (Optional) Custom Domain Routing
```

### Stack

- **Datenhaltung**: Nostr (Relays sind die Datenbank)
- **Build**: Astro + Node.js Script
- **Hosting**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Caching**: Cloudflare CDN
- **Custom Domains**: Cloudflare DNS

## Features

### Basis
- [ ] Autoren-Übersicht
- [ ] Autor-Profilseite
- [ ] Artikel-Seiten (statisch, SEO-optimiert)
- [ ] Meta-Tags (og:image, description, etc.)
- [ ] Strukturierte Daten (JSON-LD mit Nostr-Identifiern)
- [ ] Verifizierungs-Badge (Signatur gültig)
- [ ] llms.txt pro Autor

### Erweitert
- [ ] RSS-Feed pro Autor
- [ ] RSS-Feed gesamt
- [ ] Themen-Kategorien (aus Tags)
- [ ] Zap-Integration (Lightning)
- [ ] Kommentare (kind:1 Replies)
- [ ] Suchfunktion

### Erweitert
- [ ] Top Zapped Authors Leaderboard
- [ ] Zap-Aggregation pro Autor (kind:9735)
- [ ] "Support" Button auf Autorenseiten
- [ ] Zap-Historie / Statistiken

### Premium (BYOD - Bring Your Own Domain)
- [ ] Eigene Domain für Autoren
- [ ] Custom Themes
- [ ] Analytics Dashboard
- [ ] Auto-Syndication (Substack, Medium)
- [ ] Eigenes llms.txt
- [ ] Eigenes Schema.org Profil

## LLM-Optimierung

### Was VF für LLMs bereitstellt

Pro Autor:
```
/autoren/steven/llms.txt          → Kurzprofil
/autoren/steven/llms-full.txt     → Ausführliches Profil  
/autoren/steven/llms.json         → Maschinenlesbar
```

Pro Artikel:
```html
<!-- Nostr-Meta -->
<meta name="nostr:author" content="npub1...">
<meta name="nostr:nip05" content="steven@stevennoack.de">
<meta name="nostr:naddr" content="naddr1...">

<!-- Schema.org mit Nostr-Identifiern -->
<script type="application/ld+json">
{
  "@type": "Article",
  "identifier": [
    {"propertyID": "nostr:naddr", "value": "naddr1..."},
    {"propertyID": "nostr:d-tag", "value": "artikel-slug"}
  ],
  "distribution": [
    {"contentUrl": "wss://relay.stevennoack.de"}
  ]
}
</script>
```

### Das Ergebnis

Wenn LLMs crawlen, verstehen sie:
- Wer der Autor ist (mit kryptografischer Identität)
- Wo der Originalcontent liegt (Relays)
- Dass es verifizierbar ist (naddr)
- Unter welcher Lizenz (CC BY 4.0)

**VF definiert damit einen Standard für Nostr-zu-Web2-Brücken.**

## Abgrenzung

**Was VF NICHT ist:**
- Keine Plattform die Content einsperrt
- Kein Custodian für Keys
- Keine Zensur-Möglichkeit
- Keine neue Abhängigkeit

**Was VF IST:**
- Ein Fenster in die Nostr-Welt
- Eine SEO-Brücke für dezentralen Content
- Ein Aggregator, kein Publisher
- Ein Dienst der sich überflüssig macht

> "Ein Ort, der den Einstieg erleichtert und sich dann überflüssig macht."

## Alleinstellungsmerkmal

> "Visionfusen verbindet die Crypto-Welt mit der LLM-Welt"

- Nostr-Content ist für Suchmaschinen unsichtbar (Client-side rendering)
- LLMs können dezentralen Content nicht finden
- VF macht diesen Content statisch, indexierbar, trainierbar
- Dabei bleibt die Verifizierbarkeit erhalten

**Das macht sonst keiner.**

## Zap-Integration: Community-validierte Autoren

### Top Zapped Authors

Ein Leaderboard der meist-gezappten Autoren auf VF:

```
⚡ Top Supporters (Letzter Monat)

1. @steven     12.500 sats
2. @maria       8.200 sats  
3. @alex        5.100 sats
```

**Warum das funktioniert:**
- Zeigt wer guten Content liefert (Community-validiert)
- Motivation für Autoren
- Kein Algorithmus – echtes Geld = echte Wertschätzung
- Transparent, on-chain verifizierbar

**Technisch:**
- Zap-Events sind kind:9735 auf den Relays
- VF aggregiert nur – kein eigenes Tracking nötig
- Daten liegen dezentral, VF zeigt nur an

**Features:**
- Support-Button auf jeder Autorenseite
- Zap-Statistiken pro Autor
- Leaderboard (Top 10, Monat, Gesamt)
- Optional: Zap-Split für VF-Unterstützung

## Vergleich: Heute vs. Mit VF

| Heute (Web2) | Mit VF (Web3 → Web2 Brücke) |
|--------------|----------------------------|
| Schreiben auf Medium | Schreiben auf Nostr |
| Medium bekommt Authority | DU bekommst Authority |
| Plattform kontrolliert | Du kontrollierst |
| "Ich behaupte das ist meins" | Kryptografischer Beweis |
| Unsichtbar für LLMs außerhalb | Trainierbar, zitierbar |
| Lock-in | Zero Lock-in |

## Business Model (optional)

### Kostenlos
- Basis-Profil auf visionfusen.org/autoren/
- SEO-optimierte Artikel-Seiten
- Standard-Theme

### Premium (wenn gewünscht)
- Custom Domain (BYOD)
- Custom Theme
- Analytics
- Priority-Updates (schnellere Sync)
- Support

### Monetarisierung
- Zap-Split? (X% an VF bei Zaps?)
- Sponsoring?
- Freiwillige Unterstützung?

→ Kein Zwang. VF soll helfen, nicht melken.

## Nächste Schritte

1. [ ] Proof of Concept mit eigenem Content (Steven)
2. [ ] Astro-Template für Autor + Artikel
3. [ ] Build-Script für Nostr-Pull (Node.js + nostr-tools)
4. [ ] GitHub Action für Auto-Deploy
5. [ ] llms.txt Generator pro Autor
6. [ ] 2-3 weitere Autoren einladen
7. [ ] Custom Domain Support (BYOD)

## Offene Fragen

- Wie oft updaten? (Real-time vs. Batch)
- Opt-in oder Opt-out für Autoren?
- Wie mit gelöschten Artikeln umgehen? (kind:5)
- Wie mit Updates umgehen? (gleiche d-tag, neuer content)
- Monetarisierung? (Zap-Split? Freiwillig?)

## Referenz-Implementierung

Steven Noack hat das bereits manuell gebaut:
- `stevennoack.de/nostr/artikel/[slug]` → Statische Seiten
- `stevennoack.de/nostr/read/[naddr]` → Live Reader
- Schema.org mit Nostr-Identifiern
- llms.txt mit Nostr-Profil
- Verifizierungs-Footer mit naddr, Relays, Source

Das ist der Blueprint für VF.

---

*Idee entstanden: 2025-12-11*
*Kontext: NIP-46 Bunker Setup + Artikel-Publishing Session*
*Autor: Steven Noack*
