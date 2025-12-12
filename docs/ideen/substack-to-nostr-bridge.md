# Substack → Nostr Bridge für Visionfusen

## Die Idee (Gegenrichtung)

Der Nostr Content Aggregator holt Nostr-Content ins Web2.
Diese Bridge macht das Gegenteil: **Substack-Autoren können ihre Artikel nach Nostr bringen.**

```
Nostr → VF → Web2/SEO (Content Aggregator)
Substack → VF → Nostr (Diese Bridge)
```

**Zwei Richtungen, ein Ziel: Autoren-Souveränität.**

## Das Problem für Substack-Autoren

### Heute: Lock-in

```
Du schreibst auf Substack → Substack besitzt die Beziehung zu deinen Lesern
                         → Substack kontrolliert Sichtbarkeit
                         → Export möglich, aber: wohin damit?
                         → Keine kryptografische Urheberschaft
                         → Du "behauptest" nur, dass es deins ist
```

### Die Angst

- Was wenn Substack dich sperrt?
- Was wenn Substack Regeln ändert?
- Was wenn Substack verkauft wird?
- Was wenn Substack die Preise erhöht?

**Dein Archiv ist in fremden Händen.**

## Die Lösung: VF als Nostr-On-Ramp

```
Substack-Artikel
      ↓
  VF Bridge
      ↓
Nostr (kind:30023)
      ↓
Kryptografisch signiert, auf deinen Relays, für immer deins
```

### Was passiert technisch

1. Autor verbindet Substack (RSS oder API)
2. VF pullt neue Artikel
3. Konvertiert nach Nostr-Format (kind:30023)
4. Signiert mit dem Key des Autors (via NIP-46 Bunker)
5. Publiziert auf die Relays des Autors
6. Optional: VF zeigt es auch auf visionfusen.org an

### Wichtig: Der Autor signiert selbst

VF signiert NICHT für den Autor. Das wäre Custodial.

Stattdessen:
- Autor hat seinen Bunker (nsecBunker, eigener Relay)
- VF sendet Signing-Request via NIP-46
- Autor bestätigt (oder Auto-Approve für diesen Use-Case)
- Signatur kommt vom Autor, nicht von VF

**Non-custodial. Echte Souveränität.**

## Warum Substack-Autoren das wollen

### 1. Backup mit Beweis

> "Selbst wenn Substack morgen verschwindet - deine Artikel sind auf Nostr, kryptografisch signiert, unveränderbar."

### 2. Ownership dokumentiert

Jeder Artikel hat:
- Timestamp (wann geschrieben)
- Signatur (von wem)
- Hash (was genau)

Das ist ein Beweis, der vor Gericht standhält.

### 3. Neue Reichweite

- Nostr-Nutzer entdecken dich
- VF Content Aggregator macht es SEO-sichtbar
- Doppelte Reichweite: Substack + Nostr + VF

### 4. Zaps statt nur Subscriptions

Substack: Monatliche Abos, Substack nimmt 10%
Nostr: Direktzahlungen per Lightning, 0% Gebühr

Ein Artikel geht viral? Du bekommst Zaps. Sofort. Direkt.

## Technische Architektur

### Input: Substack-Verbindung

```yaml
# config/substack-autoren.yaml
autoren:
  - npub: npub1cxa0fa6vmq5evwpgk8dg6ul99ny5e2nd3hy5fa72g598t39nxy0surzuva
    substack_url: stevennoack.substack.com
    bunker_url: bunker://...  # NIP-46 Connection
    auto_sync: true
    sync_historical: true  # Alte Artikel auch holen?
```

### Mapping: Substack → Nostr

| Substack | Nostr (kind:30023) |
|----------|-------------------|
| Title | title (Tag) |
| Subtitle | summary (Tag) |
| URL-Slug | d-tag |
| Post Date | published_at (Tag) |
| Body (HTML) | content (Markdown konvertiert) |
| Cover Image | image (Tag) |
| Tags | t-tags |
| Canonical URL | r-tag (Referenz) |

### Zusätzliche Nostr-Tags

```yaml
- ["client", "visionfusen-bridge"]
- ["source", "substack"]
- ["source:url", "https://stevennoack.substack.com/p/artikel-slug"]
- ["alt", "Artikel ursprünglich auf Substack publiziert, via VF nach Nostr gebracht"]
```

### Build-Prozess

```
1. GitHub Action / Cron (alle X Minuten)
2. Script liest substack-autoren.yaml
3. Für jeden Autor:
   a. Pull Substack RSS/API
   b. Vergleiche mit bestehenden Nostr-Artikeln
   c. Neue/geänderte Artikel → Konvertieren
   d. Signing-Request via NIP-46 an Bunker
   e. Publish auf Relays des Autors
4. Optional: Trigger VF Content Aggregator Rebuild
```

