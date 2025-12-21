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
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Suppress logging


def handle_action(action: str, params: dict):
    col = mw.col

    if action == "modelNames":
        return col.models.all_names()

    elif action == "modelFieldNames":
        model = col.models.by_name(params["modelName"])
        return [f["name"] for f in model["flds"]]

    elif action == "findNotes":
        return list(col.find_notes(params["query"]))

    elif action == "findCards":
        return list(col.find_cards(params["query"]))

    elif action == "getDecks":
        card_ids = params["cards"]
        result = {}
        for cid in card_ids:
            card = col.get_card(cid)
            deck = col.decks.get(card.did)
            deck_name = deck["name"]
            if deck_name not in result:
                result[deck_name] = []
            result[deck_name].append(cid)
        return result

    elif action == "notesInfo":
        notes = []
        for nid in params["notes"]:
            note = col.get_note(nid)
            model = note.note_type()
            notes.append({
                "noteId": nid,
                "modelName": model["name"],
                "fields": {
                    f["name"]: {"value": note.fields[i], "order": i}
                    for i, f in enumerate(model["flds"])
                },
                "tags": list(note.tags),
            })
        return notes

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
