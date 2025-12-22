"""Standalone test server for e2e tests."""

import importlib.util
import os
import signal
import sys
from pathlib import Path

from anki.collection import Collection

spec = importlib.util.spec_from_file_location(
    "server", Path(__file__).parent.parent / "addon" / "server.py"
)
server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server_module)
BrowseServer = server_module.BrowseServer

PORT = int(os.environ.get("ANKI_PORT", "6679"))
DATA_PATH = Path(__file__).parent / "data" / "test.anki2"


def main():
    if not DATA_PATH.exists():
        print(f"Data not found: {DATA_PATH}")
        print("Run: pnpm test-e2e-setup")
        sys.exit(1)

    col = Collection(str(DATA_PATH))
    server = BrowseServer(get_col=lambda: col)
    server.start(PORT)

    print(f"Server running on http://localhost:{PORT}")
    print(f"Collection: {DATA_PATH}")

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
