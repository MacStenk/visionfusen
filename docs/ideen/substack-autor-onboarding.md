# Substack-Autor Onboarding: Was braucht der Autor?

## Die Realität

Ein Substack-Autor will schreiben, nicht Crypto-Infrastruktur aufbauen.

```
Was der Autor will:    "Meine Artikel sichern, Souveränität gewinnen"
Was er NICHT will:     "Keys generieren, Bunker aufsetzen, Relays verstehen"
```

**VF muss die Komplexität verstecken, nicht erklären.**

## Was der Autor technisch braucht

### 1. Nostr-Identität (npub/nsec)

```
Ein Schlüsselpaar:
- npub (öffentlich) → Seine Identität auf Nostr
- nsec (privat) → Zum Signieren, NIEMALS teilen
```

**Das Problem:** Die meisten Substack-Autoren haben keins.

### 2. Bunker (NIP-46)

```
Ein Signing-Service:
- Hält den nsec sicher
- Signiert auf Anfrage
- Kann Anfragen auto-approven
```

**Das Problem:** Bunker aufsetzen ist technisch anspruchsvoll.

### 3. Relays

```
Mindestens 2-3 Relays:
- Wo die Artikel gespeichert werden
- Am besten eigener Relay (Souveränität)
- Plus öffentliche Relays (Reichweite)
```

**Das Problem:** Relay-Auswahl und -Setup überfordert Einsteiger.

### 4. Lightning Wallet (optional, aber empfohlen)

```
Für Zaps:
- Lightning Address (lud16)
- Wallet das Zaps empfangen kann
```

**Das Problem:** Noch eine Hürde.

## Die Lücke

| Was nötig ist | Wie schwer für Nicht-Techniker |
|---------------|-------------------------------|
| Schlüsselpaar generieren | Mittel (aber: was ist das?) |
| Bunker aufsetzen | Sehr schwer |
| Relays auswählen | Verwirrend |
| NIP-05 einrichten | Mittel |
| Lightning Wallet | Mittel bis schwer |

**Ergebnis:** Selbst motivierte Autoren scheitern an der Technik.

## VF als Service: Onboarding-as-a-Service

### Die Vision

```
Autor kommt zu VF:

"Ich schreibe auf Substack und will meine Artikel sichern."

VF antwortet:

"Okay. Gib mir deine Substack-URL. 
 In 10 Minuten hast du alles was du brauchst.
 Du musst nur einmal bestätigen."
```

### Was VF bereitstellt

#### Stufe 1: Managed Setup (Einstieg)

VF übernimmt das Setup, Autor behält Kontrolle:

```yaml
Was VF macht:
  - Generiert Schlüsselpaar (im Browser des Autors!)
  - Richtet Bunker ein (VF-hosted oder Empfehlung)
  - Konfiguriert Standard-Relays
  - Erstellt NIP-05 (autor@visionfusen.org)
  - Verbindet Substack RSS
  
Was der Autor macht:
  - Schlüssel sicher speichern (Seed Phrase)
  - Einmal bestätigen
  - Fertig
```

**Wichtig:** Der nsec wird im Browser generiert, VF sieht ihn nie.

#### Stufe 2: Guided Self-Custody (Fortgeschritten)

VF hilft beim eigenen Setup:

```yaml
Was VF bereitstellt:
  - Schritt-für-Schritt Anleitung
  - Video-Tutorials
  - Empfohlene Tools (Alby, nsecBunker, etc.)
  - Support bei Problemen
  
Was der Autor macht:
  - Eigenen Bunker aufsetzen
  - Eigene Relays wählen
  - Eigene Domain für NIP-05
```

#### Stufe 3: Full Sovereignty (Profi)

Autor hat alles selbst:

```yaml
Was der Autor hat:
  - Eigener Bunker (self-hosted)
  - Eigener Relay
  - Eigene Domain
  - Eigene Lightning Node
  
Was VF macht:
  - Nur die Bridge (Substack → Nostr)
  - Auf Anfrage des Autors
```

## Der Onboarding-Flow

### Für den Einsteiger (Stufe 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCHRITT 1: START                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  "Gib deine Substack-URL ein"                                   │
│                                                                  │
│  [ stevennoack.substack.com                    ] [Weiter]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  SCHRITT 2: IDENTITÄT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Wir haben dein Substack-Profil gefunden:                       │
│                                                                  │
│  Name: Steven Noack                                             │
│  Artikel: 47                                                    │
│                                                                  │
│  Jetzt erstellen wir deine Nostr-Identität.                     │
│  Diese 12 Wörter sind dein Backup - SICHER AUFBEWAHREN:        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ apple banana cherry dragon elephant frog guitar        │   │
│  │ hotel igloo jacket kite lemon                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [ ] Ich habe die Wörter sicher gespeichert                     │
│                                                                  │
│  [Weiter]                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SCHRITT 3: FERTIG                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Nostr-Identität erstellt                                     │
│  ✓ Bunker konfiguriert                                          │
│  ✓ Relays verbunden                                             │
│  ✓ Substack verknüpft                                           │
│                                                                  │
│  Deine Nostr-Adresse: steven@visionfusen.org                    │
│                                                                  │
│  Was passiert jetzt?                                            │
│  → Deine 47 Artikel werden nach Nostr importiert                │
│  → Neue Artikel werden automatisch gespiegelt                   │
│  → Alles kryptografisch signiert mit DEINEM Schlüssel          │
│                                                                  │
│  [Dashboard öffnen]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Zeit: ~10 Minuten

