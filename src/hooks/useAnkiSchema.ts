import { queryOptions } from "@tanstack/react-query";
import { fetchAllModelsWithFields } from "@/providers/anki-connect";

export const ankiSchemaQuery = queryOptions({
  queryKey: ["anki-schema"],
  queryFn: fetchAllModelsWithFields,
  staleTime: Infinity,
  retry: false,
});
