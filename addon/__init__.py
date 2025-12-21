"""Browse Web - Anki add-on that serves web UI for browsing notes."""

from aqt import mw, gui_hooks
from aqt.qt import QAction
import webbrowser

from .server import start_server, stop_server

PORT = 5678


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
action = QAction("Browse Web", mw)
action.triggered.connect(open_browser)
mw.form.menuTools.addAction(action)
