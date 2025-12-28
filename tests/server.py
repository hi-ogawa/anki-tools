"""Standalone test server for e2e tests."""

import os
import subprocess
import sys
from functools import partial
from http.server import HTTPServer
from pathlib import Path

# Import server module directly to avoid loading __init__.py (which imports aqt)
sys.path.insert(0, str(Path(__file__).parent.parent / "addon"))
from anki.collection import Collection
from server import RequestHandler  # noqa: E402

PORT = int(os.environ.get("ANKI_PORT", "6679"))
ANKI_DATA = os.environ.get("ANKI_DATA", "dev")
DATA_PATH = Path(__file__).parent / "data" / f"{ANKI_DATA}.anki2"


def main():
    # Reset fixture: always for test, only if missing for dev
    if ANKI_DATA == "test" or not DATA_PATH.exists():
        subprocess.run(["pnpm", "fixture"], check=True)

    col = Collection(str(DATA_PATH))
    handler = partial(RequestHandler, get_col=lambda: col)
    server = HTTPServer(("127.0.0.1", PORT), handler)

    print(f"Server running on http://localhost:{PORT}")
    print(f"Collection: {DATA_PATH}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        col.close()


if __name__ == "__main__":
    main()
