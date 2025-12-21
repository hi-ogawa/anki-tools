const ANKI_CONNECT_URL = "http://localhost:8765";

async function invoke(action, params) {
  const start = performance.now();
  const response = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    body: JSON.stringify({ action, version: 6, params }),
  });
  const { result, error } = await response.json();
  const elapsed = (performance.now() - start).toFixed(0);
  if (error) throw new Error(error);
  return { result, elapsed };
}

async function bench() {
  const model = "Korean Vocabulary";
  console.log(`Model: ${model}\n`);

  // === NOTE MODE (current) ===
  console.log("=== NOTE MODE ===");
  const { result: noteIds, elapsed: n1 } = await invoke("findNotes", {
    query: `note:"${model}"`,
  });
  console.log(`findNotes: ${n1}ms (${noteIds.length} notes)`);

  const { elapsed: n2 } = await invoke("notesInfo", { notes: noteIds });
  console.log(`notesInfo: ${n2}ms`);

  const { result: cardIdsForNotes, elapsed: n3 } = await invoke("findCards", {
    query: `note:"${model}"`,
  });
  console.log(`findCards: ${n3}ms (${cardIdsForNotes.length} cards)`);

  const { elapsed: n4 } = await invoke("getDecks", { cards: cardIdsForNotes });
  console.log(`getDecks: ${n4}ms`);

  const noteTotal = parseInt(n1) + parseInt(n2) + parseInt(n3) + parseInt(n4);
  console.log(`Total (no flags/suspension): ${noteTotal}ms\n`);

  // === CARD MODE ===
  console.log("=== CARD MODE ===");
  const { result: cardIds, elapsed: c1 } = await invoke("findCards", {
    query: `note:"${model}"`,
  });
  console.log(`findCards: ${c1}ms (${cardIds.length} cards)`);

  const { elapsed: c2 } = await invoke("getDecks", { cards: cardIds });
  console.log(`getDecks: ${c2}ms`);

  // Need note info for fields
  const { result: cardsInfoSample } = await invoke("cardsInfo", {
    cards: cardIds.slice(0, 10),
  });
  const sampleNoteIds = [...new Set(cardsInfoSample.map((c) => c.note))];
  console.log(
    `(cards reference ${sampleNoteIds.length} unique notes in sample of 10)`,
  );

  // For card mode, we'd need notesInfo for all referenced notes
  const { elapsed: c3 } = await invoke("notesInfo", { notes: noteIds });
  console.log(`notesInfo: ${c3}ms`);

  const cardTotal = parseInt(c1) + parseInt(c2) + parseInt(c3);
  console.log(`Total (no flags/suspension): ${cardTotal}ms`);
}

bench().catch(console.error);
