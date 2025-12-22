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

    # Create some test notes
    for i in range(20):
        note = col.new_note(model)
        note["Front"] = f"Question {i + 1}"
        note["Back"] = f"Answer {i + 1}"
        if i % 3 == 0:
            note.tags = ["tagged"]
        col.add_note(note, col.decks.id("Default"))

    # Set some flags on cards for testing
    cards = col.find_cards("deck:Default")
    if len(cards) >= 3:
        col.set_user_flag_for_cards(1, [cards[0]])  # Red
        col.set_user_flag_for_cards(2, [cards[1]])  # Orange
        col.set_user_flag_for_cards(3, [cards[2]])  # Green

    col.close()

    print(f"Created: {DATA_PATH}")
    print(f"  Notes: 20")
    print(f"  Cards: {len(cards)}")


if __name__ == "__main__":
    main()