Der Autor muss nur:
1. Substack-URL eingeben
2. Seed Phrase sicher speichern
3. Bestätigen

**Das war's.**

## Was VF im Hintergrund macht

### Bei der Registrierung

```yaml
1. Substack-Profil pullen:
   - Name, Bio, Avatar
   - Artikel-Liste (RSS)
   
2. Schlüsselpaar generieren:
   - Im Browser des Autors (WebCrypto)
   - VF sieht den nsec NIE
   - Seed Phrase anzeigen
   
3. Bunker einrichten:
   - VF-hosted nsecBunker Instanz
   - Oder: Verbindung zu Alby Account
   - NIP-46 Connection String generieren
   
4. Relays konfigurieren:
   - VF Community Relay (für Backup)
   - 2-3 öffentliche Relays (für Reichweite)
   - kind:10002 Event publishen
   
5. Profil erstellen:
   - kind:0 mit Name, Bio, Avatar aus Substack
   - NIP-05 auf visionfusen.org
   - lud16 wenn Lightning vorhanden
```

### Bei jedem Sync

```yaml
1. Substack RSS prüfen
2. Neue Artikel → Konvertieren
3. Signing-Request an Bunker
4. Auf Relays publishen
5. Optional: VF Aggregator triggern
```

## Die Service-Levels

### Free Tier: "Sichere deine Artikel"

```yaml
Enthalten:
  - Nostr-Identität (wir helfen beim Setup)
  - NIP-05: autor@visionfusen.org
  - Standard-Relays
  - Auto-Sync von Substack
  - Basis-Dashboard
  
Nicht enthalten:
  - Eigene Domain
  - Eigener Relay
  - Priority Support
```

### Pro Tier: "Volle Kontrolle"

```yaml
Enthalten:
  - Alles aus Free
  - Eigene Domain für NIP-05
  - Eigener VF-Relay Zugang
  - Custom Relay Setup
  - Priority Sync
  - Support
  
Kosten:
  - Einmalig? Monatlich? Zap-based?
```

## Die Kommunikation

### Nicht so:

> "Du brauchst ein Nostr-Schlüsselpaar, einen NIP-46 kompatiblen Bunker, konfigurierte Relays und ein kind:10002 Event für deine Relay-Liste..."

### Sondern so:

> "In 10 Minuten sind alle deine Substack-Artikel gesichert. Kryptografisch bewiesen, dass DU sie geschrieben hast. Für immer. Du musst nur dein Backup-Passwort (12 Wörter) sicher aufbewahren."

### Der Pitch für Substack-Autoren

> **"Substack-Backup mit Superkräften"**
>
> Was wäre, wenn jeder deiner Artikel automatisch kryptografisch gesichert würde? Mit Beweis, dass DU ihn geschrieben hast. Wann. Was. Unveränderbar.
>
> Falls Substack morgen verschwinden sollte: Dein Archiv ist sicher.
>
> Setup: 10 Minuten. Danach läuft alles automatisch.

## Technische Optionen für den Bunker

### Option A: VF-Managed Bunker

```yaml
Pro:
  - Einfachstes Setup
  - VF kümmert sich um Uptime
  - Ein-Klick Aktivierung

Contra:
  - VF hat theoretisch Zugriff (Trust nötig)
  - Nicht "echte" Self-Custody
  
Für wen:
  - Einsteiger die schnell starten wollen
  - Autoren denen Einfachheit > maximale Souveränität
```

### Option B: Alby Account + NWC

```yaml
Pro:
  - Autor kontrolliert Alby Account
  - Lightning direkt integriert
  - Bekannte Marke

Contra:
  - Alby Account nötig
  - Ein zusätzlicher Service
  
Für wen:
  - Autoren die auch Zaps wollen
  - Leicht technisch versierte
```

### Option C: Self-Hosted Bunker

```yaml
Pro:
  - Volle Kontrolle
  - Maximale Souveränität
  - Kein Trust in Dritte

Contra:
  - Technisch anspruchsvoll
  - Server nötig
  - Wartung
  
Für wen:
  - Technisch versierte Autoren
  - Maximale Souveränität gewünscht
```

## Migration Path

```
Start: VF-Managed (einfach)
   ↓
Später: Alby/NWC (mehr Kontrolle)
   ↓
Profi: Self-Hosted (volle Souveränität)
```

**VF macht sich überflüssig.** Das ist das Ziel.

> "Ein Ort, der den Einstieg erleichtert und sich dann überflüssig macht."

## Nächste Schritte für VF

1. [ ] Onboarding-Flow designen (Figma/Wireframes)
2. [ ] Browser-basierte Key-Generierung (WebCrypto)
3. [ ] Bunker-Optionen evaluieren (managed vs. Alby vs. self-hosted)
4. [ ] NIP-05 Service auf visionfusen.org
5. [ ] Substack RSS Parser
6. [ ] Dashboard für Autoren (Sync-Status, Artikel-Liste)
7. [ ] Dokumentation für jeden Schritt

## Offene Fragen

- Bunker: Selbst hosten oder Partner (Alby)?
- Pricing: Free? Freemium? Zap-based?
- Relays: Eigener VF-Relay oder nur Empfehlungen?
- Support: Wie viel Hand-Holding ist realistisch?
- Seed Phrase: Wie sicherstellen, dass Autor sie wirklich speichert?

---

*Idee entstanden: 2025-12-12*
*Kontext: Onboarding-Hürden für Substack-Autoren*
*Autor: Steven Noack*
