"""Create test data collection."""

import os
import shutil
from pathlib import Path

from anki.collection import Collection

DATA_DIR = Path(__file__).parent / "data"
ANKI_DATA = os.environ.get("ANKI_DATA", "dev")
DATA_PATH = DATA_DIR / f"{ANKI_DATA}.anki2"


def main():
    DATA_DIR.mkdir(exist_ok=True)

    if DATA_PATH.exists():
        os.unlink(DATA_PATH)
    media_dir = DATA_DIR / f"{ANKI_DATA}.media"
    if media_dir.exists():
        shutil.rmtree(media_dir)

    col = Collection(str(DATA_PATH))
    model = col.models.by_name("Basic")

    def setup_basic_fixture():
        """Basic model with 20 notes across 3 decks, some with flags/tags."""
        deck_default = col.decks.id("Default")
        deck_japanese = col.decks.id("Japanese")
        deck_science = col.decks.id("Science")

        for i in range(20):
            note = col.new_note(model)
            note["Front"] = f"Question {i + 1}"
            note["Back"] = f"Answer {i + 1}"
            tags = []
            if i % 3 == 0:
                tags.append("important")
            if i % 4 == 0:
                tags.append("review")
            note.tags = tags
            if i < 10:
                deck_id = deck_default
            elif i < 16:
                deck_id = deck_japanese
            else:
                deck_id = deck_science
            col.add_note(note, deck_id)

        cards = col.find_cards("deck:Default")
        if len(cards) >= 3:
            col.set_user_flag_for_cards(1, [cards[0]])  # Red
            col.set_user_flag_for_cards(2, [cards[1]])  # Orange
            col.set_user_flag_for_cards(3, [cards[2]])  # Green

    def setup_flag_filter_fixture():
        """test-flag-filter: 5 cards with flags (Red, Orange, Green, none, none)."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-flag-filter"
        col.models.add(m)

        deck_id = col.decks.id("test-flag-filter")
        card_ids = []
        for i in range(5):
            note = col.new_note(m)
            note["Front"] = f"FlagTest Q{i + 1}"
            note["Back"] = f"FlagTest A{i + 1}"
            col.add_note(note, deck_id)
            card_ids.extend(note.card_ids())

        col.set_user_flag_for_cards(1, [card_ids[0]])  # Red
        col.set_user_flag_for_cards(2, [card_ids[1]])  # Orange
        col.set_user_flag_for_cards(3, [card_ids[2]])  # Green

    def setup_deck_filter_fixture():
        """test-deck-filter: 6 cards across 3 decks (DeckA:3, DeckB:2, DeckC:1)."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-deck-filter"
        col.models.add(m)

        deck_a = col.decks.id("test-deck-filter::DeckA")
        deck_b = col.decks.id("test-deck-filter::DeckB")
        deck_c = col.decks.id("test-deck-filter::DeckC")

        for i in range(3):
            note = col.new_note(m)
            note["Front"] = f"DeckA Q{i + 1}"
            note["Back"] = f"DeckA A{i + 1}"
            col.add_note(note, deck_a)

        for i in range(2):
            note = col.new_note(m)
            note["Front"] = f"DeckB Q{i + 1}"
            note["Back"] = f"DeckB A{i + 1}"
            col.add_note(note, deck_b)

        note = col.new_note(m)
        note["Front"] = "DeckC Q1"
        note["Back"] = "DeckC A1"
        col.add_note(note, deck_c)

    def setup_card_flag_fixture():
        """test-card-flag: 1 card with Red flag for set card flag test."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-card-flag"
        col.models.add(m)

        deck_id = col.decks.id("test-card-flag")
        note = col.new_note(m)
        note["Front"] = "CardFlag Q1"
        note["Back"] = "CardFlag A1"
        col.add_note(note, deck_id)
        col.set_user_flag_for_cards(1, note.card_ids())  # Red

    def setup_bulk_flag_fixture():
        """test-bulk-flag: 3 cards for bulk edit flag test."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-bulk-flag"
        col.models.add(m)

        deck_id = col.decks.id("test-bulk-flag")
        for i in range(3):
            note = col.new_note(m)
            note["Front"] = f"BulkFlag Q{i + 1}"
            note["Back"] = f"BulkFlag A{i + 1}"
            col.add_note(note, deck_id)

    def setup_create_fixture():
        """test-create: Empty model/deck for create note test."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-create"
        col.models.add(m)
        col.decks.id("test-create")  # Just create the deck

    def setup_bulk_import_fixture():
        """test-bulk-import: Empty model/deck for bulk import test."""
        m = col.models.copy(model, add=False)
        m["name"] = "test-bulk-import"
        col.models.add(m)
        col.decks.id("test-bulk-import")  # Just create the deck

    def setup_audio_generation_fixture():
        """test-audio: Model with source and source_audio fields for audio generation test."""
        m = col.models.new("test-audio")
        col.models.add_field(m, col.models.new_field("source"))
        col.models.add_field(m, col.models.new_field("source_audio"))
        t = col.models.new_template("Card 1")
        t["qfmt"] = "{{source}}"
        t["afmt"] = "{{source_audio}}"
        col.models.add_template(m, t)
        col.models.add(m)

        deck_id = col.decks.id("test-audio")

        # Note 1: source has content, source_audio empty (should show generate button)
        note1 = col.new_note(m)
        note1["source"] = "Hello World"
        note1["source_audio"] = ""
        col.add_note(note1, deck_id)

        # Note 2: source has content, source_audio has value (should NOT show button)
        note2 = col.new_note(m)
        note2["source"] = "Test Content"
        note2["source_audio"] = "[sound:existing.mp3]"
        col.add_note(note2, deck_id)

        # Note 3: source empty, source_audio empty (should NOT show button)
        note3 = col.new_note(m)
        note3["source"] = ""
        note3["source_audio"] = ""
        col.add_note(note3, deck_id)

    setup_basic_fixture()
    setup_flag_filter_fixture()
    setup_deck_filter_fixture()
    setup_card_flag_fixture()
    setup_bulk_flag_fixture()
    setup_create_fixture()
    setup_bulk_import_fixture()
    setup_audio_generation_fixture()

    col.close()
    print(f"Created: {DATA_PATH}")


if __name__ == "__main__":
    main()
