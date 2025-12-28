import { CircleHelp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import {
  SEARCH_SUGGESTIONS,
  type SearchSuggestion,
} from "@/lib/search-suggestions";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search (supports Anki query syntax)",
  className,
}: SearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current input
  useEffect(() => {
    if (!value) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Get the current word being typed (last word after space)
    const words = value.split(" ");
    const currentWord = words[words.length - 1].toLowerCase();

    if (currentWord.length < 2) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter suggestions that match the current word
    const matches = SEARCH_SUGGESTIONS.filter((suggestion) =>
      suggestion.value.toLowerCase().startsWith(currentWord),
    );

    setFilteredSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setSelectedIndex(0);
  }, [value]);

  const applySuggestion = (suggestion: SearchSuggestion) => {
    const words = value.split(" ");
    words[words.length - 1] = suggestion.value;
    const newValue = words.join(" ");
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === "Enter") {
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        applySuggestion(filteredSuggestions[selectedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        e.preventDefault();
        applySuggestion(filteredSuggestions[selectedIndex]);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("pr-8", className)}
          data-testid="search-input"
        />
        <a
          href="https://docs.ankiweb.net/searching.html"
          target="_blank"
          rel="noopener noreferrer"
          title="Search syntax help"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <CircleHelp className="size-4" />
        </a>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-y-auto"
          data-testid="search-suggestions"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0",
                index === selectedIndex && "bg-accent text-accent-foreground",
              )}
              onClick={() => applySuggestion(suggestion)}
              data-testid="search-suggestion-item"
            >
              <div className="font-medium">{suggestion.value}</div>
              <div className="text-xs text-muted-foreground">
                {suggestion.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
