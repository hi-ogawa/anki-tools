"""Standalone test server for e2e tests."""

import os
import signal
import sys
from functools import partial
from http.server import HTTPServer
from pathlib import Path

from anki.collection import Collection

from anki_browse_web.server import RequestHandler

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

    def shutdown(sig, frame):
        print("\nShutting down...")
        server.shutdown()
        col.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    server.serve_forever()


if __name__ == "__main__":
    main()
