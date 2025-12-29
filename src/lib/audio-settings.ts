import { useLocalStorage } from "./use-local-storage";

export interface AudioSettings {
  voice: string;
}

export const KOREAN_VOICES = [
  { value: "ko-KR-SunHiNeural", label: "Sun-Hi (Female)" },
  { value: "ko-KR-InJoonNeural", label: "InJoon (Male)" },
] as const;

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voice: "ko-KR-SunHiNeural",
};

const STORAGE_KEY = "anki-tools:audio-settings";

export function useAudioSettings() {
  return useLocalStorage<AudioSettings>(STORAGE_KEY, DEFAULT_AUDIO_SETTINGS);
}
