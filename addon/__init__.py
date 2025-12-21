"""Browse Web - Anki add-on that serves web UI for browsing notes."""

from pathlib import Path
from aqt import mw, gui_hooks
from aqt.qt import QAction
import webbrowser

from .server import start_server, stop_server

# Use different port for dev vs release
ADDON_DIR = Path(__file__).parent.name
PORT = 5679 if ADDON_DIR.endswith("-dev") else 5678


def on_profile_open():
    start_server(PORT)


def on_profile_close():
    stop_server()


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
