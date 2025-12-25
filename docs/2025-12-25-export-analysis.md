# Export & Analysis Features

## Context

Support exporting Anki card data for external analysis (Excel, Python/pandas, etc.). Primary use case: analyzing vocabulary learning performance metrics like retention rate, ease distribution, and lapse patterns.

### Target Metrics

From user's TOPIK2 vocabulary analysis needs:

| Metric       | Source         | Current Status |
| ------------ | -------------- | -------------- |
| Ease factor  | `cards.factor` | Not exposed    |
| Lapse count  | `cards.lapses` | Not exposed    |
| Review count | `cards.reps`   | Not exposed    |
| Review time  | `revlog.time`  | Not exposed    |
| Flag status  | `cards.flags`  | Exposed        |
| Interval     | `cards.ivl`    | Exposed        |
| Queue status | `cards.queue`  | Exposed        |

## Design Decisions

### Scope of Export

**Option A: Current page only**

- Export visible rows
- Simple implementation
- Cons: Limited for large datasets

**Option B: All matching query** (chosen)

- Export all cards matching current search filter
- Consistent with bulk edit behavior
- More useful for analysis

### Export Format

**Option A: CSV only**

- Universal compatibility
- Simple to implement

**Option B: CSV + JSON** (chosen)

- CSV for spreadsheet analysis
- JSON for programmatic processing (Python, etc.)
- JSON preserves nested structure (fields object)

### Review Log Access

**Option A: Include in card export**

- Aggregate stats per card (avg review time, last review date)
- Pros: Single export, simpler
- Cons: Loses granular review history

**Option B: Separate review log export** (chosen)

- Full `revlog` data for selected cards
- Enables time-series analysis
- Can correlate with external events

**Option C: Both**

- Add summary stats to card data AND provide full revlog export
- Most flexible but more implementation work

## Data Model Changes

### Extended CardData

Add fields from Anki's `cards` table:

```typescript
interface CardData {
  // existing
  cardId: number;
  flag: number;
  queue: number;
  due: number;
  interval: number;

  // new
  ease: number;      // factor/10, e.g., 250 for 2.5x (stored as 2500 in DB)
  lapses: number;    // times card went to relearning
  reps: number;      // total review count
}
```

### Review Log Entry

New type for `revlog` table access:

```typescript
interface ReviewLogEntry {
  id: number;           // timestamp (epoch ms)
  cardId: number;       // card reference
  ease: number;         // button pressed: 1=Again, 2=Hard, 3=Good, 4=Easy
  interval: number;     // new interval after review
  lastInterval: number; // previous interval
  factor: number;       // ease factor at review time
  time: number;         // milliseconds spent
  type: number;         // 0=learn, 1=review, 2=relearn, 3=filtered
}
```

## Implementation

### Phase 1: Extend Card Data

#### Backend (`addon/server.py`)

Update `fetch_card_data()` to include additional fields:

```python
def fetch_card_data(card_ids: list[int]) -> list[dict]:
    # Add to SELECT: factor, lapses, reps
    # Transform factor: divide by 10 for percentage (2500 -> 250)
```

#### Frontend (`src/api.ts`)

Extend `CardData` type with new fields.

#### Frontend (`src/components/browse-table.tsx`)

Add optional columns:

- "Ease" - format as percentage (e.g., "250%")
- "Lapses" - integer count
- "Reps" - integer count

Column visibility toggleable like existing columns.

### Phase 2: Export Cards

#### Backend (`addon/server.py`)

New endpoint:

```python
def exportCards(query: str, format: str) -> dict:
    """
    Export all cards matching query.

    Args:
        query: Anki search query
        format: "csv" or "json"

    Returns:
        { data: str, count: int, format: str }

    For CSV: data is CSV string with headers
    For JSON: data is JSON array string
    """
```

Export includes:

- All note fields
- All card metadata (flag, queue, due, interval, ease, lapses, reps)
- Deck name, model name, tags

#### Frontend (`src/api.ts`)

```typescript
exportCards: (params: { query: string; format: "csv" | "json" }) =>
  invoke<{ data: string; count: number; format: string }>("exportCards", params)
```

#### Frontend (`src/root.tsx` or new component)

Export button in toolbar:

- Dropdown with format selection (CSV / JSON)
- Click triggers download
- Shows count in confirmation or toast

Download implementation:

```typescript
function downloadFile(data: string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Phase 3: SQL Query Mode (Advanced)

#### Rationale

Power users can write arbitrary SQL to answer questions the UI doesn't anticipate:

- Custom aggregations (avg ease, total lapses by deck)
- Complex joins (revlog + cards + notes)
- Ad-hoc filtering without learning Anki search syntax

#### Backend (`addon/server.py`)

New endpoint:

```python
def executeQuery(sql: str, params: list = None) -> dict:
    """
    Execute read-only SQL against collection.

    Args:
        sql: SELECT query (INSERT/UPDATE/DELETE rejected)
        params: Optional bind parameters

    Returns:
        {
          columns: list[str],      # column names
          rows: list[list[any]],   # result rows
          count: int,
          time_ms: float
        }

    Security:
        - Only SELECT statements allowed
        - Query runs in read-only mode
        - Timeout enforced (e.g., 5 seconds)
    """
