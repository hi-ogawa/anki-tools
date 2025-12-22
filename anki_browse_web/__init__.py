"""Browse Web - Anki add-on that serves web UI for browsing notes."""

import webbrowser
from pathlib import Path

from aqt import mw, gui_hooks
from aqt.qt import QAction

from .server import AddonServer

# Use different port for dev vs release
ADDON_DIR = Path(__file__).parent.name
PORT = 5679 if ADDON_DIR.endswith("-dev") else 5678
WEB_DIR = Path(__file__).parent / "dist"

_server: AddonServer | None = None


def on_profile_open():
    global _server
    _server = AddonServer(
        port=PORT,
        get_col=lambda: mw.col,
        directory=str(WEB_DIR),
        run_on_main=mw.taskman.run_on_main,
    )
    _server.start()


def on_profile_close():
    global _server
    if _server is not None:
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
