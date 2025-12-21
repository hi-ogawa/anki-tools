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

  // Get card IDs first
  const { result: cardIds } = await invoke("findCards", { query: `note:"${model}"` });
  console.log(`Cards: ${cardIds.length}\n`);

  // Bench getDecks
  const { result: decks, elapsed: t1 } = await invoke("getDecks", { cards: cardIds });
  console.log(`getDecks: ${t1}ms`);
  console.log(`Decks found: ${Object.keys(decks).length}`);

  // Bench cardsInfo with just 100 cards for comparison
  const sample = cardIds.slice(0, 100);
  const { elapsed: t2 } = await invoke("cardsInfo", { cards: sample });
  console.log(`\ncardsInfo (100 cards): ${t2}ms`);
  console.log(`Estimated for ${cardIds.length}: ${(parseInt(t2) * cardIds.length / 100).toFixed(0)}ms`);
}

bench().catch(console.error);
