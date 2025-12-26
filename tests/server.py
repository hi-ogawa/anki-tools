"""Standalone test server for e2e tests."""

import os
import sys
from functools import partial
from http.server import HTTPServer
from pathlib import Path

# Import server module directly to avoid loading __init__.py (which imports aqt)
sys.path.insert(0, str(Path(__file__).parent.parent / "addon"))
from anki.collection import Collection
from server import RequestHandler  # type: ignore  # noqa: E402

PORT = int(os.environ.get("ANKI_PORT", "6679"))
DATA_PATH = Path(__file__).parent / "data" / "test.anki2"


def main():
    if not DATA_PATH.exists():
        print(f"Data not found: {DATA_PATH}")
        print("Run: pnpm test-e2e-setup")
        sys.exit(1)

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
