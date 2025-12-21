import { useState, useEffect } from "react";
import { fetchAllModelsWithFields } from "@/providers/anki-connect";

interface AnkiSchema {
  models: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

export function useAnkiSchema() {
  const [schema, setSchema] = useState<AnkiSchema>({
    models: {},
    loading: true,
    error: null,
  });

  const refresh = async () => {
    setSchema(s => ({ ...s, loading: true, error: null }));
    try {
      const models = await fetchAllModelsWithFields();
      setSchema({ models, loading: false, error: null });
    } catch (e) {
      setSchema({ models: {}, loading: false, error: (e as Error).message });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { ...schema, refresh };
}
