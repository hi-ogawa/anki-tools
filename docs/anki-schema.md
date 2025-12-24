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

## Common Queries

```sql
-- Get all deck names for a specific notetype
SELECT DISTINCT decks.name
FROM cards
JOIN notes ON cards.nid = notes.id
JOIN decks ON cards.did = decks.id
WHERE notes.mid = ?;

-- Get notetype-deck associations
SELECT DISTINCT notes.mid, cards.did
FROM cards
JOIN notes ON cards.nid = notes.id;
```
