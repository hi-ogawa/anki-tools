# Audio Generation Feature

Generate TTS audio for note fields using edge-tts.

## Overview

The card templates use conditional audio with TTS fallback:

```
{{#korean_audio}}
{{korean_audio}}
{{/korean_audio}}
{{^korean_audio}}
{{tts ko_KR:korean}}
{{/korean_audio}}
```

This feature allows generating audio files to populate `*_audio` fields, replacing the fallback TTS with pre-generated audio.

## User Flow

1. User selects a note in the browse table
2. In the detail panel, fields ending with `_audio` show a generate button (when empty)
3. Click button → generates audio via edge-tts → saves to Anki media → populates field
4. Card now plays generated audio instead of fallback TTS

## UI Design

### Detail Panel

For fields matching `{base}_audio` pattern:

```
Field: korean_audio (empty, source field has content)
┌─────────────────────────────────────────────────────┐
│ [empty]                                 [✏️] [🔊]  │
└─────────────────────────────────────────────────────┘
                                                 │
                                                 └─ Tooltip: "Generate audio from 'korean' field"

Field: korean_audio (has value)
┌─────────────────────────────────────────────────────┐
│ [sound:korean_123.mp3]                  [✏️]       │
└─────────────────────────────────────────────────────┘
```

**Button visibility conditions:**

- Field name matches `{base}_audio` pattern
- Source field `{base}` exists in the note
- Source field `{base}` is non-empty
- Target field `{base}_audio` is empty

### Audio Settings

Stored in localStorage (`anki-tools:audio-settings`):

```typescript
interface AudioSettings {
  voice: string; // default: "ko-KR-SunHiNeural"
}
```

Settings UI accessible from the main interface (gear icon or similar).

| Setting | Type   | Default             | Options                                                   |
| ------- | ------ | ------------------- | --------------------------------------------------------- |
| Voice   | select | `ko-KR-SunHiNeural` | `ko-KR-SunHiNeural` (female), `ko-KR-InJoonNeural` (male) |

## Architecture

```
┌─────────────┐      POST /api           ┌──────────────┐
│  Frontend   │  ───────────────────────▶│   Backend    │
│  (button)   │  {action: generateAudio, │  (server.py) │
│             │   text, voice, filename} │              │
└─────────────┘                          └──────┬───────┘
                                                │
                                    subprocess  │  edge-tts
                                                ▼
                                         ┌──────────────┐
                                         │  /tmp/*.mp3  │
                                         └──────┬───────┘
                                                │
                                    col.media   │  write_data()
                                                ▼
                                         ┌──────────────┐
                                         │ collection   │
                                         │   .media/    │
                                         └──────────────┘
```

## API

### `generateAudio` Action

**Request:**

```json
{
  "action": "generateAudio",
  "params": {
    "text": "안녕하세요",
    "voice": "ko-KR-SunHiNeural",
    "filenameHint": "MyDeck_2025_12_29_10_30_45"
  }
}
```

**Response:**

```json
{
  "result": {
    "filename": "MyDeck_2025_12_29_10_30_45.mp3",
    "soundRef": "[sound:MyDeck_2025_12_29_10_30_45.mp3]"
  }
}
```

**Errors:**

- `edge-tts not found` - edge-tts CLI not installed
- `empty text` - source text is empty
- `generation failed` - edge-tts process failed

## Implementation

### Backend (`addon/server.py`)

```python
elif action == "generateAudio":
    text = params["text"]
    voice = params.get("voice", "ko-KR-SunHiNeural")
    filename_hint = params["filenameHint"]

    # Generate to temp file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        temp_path = f.name

    try:
        subprocess.run(
            ["edge-tts", "--voice", voice, "--text", text, "--write-media", temp_path],
            check=True,
            capture_output=True,
        )

        # Read and store in Anki media
        with open(temp_path, "rb") as f:
            audio_bytes = f.read()

        filename = f"{filename_hint}.mp3"
        actual_filename = col.media.write_data(filename, audio_bytes)

        return {
            "filename": actual_filename,
            "soundRef": f"[sound:{actual_filename}]"
        }
    finally:
        os.unlink(temp_path)
```

### Frontend

**Audio settings (`src/lib/audio-settings.ts`):**

```typescript
const STORAGE_KEY = "anki-tools:audio-settings";

export interface AudioSettings {
  voice: string;
}

const defaults: AudioSettings = {
  voice: "ko-KR-SunHiNeural",
};

export function getAudioSettings(): AudioSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
}

export function setAudioSettings(settings: Partial<AudioSettings>): void {
  const current = getAudioSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}
```

**Generate button in note-detail.tsx:**

- Detect `*_audio` fields
- Show button when conditions met
- On click: call API → update field → trigger mutation

## Testing

### E2E Tests

- Button appears for empty `*_audio` fields when source has content
- Button hidden when `*_audio` field has value
- Button hidden when source field is empty
- Generation flow (requires edge-tts installed)

### Manual Testing

1. Install edge-tts: `pip install edge-tts`
2. Select a note with `korean` and `korean_audio` fields
3. Ensure `korean` has content, `korean_audio` is empty
4. Click generate button
5. Verify `korean_audio` populated with `[sound:*.mp3]`
6. Preview card to hear audio

## Future Enhancements

- Batch generation for multiple notes
- Additional voice settings (speed, pitch)
- Audio preview/playback in detail panel
- Regenerate button (when field already has value)
- Audio settings UI
