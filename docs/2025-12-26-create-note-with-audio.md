# Create Note with Audio Generation

Feature: Allow creating new Anki notes with auto-generated audio using edge-tts.

## Anki TTS Options

### Option 1: Built-in TTS (on-the-fly)

Anki supports runtime TTS via card templates:

```
{{tts ko_KR:korean}}
```

or

```
[anki:tts lang=ko_KR]{{korean}}[/anki:tts]
```

Audio is generated **during card review** using OS-level TTS engines (Windows SAPI, macOS Speech, etc.). No files stored.

| Pros                         | Cons                                     |
| ---------------------------- | ---------------------------------------- |
| No storage needed            | Quality depends on OS TTS engine         |
| Auto-updates if text changes | Doesn't work on AnkiWeb                  |
| Zero setup for note creation | Requires TTS on each device              |
|                              | Korean voice quality/availability varies |

### Option 2: Pre-generated audio files (chosen approach)

Store `[sound:filename.mp3]` in a field, with MP3 in media folder.

| Pros                                 | Cons                                |
| ------------------------------------ | ----------------------------------- |
| Consistent high-quality voices       | Takes storage space                 |
| Works everywhere (AnkiWeb, mobile)   | Manual regeneration if text changes |
| Offline-capable                      |                                     |
| edge-tts Korean voices are excellent |                                     |

### Decision: Hybrid Approach

Use **both** methods with card template fallback:

1. **Primary**: Pre-generated audio with edge-tts (when available)
2. **Fallback**: Built-in TTS when audio field is empty

**Card template pattern:**

```
{{#korean_audio}}
{{korean_audio}}
{{/korean_audio}}
{{^korean_audio}}
{{tts ko_KR:korean}}
{{/korean_audio}}
```

Same for example sentences:

```
{{#example_ko_audio}}
{{example_ko_audio}}
{{/example_ko_audio}}
{{^example_ko_audio}}
{{tts ko_KR:example_ko}}
{{/example_ko_audio}}
```

**Benefits:**

- New cards work immediately with built-in TTS (no audio generation needed)
- Can upgrade to edge-tts audio later for better quality
- Graceful degradation if audio file is missing
- No app changes required for basic TTS - just template modification

**When to use each:**

| Scenario                   | Approach                                       |
| -------------------------- | ---------------------------------------------- |
| Quick note creation        | Leave `_audio` fields empty → built-in TTS     |
| High-quality audio needed  | Generate with edge-tts → fill `_audio` fields  |
| Offline/AnkiWeb usage      | Pre-generate audio (built-in TTS may not work) |

References:

