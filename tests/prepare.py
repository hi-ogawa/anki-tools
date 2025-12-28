"""Create test data collection."""

import os
from pathlib import Path

from anki.collection import Collection

DATA_DIR = Path(__file__).parent / "data"
DATA_PATH = DATA_DIR / "test.anki2"


def main():
    DATA_DIR.mkdir(exist_ok=True)

    # Remove existing data
    if DATA_PATH.exists():
        os.unlink(DATA_PATH)
    media_dir = DATA_DIR / "test.media"
    if media_dir.exists():
        import shutil

        shutil.rmtree(media_dir)

    col = Collection(str(DATA_PATH))

    # Use the default "Basic" model (Front/Back fields)
    model = col.models.by_name("Basic")

    # Create decks for testing
    deck_default = col.decks.id("Default")
    deck_japanese = col.decks.id("Japanese")
    deck_science = col.decks.id("Science")

    # Create some test notes in different decks
    for i in range(20):
        note = col.new_note(model)
        note["Front"] = f"Question {i + 1}"
        note["Back"] = f"Answer {i + 1}"
        # Assign tags: important (every 3rd), review (every 4th)
        tags = []
        if i % 3 == 0:
            tags.append("important")
        if i % 4 == 0:
            tags.append("review")
        note.tags = tags
        # Distribute notes: 10 Default, 6 Japanese, 4 Science
        if i < 10:
            deck_id = deck_default
        elif i < 16:
            deck_id = deck_japanese
        else:
            deck_id = deck_science
        col.add_note(note, deck_id)

    # Set some flags on cards for testing
    cards = col.find_cards("deck:Default")
    if len(cards) >= 3:
        col.set_user_flag_for_cards(1, [cards[0]])  # Red
        col.set_user_flag_for_cards(2, [cards[1]])  # Orange
        col.set_user_flag_for_cards(3, [cards[2]])  # Green

    # Create isolated model for flag filter test
    flag_test_model = col.models.copy(model)
    flag_test_model["name"] = "test-flag-filter"
    flag_test_model["id"] = 0  # Reset ID so Anki assigns a new one
    col.models.add(flag_test_model)

    deck_flag_test = col.decks.id("test-flag-filter")
    flag_test_cards = []
    for i in range(5):
        note = col.new_note(flag_test_model)
        note["Front"] = f"FlagTest Q{i + 1}"
        note["Back"] = f"FlagTest A{i + 1}"
        col.add_note(note, deck_flag_test)
        # Get the card ID for this note
        flag_test_cards.extend(note.card_ids())

    # Set flags: card 1=Red, card 2=Orange, card 3=Green, cards 4-5=no flag
    col.set_user_flag_for_cards(1, [flag_test_cards[0]])  # Red
    col.set_user_flag_for_cards(2, [flag_test_cards[1]])  # Orange
    col.set_user_flag_for_cards(3, [flag_test_cards[2]])  # Green

    col.close()

    print(f"Created: {DATA_PATH}")
    print(f"  Notes: 20 (Default: 10, Japanese: 6, Science: 4)")
    print(f"  Cards: {len(cards)}")


if __name__ == "__main__":
    main()