```

Validation:

```python
def is_safe_query(sql: str) -> bool:
    normalized = sql.strip().upper()
    if not normalized.startswith("SELECT"):
        return False
    # Block dangerous keywords
    dangerous = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "ATTACH"]
    return not any(kw in normalized for kw in dangerous)
```

#### Frontend

New "SQL" tab or modal:

- Textarea for query input
- "Run" button
- Results table with dynamic columns
- Export results button (CSV)
- Query history (localStorage)

Example queries shown as templates:

```sql
-- Average ease and lapses for recent cards
SELECT
    COUNT(*) as total,
    ROUND(AVG(factor)/10.0, 1) as avg_ease,
    SUM(lapses) as total_lapses,
    SUM(CASE WHEN lapses > 0 THEN 1 ELSE 0 END) as cards_with_lapses
FROM cards c
WHERE c.queue >= 0  -- not suspended
  AND c.type > 0;   -- exclude new

-- Cards with low ease (problem cards)
SELECT n.flds, c.factor/10 as ease, c.lapses, c.ivl
FROM cards c
JOIN notes n ON c.nid = n.id
WHERE c.factor < 2000  -- ease < 200%
ORDER BY c.factor ASC
LIMIT 50;

-- Review time analysis from revlog
SELECT
    DATE(id/1000, 'unixepoch') as review_date,
    COUNT(*) as reviews,
    ROUND(AVG(time)/1000.0, 1) as avg_seconds
FROM revlog
GROUP BY review_date
ORDER BY review_date DESC
LIMIT 14;
```

### Phase 4: Review Log Export (Optional)

For users who need full review history beyond SQL queries.

#### Backend (`addon/server.py`)

New endpoint:

```python
def getReviewLog(query: str, limit: int = None) -> dict:
    """
    Get review history for cards matching query.

    Returns:
        {
          entries: list[ReviewLogEntry],
          count: int
        }
    """
    card_ids = col.find_cards(query)
    # Query revlog table: SELECT * FROM revlog WHERE cid IN (card_ids)
```

#### Frontend

- Option in export dropdown: "Export Review History"
- Separate download of review log data

## Files to Modify

### Phase 1

1. `addon/server.py` - add factor/lapses/reps to card query
2. `src/api.ts` - extend CardData type
3. `src/components/browse-table.tsx` - new columns (optional, hidden by default)
4. `docs/anki-schema.md` - document additional card fields

### Phase 2

1. `addon/server.py` - exportCards endpoint
2. `src/api.ts` - export API method
3. `src/root.tsx` - export button/dropdown in toolbar
4. `src/lib/download.ts` - download utility (new file, optional)

### Phase 3

1. `addon/server.py` - executeQuery endpoint with SQL validation
2. `src/api.ts` - query API method
3. `src/components/sql-console.tsx` - new SQL query UI component
4. `src/root.tsx` - SQL tab/modal integration
5. `docs/anki-schema.md` - document all tables for SQL users

### Phase 4

1. `addon/server.py` - getReviewLog endpoint
2. `src/api.ts` - review log types and API method
3. `src/root.tsx` - review history export option

## CSV Format

Example output:

```csv
cardId,noteId,deckName,modelName,tags,Front,Back,flag,queue,due,interval,ease,lapses,reps
1234567,9876543,TOPIK2,Basic,"vocab korean",안녕하세요,Hello,0,2,5,30,250,0,15
```

- Note fields are included dynamically based on model
- Tags joined with space
- Queue mapped to human-readable? Or keep numeric for analysis flexibility

## JSON Format

```json
[
  {
    "cardId": 1234567,
    "noteId": 9876543,
    "deckName": "TOPIK2",
    "modelName": "Basic",
    "tags": ["vocab", "korean"],
    "fields": {
      "Front": "안녕하세요",
      "Back": "Hello"
    },
    "flag": 0,
    "queue": 2,
    "due": 5,
    "interval": 30,
    "ease": 250,
    "lapses": 0,
    "reps": 15
  }
]
```

## Testing

### E2E Tests

1. Export CSV with search filter applied
2. Export JSON format
3. Verify downloaded file contains expected cards
4. Verify all fields present in export

### Manual Testing

1. Export TOPIK2 deck cards
2. Open in Excel/pandas
3. Filter by ease < 200, verify mostly 순우리말 (native Korean words)
4. Calculate retention rate from lapses/reps ratio

## Future Considerations

- **Streaming export** for very large datasets (>10k cards)
- **Scheduled exports** via add-on hook
- **In-app analytics** (charts, histograms) instead of export-only
- **Import** capability for edited data
