# Lieferdienst-Plattform – Admin-Dashboard und Fahrer-App

Verwaltungsseite einer Lieferdienst-Plattform. Das Projekt enthält zwei Bereiche, die gemeinsam gehostet werden: das **Admin-Dashboard** für Küche und Betreiber sowie die **Fahrer-App** für die Auslieferung. Die Bestellseite für Kunden liegt in einem separaten Projekt (`lieferdienst-plattform-kundenapp`).

## Überblick

```
Kunde bestellt  →  Küche sieht die Bestellung  →  Bestellung wird einem Fahrer zugewiesen
                                                              ↓
              Admin erhält das Bargeld  ←  Fahrer liefert aus und führt die Kasse
```

## Admin-Dashboard

### Bestellungen (Küchenansicht)
Alle eingehenden Bestellungen erscheinen hier live. Die Küche sieht, was zubereitet werden muss, und weist fertige Bestellungen einem Fahrer zu.

### Speisekarte verwalten
Eine eigene Seite zum Bearbeiten der Speisekarte:
- Kategorien anlegen, umbenennen und löschen
- Produkte hinzufügen, ändern und entfernen
- Preise und Beschreibungen anpassen

Änderungen sind sofort auf der Kundenseite sichtbar.

### Einstellungen
Hier legt der Betreiber Regeln fest, die direkt in die Bestelllogik der Kundenseite einfließen:

| Einstellung | Wirkung |
|---|---|
| Maximaler Bestellwert | Bestellungen über dem Limit werden abgelehnt |
| Maximale Lieferdistanz | Adressen außerhalb des Liefergebiets werden abgelehnt |
| Name des Unternehmens | Wird auf der Bestellseite und in den Bestellungen angezeigt |
| Öffnungszeiten | Außerhalb der Zeiten sind keine Bestellungen möglich |

### Rollen und Zugriff
Der Zugang ist rollenbasiert (Developer, Manager, Admin, Fahrer). Neue Nutzer registrieren sich nur über einen einmaligen Einladungslink.

## Fahrer-App

Die Fahrer-App ist für das Smartphone gedacht und zeigt nur das, was ein Fahrer unterwegs braucht.

### Meine Lieferungen
Der Fahrer sieht alle Bestellungen, die ihm aus der Küchenansicht zugewiesen wurden, inklusive Adresse und Bestellinhalt.

### Navigation
Pro Bestellung startet ein Button die Navigation zur Lieferadresse.

### Gelieferte Bestellungen
Eine eigene Seite listet alle bereits ausgelieferten Bestellungen auf.

### Kasse
Bei Barzahlung kassiert der Fahrer das Geld beim Kunden. Die Kasse zeigt ihm, wie viel Bargeld er eingenommen hat und am Ende an den Admin abgeben muss.

## Technologie

- Next.js (App Router), React, TypeScript
- PostgreSQL (Neon), gemeinsame Datenbank mit der Kundenseite
- Authentifizierung mit rollenbasierter Zugriffskontrolle
- Deployment auf Vercel

## Projektstruktur

| Projekt | Inhalt |
|---|---|
| `lieferdienst-plattform-kundenapp` | Bestellseite für Kunden |
| `lieferdienst-plattform-admin` | Admin-Dashboard und Fahrer-App (dieses Repository) |

