// Anki search query autocomplete suggestions
// Based on https://docs.ankiweb.net/searching.html

export interface SearchSuggestion {
  value: string;
  description: string;
  category: "state" | "property" | "time" | "flag" | "other";
}

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  // State queries (is:)
  { value: "is:new", description: "Cards that are new", category: "state" },
  { value: "is:due", description: "Cards that are due", category: "state" },
  {
    value: "is:review",
    description: "Cards in review queue",
    category: "state",
  },
  {
    value: "is:learn",
    description: "Cards in learning queue",
    category: "state",
  },
  {
    value: "is:suspended",
    description: "Suspended cards",
    category: "state",
  },
  {
    value: "is:buried",
    description: "Buried cards",
    category: "state",
  },
  {
    value: "is:buried-sibling",
    description: "Cards buried as siblings",
    category: "state",
  },
  {
    value: "is:buried-manually",
    description: "Manually buried cards",
    category: "state",
  },
  {
    value: "-is:suspended",
    description: "Exclude suspended cards",
    category: "state",
  },
  {
    value: "-is:buried",
    description: "Exclude buried cards",
    category: "state",
  },

  // Property queries (prop:)
  {
    value: "prop:ivl>=30",
    description: "Cards with interval >= 30 days",
    category: "property",
  },
  {
    value: "prop:ivl<=7",
    description: "Cards with interval <= 7 days",
    category: "property",
  },
  {
    value: "prop:due=-1",
    description: "Cards due tomorrow",
    category: "property",
  },
  {
    value: "prop:due=0",
    description: "Cards due today",
    category: "property",
  },
  {
    value: "prop:due>0",
    description: "Cards overdue",
    category: "property",
  },
  {
    value: "prop:reps>10",
    description: "Cards reviewed more than 10 times",
    category: "property",
  },
  {
    value: "prop:reps=0",
    description: "Cards never reviewed",
    category: "property",
  },
  {
    value: "prop:lapses>0",
    description: "Cards with lapses",
    category: "property",
  },
  {
    value: "prop:lapses>=3",
    description: "Cards with 3 or more lapses",
    category: "property",
  },
  {
    value: "prop:ease<2.5",
    description: "Cards with ease factor less than 250%",
    category: "property",
  },
  {
    value: "prop:ease>=2.5",
    description: "Cards with ease factor >= 250%",
    category: "property",
  },

  // Time-based queries
  {
    value: "added:1",
    description: "Cards added in the last day",
    category: "time",
  },
  {
    value: "added:7",
    description: "Cards added in the last week",
    category: "time",
  },
  {
    value: "added:30",
    description: "Cards added in the last month",
    category: "time",
  },
  {
    value: "edited:1",
    description: "Cards edited in the last day",
    category: "time",
  },
  {
    value: "edited:7",
    description: "Cards edited in the last week",
    category: "time",
  },
  {
    value: "rated:1",
    description: "Cards reviewed in the last day",
    category: "time",
  },
  {
    value: "rated:7",
    description: "Cards reviewed in the last week",
    category: "time",
  },
  {
    value: "rated:30",
    description: "Cards reviewed in the last month",
    category: "time",
  },
  {
    value: "introduced:1",
    description: "Cards first reviewed in the last day",
    category: "time",
  },
  {
    value: "introduced:7",
    description: "Cards first reviewed in the last week",
    category: "time",
  },

  // Flag queries
  {
    value: "flag:1",
    description: "Cards with Red flag",
    category: "flag",
  },
  {
    value: "flag:2",
    description: "Cards with Orange flag",
    category: "flag",
  },
  {
    value: "flag:3",
    description: "Cards with Green flag",
    category: "flag",
  },
  {
    value: "flag:4",
    description: "Cards with Blue flag",
    category: "flag",
  },
  {
    value: "flag:5",
    description: "Cards with Pink flag",
    category: "flag",
  },
  {
    value: "flag:6",
    description: "Cards with Turquoise flag",
    category: "flag",
  },
  {
    value: "flag:7",
    description: "Cards with Purple flag",
    category: "flag",
  },
  {
    value: "flag:0",
    description: "Cards with no flag",
    category: "flag",
  },

  // Other useful queries
  {
    value: "card:1",
    description: "First card of each note",
    category: "other",
  },
  {
    value: "card:2",
    description: "Second card of each note",
    category: "other",
  },
  {
    value: "deck:",
    description: "Filter by deck name (e.g., deck:\"My Deck\")",
    category: "other",
  },
  {
    value: "tag:",
    description: "Filter by tag (e.g., tag:important)",
    category: "other",
  },
  {
    value: "note:",
    description: "Filter by note type (e.g., note:Basic)",
    category: "other",
  },
];
