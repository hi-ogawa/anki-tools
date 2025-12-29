import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useAudioSettings } from "@/lib/audio-settings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useAudioSettings();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const flags = Object.entries(settings.flags);

  const addFlag = () => {
    if (newKey.trim()) {
      setSettings({
        ...settings,
        flags: { ...settings.flags, [newKey.trim()]: newValue },
      });
      setNewKey("");
      setNewValue("");
    }
  };

  const removeFlag = (key: string) => {
    const { [key]: _, ...rest } = settings.flags;
    setSettings({ ...settings, flags: rest });
  };

  const updateFlag = (key: string, value: string) => {
    setSettings({
      ...settings,
      flags: { ...settings.flags, [key]: value },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure edge-tts CLI flags. Each key-value pair becomes{" "}
            <code className="rounded bg-muted px-1">--key value</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {flags.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Input value={key} disabled className="w-28 font-mono text-sm" />
              <Input
                value={value}
                onChange={(e) => updateFlag(key, e.target.value)}
                className="flex-1 font-mono text-sm"
                data-testid={`flag-value-${key}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFlag(key)}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="key"
              className="w-28 font-mono text-sm"
              data-testid="new-flag-key"
            />
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="value"
              className="flex-1 font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && addFlag()}
              data-testid="new-flag-value"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={addFlag}
              disabled={!newKey.trim()}
              className="shrink-0"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Common flags: voice, rate (+0%, -10%), pitch (+0Hz, -50Hz)
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
