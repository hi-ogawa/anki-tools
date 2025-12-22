"""Browse Web - Anki add-on that serves web UI for browsing notes."""

import threading
import webbrowser
from functools import partial
from http.server import HTTPServer
from pathlib import Path

from aqt import mw, gui_hooks
from aqt.qt import QAction

from .server import RequestHandler

# Use different port for dev vs release
ADDON_DIR = Path(__file__).parent.name
PORT = 5679 if ADDON_DIR.endswith("-dev") else 5678
WEB_DIR = Path(__file__).parent / "dist"


class AddonServer:
    """HTTP server for Anki addon with thread-safe request handling."""

    def __init__(self):
        def run(fn):
            event = threading.Event()

            def run_and_signal():
                fn()
                event.set()

            mw.taskman.run_on_main(run_and_signal)
            event.wait()

        handler = partial(RequestHandler, get_col=lambda: mw.col, directory=str(WEB_DIR), run=run)
        self._server = HTTPServer(("127.0.0.1", PORT), handler)
        self._thread: threading.Thread | None = None

    def start(self):
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    def stop(self):
        self._server.shutdown()
        self._thread = None


_server: AddonServer | None = None


def on_profile_open():
    global _server
    _server = AddonServer()
    _server.start()


def on_profile_close():
    global _server
    if _server:
        _server.stop()
        _server = None


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")


# Register hooks
gui_hooks.profile_did_open.append(on_profile_open)
gui_hooks.profile_will_close.append(on_profile_close)

# Add menu item
MENU_LABEL = "Browse Web (Dev)" if ADDON_DIR.endswith("-dev") else "Browse Web"
action = QAction(MENU_LABEL, mw)
action.triggered.connect(open_browser)
mw.form.menuTools.addAction(action)