- [Anki Manual - Field Replacements](https://docs.ankiweb.net/templates/fields.html)
- [AnkiMobile TTS](https://docs.ankimobile.net/tts.html)

---

## Context

- **Current workflow**: Manual terminal-based process (see `misc/korean/anki/prompts/manual.md`)
  - Extract vocabulary from screenshots/notes
  - Generate TSV with card fields
  - Run `scripts/generate-audio.py` for TTS
  - Run `scripts/anki-add-notes.py` to add to Anki
  - Copy audio files to media folder
- **Goal**: Move this workflow into the anki-browse-web addon
- **edge-tts**: Installed, Korean voices: `ko-KR-SunHiNeural` (female), `ko-KR-InJoonNeural` (male)

## Anki Python API

### Media Management

```python
col.media.dir()                        # Get media directory path
col.media.write_data(filename, bytes)  # Write bytes, returns actual filename (handles dedup)
col.media.add_file(path)               # Add from file path
col.media.have(fname)                  # Check if file exists
```

### Note Creation

```python
model = col.models.by_name("Korean Vocabulary")
deck = col.decks.by_name("Korean::Custom")
note = col.new_note(model)
note.fields[0] = "value"  # Set by index
note.tags = ["tag1", "tag2"]
col.add_note(note, deck["id"])  # Returns OpChangesWithCount
```

### Schema (already exposed via `getSchema`)

```python
{
  "models": {"Model Name": ["field1", "field2", ...]},
  "decks": ["Deck1", "Deck2"],
  "tags": ["tag1", "tag2"]
}
```

## MVP Scope

### In Scope

1. Schema-driven form: user selects note type + deck first, fields derived dynamically
2. Audio field configuration: user specifies which fields should have audio generated
3. Generate audio via edge-tts subprocess
4. Add note to Anki using proper Python API
5. Write audio to media folder using `col.media.write_data()`

### Out of Scope (Future)

- Voice selection UI (use sensible default: `ko-KR-SunHiNeural`)
- Audio preview before saving
- Bulk note creation from TSV/JSON
- Edit existing note audio

## Implementation Plan

### Phase 1: Backend API (`addon/server.py`)

**1.1 Add `addNote` action**

```python
elif action == "addNote":
    deck_name = params["deckName"]
    model_name = params["modelName"]
    fields = params["fields"]  # dict of field name -> value
    tags = params.get("tags", [])

    model = col.models.by_name(model_name)
    if not model:
        raise ValueError(f"Model not found: {model_name}")
    deck = col.decks.by_name(deck_name)
    if not deck:
        raise ValueError(f"Deck not found: {deck_name}")

    note = col.new_note(model)
    field_names = [f["name"] for f in model["flds"]]
    for name, value in fields.items():
        if name in field_names:
            note.fields[field_names.index(name)] = value
    note.tags = tags

    col.add_note(note, deck["id"])
    return {"noteId": note.id}
```

**1.2 Add `generateAudio` action**

Generate audio and write directly to media folder using Anki API:

```python
elif action == "generateAudio":
    text = params["text"]
    filename = params["filename"]  # e.g., "korean_custom_123.mp3"
    voice = params.get("voice", "ko-KR-SunHiNeural")

    if not text.strip():
        raise ValueError("Text cannot be empty")

    # Generate to temp file, then use Anki's media API
    import subprocess
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        subprocess.run([
            "edge-tts",
            "--voice", voice,
            "--text", text,
            "--write-media", tmp_path,
        ], check=True, capture_output=True)

        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()

        # Use Anki's media API - handles dedup/renaming
        actual_filename = col.media.write_data(filename, audio_bytes)
        return {"filename": actual_filename}
    finally:
        os.unlink(tmp_path)
```

### Phase 2: Frontend UI

**2.1 UI Flow**

```
[Create Note Button] → [Modal/Dialog opens]
    ↓
[Step 1: Select Model + Deck]
    - Dropdown for note type (from schema.models)
    - Dropdown for deck (from schema.decks)
    ↓
[Step 2: Configure Audio Fields]
    - Show checkboxes for each field: "Generate audio for this field"
    - User checks which fields should have TTS
    - Also configure: target field for audio reference (e.g., korean → korean_audio)
    ↓
[Step 3: Fill Fields]
    - Dynamic form based on selected model's fields
    - Fields marked for audio show indicator
    ↓
[Submit]
    - Generate audio for marked fields
    - Create note with [sound:filename.mp3] references
```

**2.2 Audio Field Configuration**

For Korean Vocabulary, typical mapping:
| Source Field | Audio Target Field | Filename Pattern |
|--------------|-------------------|------------------|
| `korean` | `korean_audio` | `korean_{number}.mp3` |
| `example_ko` | `example_ko_audio` | `example_ko_{number}.mp3` |

This mapping could be:

- Option A: Hardcoded convention (fields ending in `_audio` get generated from base field)
- Option B: User configures mapping in UI
- Option C: Stored as user preference per model

**Recommendation for MVP**: Option A - convention-based. If field `X_audio` exists, offer to generate audio from field `X`.

**2.3 Components**

| Component                 | Purpose                               |
| ------------------------- | ------------------------------------- |
| `create-note-dialog.tsx`  | Modal wrapper                         |
| `model-deck-selector.tsx` | Step 1: model + deck selection        |
| `dynamic-note-form.tsx`   | Step 3: renders fields based on model |

### Phase 3: API Contract

**Request: Add Note**

```typescript
interface AddNoteParams {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
}
```

**Request: Generate Audio**

```typescript
interface GenerateAudioParams {
  text: string;
  filename: string;
  voice?: string;  // default: ko-KR-SunHiNeural
}
```

**Composite Flow (Frontend orchestrates)**

```typescript
async function createNoteWithAudio(params: {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  audioFields: Array<{
    sourceField: string;      // e.g., "korean"
    targetField: string;      // e.g., "korean_audio"
    filenamePrefix: string;   // e.g., "korean_"
  }>;
}) {
  const noteId = generateUniqueId();  // or use fields.number

  // Generate audio files
  for (const af of params.audioFields) {
    const text = params.fields[af.sourceField];
    if (text) {
      const filename = `${af.filenamePrefix}${noteId}.mp3`;
      await api.generateAudio({ text, filename });
      params.fields[af.targetField] = `[sound:${filename}]`;
    }
  }

  // Create note
  return api.addNote(params);
}
```

## File Changes

| File                                    | Change                                       |
| --------------------------------------- | -------------------------------------------- |
| `addon/server.py`                       | Add `addNote`, `generateAudio` actions       |
| `src/api.ts`                            | Add `addNote`, `generateAudio` API functions |
| `src/components/create-note-dialog.tsx` | New: modal for create flow                   |
| `src/components/dynamic-note-form.tsx`  | New: schema-driven form                      |
| `src/root.tsx`                          | Add create note button to toolbar            |

## Technical Considerations

### Thread Safety

- edge-tts subprocess blocks server thread (~0.5-2s per audio)
- Acceptable for MVP, consider async if needed

### Error Handling

- edge-tts not found → clear error message with install instructions
- Empty text → skip audio generation for that field
- Network failure (edge-tts uses Azure) → surface error to user

### ID Generation

For `number` field (used in filename):

- Format: `{prefix}_{timestamp}` e.g., `manual_1735200000`
- User provides prefix, timestamp auto-appended
- Guarantees uniqueness

## Open Questions for Discussion

1. **Audio field mapping UI**: How should user specify which fields get audio?
   - A: Convention-based (`X` → `X_audio` if exists)
   - B: Explicit UI with dropdowns
   - C: Per-model saved preferences

2. **Form persistence**: Save form state to localStorage for quick re-entry?

3. **Validation**: Should we validate required fields client-side based on model config, or let Anki reject?
