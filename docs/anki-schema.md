# Anki Database Schema

Quick reference for Anki's SQLite schema. See [AnkiDroid Wiki](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure) for full details.

## Entity Relationships

```mermaid
erDiagram
    notetypes ||--o{ notes : "mid"
    notes ||--o{ cards : "nid"
    decks ||--o{ cards : "did"

    notetypes {
        int id PK
        string name
    }

    notes {
        int id PK
        int mid FK "notetype"
        string flds "fields separated by 0x1f"
        string tags
    }

    cards {
        int id PK
        int nid FK "note"
        int did FK "deck"
        int ord "card template index"
        int queue "-1=suspended, 0=new, 1=learning, 2=review"
        int due
        int ivl "interval in days"
        int flags "0-7 flag colors"
    }

    decks {
        int id PK
        string name
    }
```

## Key Relationships

- **notes.mid** → notetypes.id (note type / model)
- **cards.nid** → notes.id (parent note)
- **cards.did** → decks.id (deck assignment)

## Design Note: Notetype-First Browsing

A single deck can contain cards from **multiple notetypes**. Decks are just containers with no direct relationship to notetypes.

However, this browser uses **notetype-first** browsing:

1. Select a notetype first
2. Table columns are derived from that notetype's fields
3. Deck filter shows decks containing cards of the selected notetype

This design is intentional - each notetype has different fields (Basic: Front/Back, Cloze: Text/Extra, etc.), so we must know the notetype to render appropriate columns. The tradeoff is you browse one notetype at a time, not "all cards in a deck".
