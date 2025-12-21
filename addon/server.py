"""HTTP server for Browse Web add-on."""

import json
import os
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

from aqt import mw

_server: HTTPServer | None = None
_thread: threading.Thread | None = None

WEB_DIR = Path(__file__).parent / "dist"


class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

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

        # Run on main thread for thread safety
        result = {"result": None, "error": None}
        event = threading.Event()

        def run():
            try:
                result["result"] = handle_action(action, params)
            except Exception as e:
                result["error"] = str(e)
            finally:
                event.set()

        mw.taskman.run_on_main(run)
        event.wait()

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


def handle_action(action: str, params: dict):
    col = mw.col

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
            # Get first field as sort field (like Anki browser)
            sort_field = note.fields[0] if note.fields else ""
            cards.append({
                "id": cid,
                "noteId": card.nid,
                "deckName": col.decks.name(card.did),
                "modelName": model["name"],
                "sortField": sort_field,
                "flag": card.flags,
                "queue": card.queue,  # -1 = suspended, 0 = new, 1 = learning, 2 = review
                "due": card.due,
                "interval": card.ivl,
            })
        return cards

    raise ValueError(f"Unknown action: {action}")


def start_server(port: int):
    global _server, _thread

    if _server is not None:
        return

    _server = HTTPServer(("127.0.0.1", port), RequestHandler)
    _thread = threading.Thread(target=_server.serve_forever, daemon=True)
    _thread.start()


def stop_server():
    global _server, _thread

    if _server is not None:
        _server.shutdown()
        _server = None
        _thread = None
