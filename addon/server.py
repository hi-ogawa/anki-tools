"""HTTP server for Browse Web add-on.

Why an Anki addon instead of AnkiConnect?

1. AnkiConnect's `cardsInfo` is slow (~2.5s for 5k cards) because it renders
   full HTML for each card. Our addon accesses card data directly without
   HTML rendering.

2. Public web deployment can't access AnkiConnect anyway (localhost:8765).
   Bundling the web UI inside the addon solves both the API and hosting.

3. Same-origin serving eliminates CORS issues entirely.
"""

import json
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Callable

# Type alias for Anki Collection (avoid import for standalone usage)
Collection = object


class BrowseServer:
    """HTTP server for browsing Anki notes/cards.

    Decoupled from Anki GUI (aqt.mw) for testability. Can be used:
    - In addon: get_col=lambda: mw.col, run_on_main=mw.taskman.run_on_main
    - In tests: get_col=lambda: col (direct Collection instance)
    """

    def __init__(
        self,
        get_col: Callable[[], Collection],
        web_dir: Path | None = None,
        run_on_main: Callable[[Callable], None] | None = None,
    ):
        """
        Args:
            get_col: Callable returning the Anki Collection. Called per-request
                     to support profile switches.
            web_dir: Directory to serve static files from. None disables static serving.
            run_on_main: Thread safety wrapper. In Anki, use mw.taskman.run_on_main.
                         None means run synchronously (safe for single-threaded tests).
        """
        self.get_col = get_col
        self.web_dir = web_dir
        self.run_on_main = run_on_main
        self._server: HTTPServer | None = None
        self._thread: threading.Thread | None = None

    def start(self, port: int, host: str = "127.0.0.1"):
        """Start the HTTP server in a background thread."""
        if self._server is not None:
            return

        handler = self._make_handler()
        self._server = HTTPServer((host, port), handler)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the HTTP server."""
        if self._server is not None:
            self._server.shutdown()
            self._server = None
            self._thread = None

    def _make_handler(self):
        """Create request handler class with access to server instance."""
        server = self

        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                directory = str(server.web_dir) if server.web_dir else None
                super().__init__(*args, directory=directory, **kwargs)

            def do_POST(self):
                if self.path == "/api":
                    self._handle_api()
                else:
                    self.send_error(404)

            def _handle_api(self):
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                request = json.loads(body)

                action = request.get("action")
                params = request.get("params", {})

                result = {"result": None, "error": None}

                def run():
                    try:
                        col = server.get_col()
                        result["result"] = handle_action(col, action, params)
                    except Exception as e:
                        result["error"] = str(e)

                if server.run_on_main:
                    # Run on main thread for thread safety (Anki GUI mode)
                    event = threading.Event()

                    def run_and_signal():
                        run()
                        event.set()

                    server.run_on_main(run_and_signal)
                    event.wait()
                else:
                    # Run synchronously (test mode)
                    run()

                self._send_json(result)

            def _send_json(self, data):
                try:
                    body = json.dumps(data).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", len(body))
                    self.end_headers()
                    self.wfile.write(body)
                except BrokenPipeError:
                    pass  # Client disconnected

            def log_message(self, format, *args):
                pass  # Suppress logging

        return Handler


def handle_action(col: Collection, action: str, params: dict):
    """Handle API action with given collection."""
    if action == "getModels":
        models = {}
        for model in col.models.all():
            models[model["name"]] = [f["name"] for f in model["flds"]]
        return models

    elif action == "browseNotes":
        query = params["query"]
        note_ids = col.find_notes(query)
        notes = []
        for nid in note_ids:
            note = col.get_note(nid)
            model = note.note_type()
            cards = note.cards()
            deck_name = col.decks.name(cards[0].did) if cards else ""
            notes.append({
                "id": nid,
                "modelName": model["name"],
                "fields": {f["name"]: note.fields[i] for i, f in enumerate(model["flds"])},
                "tags": list(note.tags),
                "deckName": deck_name,
            })
        return notes

    elif action == "browseCards":
        query = params["query"]
        card_ids = col.find_cards(query)
        cards = []
        for cid in card_ids:
            card = col.get_card(cid)
            note = card.note()
            model = note.note_type()
            cards.append({
                "id": cid,
                "noteId": card.nid,
                "deckName": col.decks.name(card.did),
                "modelName": model["name"],
                "fields": {f["name"]: note.fields[i] for i, f in enumerate(model["flds"])},
                "tags": list(note.tags),
                # Card-specific
                "flag": card.flags,
                "queue": card.queue,  # -1 = suspended, 0 = new, 1 = learning, 2 = review
                "due": card.due,
                "interval": card.ivl,
            })
        return cards

    elif action == "setCardFlag":
        card_id = params["cardId"]
        flag = params["flag"]  # 0-7
        col.set_user_flag_for_cards(flag, [card_id])
        return True

    elif action == "updateNoteFields":
        note_id = params["noteId"]
        fields = params["fields"]  # dict of field name -> value
        note = col.get_note(note_id)
        model = note.note_type()
        field_names = [f["name"] for f in model["flds"]]
        for name, value in fields.items():
            if name in field_names:
                idx = field_names.index(name)
                note.fields[idx] = value
        col.update_note(note)
        return True

    raise ValueError(f"Unknown action: {action}")
