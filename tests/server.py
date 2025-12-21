"""Standalone test server for e2e tests."""

import os
import signal
import sys
from pathlib import Path

from anki.collection import Collection

sys.path.insert(0, str(Path(__file__).parent.parent / "addon"))
from server import BrowseServer

PORT = int(os.environ.get("ANKI_PORT", "6679"))
FIXTURE_PATH = Path(__file__).parent / "fixtures" / "test.anki2"


def main():
    if not FIXTURE_PATH.exists():
        print(f"Fixture not found: {FIXTURE_PATH}")
        print("Run: uv run tests/fixtures/create.py")
        sys.exit(1)

    col = Collection(str(FIXTURE_PATH))
    server = BrowseServer(get_col=lambda: col)
    server.start(PORT)

    print(f"Server running on http://localhost:{PORT}")
    print(f"Collection: {FIXTURE_PATH}")

    # Wait for SIGINT/SIGTERM
    def shutdown(sig, frame):
        print("\nShutting down...")
        server.stop()
        col.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    signal.pause()


if __name__ == "__main__":
    main()
