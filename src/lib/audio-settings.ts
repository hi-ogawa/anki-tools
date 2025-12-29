import { useLocalStorage } from "./use-local-storage";

export interface AudioSettings {
  /** Key-value pairs passed as --key value to edge-tts CLI */
  flags: Record<string, string>;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  flags: {
    voice: "ko-KR-SunHiNeural",
  },
};

const STORAGE_KEY = "anki-tools:audio-settings-v2";

export function useAudioSettings() {
  return useLocalStorage<AudioSettings>(STORAGE_KEY, DEFAULT_AUDIO_SETTINGS);
}
