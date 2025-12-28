import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api, type Schema } from "../api";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface CreateNoteDialogProps {
  schema: Schema;
  defaultModel?: string;
  defaultDeck?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNoteDialog({
  schema,
  defaultModel,
  defaultDeck,
  open,
  onOpenChange,
}: CreateNoteDialogProps) {
  const [model, setModel] = useState(defaultModel ?? "");
  const [deck, setDeck] = useState(defaultDeck ?? schema.decks[0] ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  const queryClient = useQueryClient();

  const modelNames = Object.keys(schema.models);
  const modelFields = model ? schema.models[model] : [];

  const addNoteMutation = useMutation({
    ...api.addNote.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fetchItems"] });
      onOpenChange(false);
      formRef.current?.reset();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Extract fields (all form inputs except _tags)
    const fields: Record<string, string> = {};
    for (const fieldName of modelFields) {
      const value = formData.get(fieldName);
      if (typeof value === "string") {
        fields[fieldName] = value;
      }
    }

    // Extract tags
    const tagsInput = formData.get("_tags");
    const tags =
      typeof tagsInput === "string"
        ? tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    addNoteMutation.mutate({
      deckName: deck,
      modelName: model,
      fields,
      tags,
    });
  };

  const isValid = model && deck;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Create a new note in your Anki collection.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4"
          key={model}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Type</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="model-select">
                  <SelectValue placeholder="Select note type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Note Types</SelectLabel>
                    {modelNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deck</label>
              <Select value={deck} onValueChange={setDeck}>
                <SelectTrigger data-testid="deck-select">
                  <SelectValue placeholder="Select deck..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Decks</SelectLabel>
                    {schema.decks.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {model && modelFields.length > 0 && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Fields</h3>
                <div className="space-y-3">
                  {modelFields.map((fieldName) => (
                    <div key={fieldName} className="space-y-1">
                      <label className="text-sm text-muted-foreground">
                        {fieldName}
                      </label>
                      {fieldName.toLowerCase().includes("example") ||
                      fieldName.toLowerCase().includes("notes") ? (
                        <Textarea
                          name={fieldName}
                          placeholder={fieldName}
                          rows={2}
                          data-testid={`field-${fieldName}`}
                        />
                      ) : (
                        <Input
                          name={fieldName}
                          placeholder={fieldName}
                          data-testid={`field-${fieldName}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              name="_tags"
              placeholder="tag1, tag2, tag3 (comma-separated)"
              data-testid="tags-input"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || addNoteMutation.isPending}
              data-testid="submit-note-button"
            >
              {addNoteMutation.isPending ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
