import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

interface BulkImportDialogProps {
  schema: Schema;
  defaultModel?: string;
  defaultDeck?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParsedNote = {
  fields: Record<string, string>;
};

function parseTSV(tsv: string): ParsedNote[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const fields: Record<string, string> = {};
    headers.forEach((h, i) => {
      fields[h] = values[i]?.trim() ?? "";
    });
    return { fields };
  });
}

export function BulkImportDialog({
  schema,
  defaultModel,
  defaultDeck,
  open,
  onOpenChange,
}: BulkImportDialogProps) {
  const [model, setModel] = useState(defaultModel ?? "");
  const [deck, setDeck] = useState(defaultDeck ?? schema.decks[0] ?? "");
  const [tsvInput, setTsvInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const queryClient = useQueryClient();

  const modelNames = Object.keys(schema.models);
  const modelFields = model ? schema.models[model] : [];

  const parsedNotes = parseTSV(tsvInput);

  // Get headers from TSV
  const tsvHeaders =
    tsvInput
      .trim()
      .split("\n")[0]
      ?.split("\t")
      .map((h) => h.trim()) ?? [];

  // Categorize fields:
  // 1. Matched: in both TSV and model (will be imported)
  // 2. TSV only: in TSV but not model (will be ignored)
  // 3. Model only: in model but not TSV (will be empty)
  const matchedFields = tsvHeaders.filter((h) => modelFields.includes(h));
  const tsvOnlyFields = tsvHeaders.filter((h) => !modelFields.includes(h));
  const modelOnlyFields = modelFields.filter((f) => !tsvHeaders.includes(f));

  const bulkAddMutation = useMutation({
    ...api.bulkAddNotes.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fetchItems"] });
      onOpenChange(false);
      setTsvInput("");
      setTagsInput("");
      alert(`Successfully imported ${data.count} notes`);
    },
  });

  const handleImport = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const notes = parsedNotes.map((note) => ({
      fields: note.fields,
      tags,
    }));

    bulkAddMutation.mutate({
      deckName: deck,
      modelName: model,
      notes,
    });
  };

  const isValid = model && deck && parsedNotes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Notes</DialogTitle>
          <DialogDescription>
            Paste tab-separated data to import multiple notes at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Type</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="bulk-model-select">
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
                <SelectTrigger data-testid="bulk-deck-select">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (for all notes)</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3 (comma-separated)"
              data-testid="bulk-tags-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Paste TSV Data (first row = headers)
            </label>
            <Textarea
              value={tsvInput}
              onChange={(e) => setTsvInput(e.target.value)}
              placeholder={`korean\tenglish\texample_ko\texample_en\n꽃밭\tflower garden\t봄이 되면...\tWhen spring comes...`}
              rows={6}
              className="font-mono text-sm"
              data-testid="bulk-tsv-input"
            />
          </div>

          {model && tsvHeaders.length > 0 && (
            <div className="text-sm space-y-1">
              <div className="text-muted-foreground">
                <span className="font-medium">Matched:</span>{" "}
                {matchedFields.length > 0 ? (
                  <span className="text-green-600">
                    {matchedFields.join(", ")}
                  </span>
                ) : (
                  <span className="text-yellow-600">None</span>
                )}
              </div>
              {tsvOnlyFields.length > 0 && (
                <div className="text-muted-foreground">
                  <span className="font-medium">TSV only (ignored):</span>{" "}
                  <span className="text-yellow-600">
                    {tsvOnlyFields.join(", ")}
                  </span>
                </div>
              )}
              {modelOnlyFields.length > 0 && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Model only (empty):</span>{" "}
                  <span className="text-yellow-600">
                    {modelOnlyFields.join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {parsedNotes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Preview ({parsedNotes.length} notes)
              </label>
              <div className="border rounded-md overflow-auto max-h-48">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">#</th>
                      {matchedFields.slice(0, 4).map((field) => (
                        <th
                          key={field}
                          className="px-2 py-1 text-left font-medium"
                        >
                          {field}
                        </th>
                      ))}
                      {matchedFields.length > 4 && (
                        <th className="px-2 py-1 text-left font-medium">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedNotes.slice(0, 5).map((note, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1 text-muted-foreground">
                          {i + 1}
                        </td>
                        {matchedFields.slice(0, 4).map((field) => (
                          <td
                            key={field}
                            className="px-2 py-1 max-w-[200px] truncate"
                          >
                            {note.fields[field] || ""}
                          </td>
                        ))}
                        {matchedFields.length > 4 && (
                          <td className="px-2 py-1 text-muted-foreground">
                            ...
                          </td>
                        )}
                      </tr>
                    ))}
                    {parsedNotes.length > 5 && (
                      <tr className="border-t">
                        <td
                          colSpan={Math.min(matchedFields.length, 4) + 2}
                          className="px-2 py-1 text-muted-foreground text-center"
                        >
                          ... and {parsedNotes.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            onClick={handleImport}
            disabled={!isValid || bulkAddMutation.isPending}
            data-testid="bulk-import-submit"
          >
            {bulkAddMutation.isPending
              ? "Importing..."
              : `Import ${parsedNotes.length} Notes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