### Stack

- **Input**: Substack RSS oder API
- **Konvertierung**: Node.js (html-to-markdown)
- **Signing**: NIP-46 (nostr-tools)
- **Publishing**: nostr-tools
- **CI/CD**: GitHub Actions
- **Optional**: VF Aggregator Integration

## Features

### Basis
- [ ] Substack RSS Parser
- [ ] HTML → Markdown Konvertierung
- [ ] NIP-46 Bunker Integration
- [ ] kind:30023 Event Builder
- [ ] Relay Publishing
- [ ] Duplicate Detection (gleicher d-tag)

### Erweitert
- [ ] Historischer Import (alle alten Artikel)
- [ ] Update Detection (Artikel geändert)
- [ ] Bild-Handling (Substack CDN → Alternative?)
- [ ] Zap-Setup Wizard
- [ ] Analytics (welche Artikel wurden gesynced)

### Premium
- [ ] Automatische Bilder-Migration
- [ ] Custom Relay Setup
- [ ] Cross-posting Dashboard
- [ ] Substack Comments → Nostr (kind:1)?

## Abgrenzung

**Was die Bridge NICHT macht:**
- Keys verwahren (non-custodial)
- Für Autoren signieren
- Lock-in erzeugen
- Substack ersetzen (beides parallel möglich)

**Was die Bridge IST:**
- Eine Exit-Strategy aus Substack
- Ein Backup-System mit Beweis
- Eine On-Ramp in die Nostr-Welt
- Ein Werkzeug für Autoren-Souveränität

## Das Messaging für Substack-Autoren

> "Schreib weiterhin auf Substack. Aber lass jeden Artikel automatisch nach Nostr spiegeln - kryptografisch signiert, auf deinen Relays, für immer dein. Falls Substack morgen verschwinden sollte: Dein Archiv ist sicher."

### Keine Migration nötig

- Du musst Substack NICHT verlassen
- Du musst deine Leser NICHT umziehen
- Du musst NICHTS an deinem Workflow ändern
- Du aktivierst einfach ein Backup - mit Superkräften

### Der Elevator Pitch

> "Was wenn dein Substack-Archiv automatisch kryptografisch gesichert wäre? Jeder Artikel mit Beweis, dass DU ihn geschrieben hast. Wann. Was. Unveränderbar. Und nebenbei erreichst du eine neue Leserschaft auf Nostr. Kostet nichts. Keine Migration. Ein Setup, fertig."

## Synergien mit dem Content Aggregator

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISIONFUSEN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Substack ──┐                                                   │
│             │                                                   │
│  Medium ────┼──→ VF Bridge ──→ NOSTR ──→ VF Aggregator ──→ SEO │
│             │         ↑           │            ↓                │
│  Ghost ─────┘    NIP-46 Signing   │     visionfusen.org         │
│                                   │            │                │
│                                   │            ↓                │
│  Native Nostr ────────────────────┴──→ Suchmaschinen/LLMs      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Egal wo du schreibst - am Ende ist es auf Nostr UND SEO-sichtbar.**

## Vergleich: Mit und Ohne Bridge

| Ohne Bridge | Mit VF Bridge |
|-------------|---------------|
| Content auf Substack | Content auf Substack + Nostr |
| "Ich behaupte das ist meins" | Kryptografischer Beweis |
| Substack-Lock-in | Exit-Strategy jederzeit |
| 10% an Substack bei Paid | Zaps möglich (0% Gebühr) |
| Eine Audience | Zwei Audiences |
| Plattform-Risiko | Dezentrales Backup |

## Nächste Schritte

1. [ ] RSS-Parser für Substack (Proof of Concept)
2. [ ] HTML → Markdown Konverter testen
3. [ ] NIP-46 Integration (nsecBunker Setup nutzen)
4. [ ] Eigenen Substack als Test importieren
5. [ ] kind:30023 Event Builder
6. [ ] Relay Publishing testen
7. [ ] GitHub Action für Auto-Sync
8. [ ] Dokumentation für Onboarding

## Offene Fragen

- Substack API oder nur RSS? (API mächtiger, aber Auth nötig)
- Bilder: Substack CDN URLs behalten oder migrieren?
- Wie mit Paid-only Artikeln umgehen? (Paywall auf Nostr?)
- Wie mit Substack-internen Links umgehen?
- Update-Strategie: Neues Event oder altes überschreiben?

## Zusammenfassung

Der **Content Aggregator** macht Nostr für Web2 sichtbar.
Die **Substack Bridge** macht Web2-Content auf Nostr souverän.

Zusammen: **Autoren gewinnen in beide Richtungen.**

---

*Idee entstanden: 2025-12-12*
*Kontext: Erweiterung des Nostr Content Aggregator Konzepts*
*Autor: Steven Noack*
