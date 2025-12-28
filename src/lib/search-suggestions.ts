// Anki search query autocomplete suggestions
// Based on https://docs.ankiweb.net/searching.html

export interface SearchSuggestion {
  value: string;
  description: string;
  category: "state" | "property" | "time" | "other";
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

  // Property queries (prop:)
  {
    value: "prop:ivl>=30",
    description: "Cards with interval >= 30 days",
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
    value: "prop:reps>10",
    description: "Cards reviewed more than 10 times",
    category: "property",
  },
  {
    value: "prop:lapses>0",
    description: "Cards with lapses",
    category: "property",
  },
  {
    value: "prop:ease<2.5",
    description: "Cards with ease factor less than 250%",
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
    value: "introduced:1",
    description: "Cards first reviewed in the last day",
    category: "time",
  },

  // Flag queries
  {
    value: "flag:1",
    description: "Cards with Red flag",
    category: "other",
  },
  {
    value: "flag:2",
    description: "Cards with Orange flag",
    category: "other",
  },
  {
    value: "flag:3",
    description: "Cards with Green flag",
    category: "other",
  },
  {
    value: "flag:4",
    description: "Cards with Blue flag",
    category: "other",
  },

  // Other useful queries
  {
    value: "card:1",
    description: "First card of each note",
    category: "other",
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
];
