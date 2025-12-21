"""Create test fixture collection."""

import os
from pathlib import Path

from anki.collection import Collection

FIXTURE_PATH = Path(__file__).parent / "test.anki2"


def main():
    # Remove existing fixture
    if FIXTURE_PATH.exists():
        os.unlink(FIXTURE_PATH)
    media_dir = FIXTURE_PATH.parent / "test.anki2.media"
    if media_dir.exists():
        import shutil
        shutil.rmtree(media_dir)

    col = Collection(str(FIXTURE_PATH))

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

    print(f"Created fixture: {FIXTURE_PATH}")
    print(f"  Notes: 20")
    print(f"  Cards: {len(cards)}")


if __name__ == "__main__":
    main()
