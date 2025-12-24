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
import time
from http.server import SimpleHTTPRequestHandler
from typing import Callable

from anki.collection import Collection


class RequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with dependency injection.

    Use with functools.partial to inject dependencies:
        handler = partial(RequestHandler, get_col=lambda: col)
        HTTPServer(("127.0.0.1", port), handler)
    """

    def __init__(
        self,
        *args,
        get_col: Callable[[], Collection],
        directory: str | None = None,
        run: Callable[[Callable], None] | None = None,
        **kwargs,
    ):
        self.get_col = get_col
        self.run = run or (lambda f: f())
        self._serve_static = directory is not None
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self):
        if self.path == "/api/health":
            self._send_json({"status": "ok"})
        elif self._serve_static:
            super().do_GET()
        else:
            self.send_error(404)

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

        result: dict[str, object] = {"result": None, "error": None}

        def do_action():
            try:
                col = self.get_col()
                result["result"] = handle_action(col, action, params)
            except Exception as e:
                result["error"] = str(e)

        self.run(do_action)
        self._send_json(result)

    def _send_json(self, data):
        try:
            body = json.dumps(data).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except BrokenPipeError:
            pass  # Client disconnected

    def log_message(self, format, *args):
        pass  # Suppress logging


def handle_action(col: Collection, action: str, params: dict):
    """Handle API action with given collection."""
    if action == "getSchema":
        return {
            "models": {
                model["name"]: [f["name"] for f in model["flds"]]
                for model in col.models.all()
            },
            "decks": sorted(d["name"] for d in col.decks.all()),
            "tags": sorted(col.tags.all()),
        }

    elif action == "browseNotes":
        query = params["query"]
        limit = params.get("limit")
        offset = params.get("offset", 0)
        timing = {}

        t0 = time.perf_counter()
        note_ids = col.find_notes(query)
        timing["find_ms"] = int((time.perf_counter() - t0) * 1000)
        total = len(note_ids)

        # Server-side pagination: slice IDs before fetch
        if limit is not None:
            note_ids = note_ids[offset : offset + limit]

        t0 = time.perf_counter()
        notes = []
        for nid in note_ids:
            note = col.get_note(nid)
            model = note.note_type()
            assert model is not None
            cards = note.cards()
            deck_name = col.decks.name(cards[0].did) if cards else ""
            notes.append(
                {
                    "id": nid,
                    "modelName": model["name"],
                    "fields": {
                        f["name"]: note.fields[i]
                        for i, f in enumerate(model["flds"])
                    },
                    "tags": list(note.tags),
                    "deckName": deck_name,
                }
            )
        timing["fetch_ms"] = int((time.perf_counter() - t0) * 1000)
        timing["count"] = len(notes)

        return {"items": notes, "total": total, "timing": timing}

    elif action == "browseCards":
        query = params["query"]
        limit = params.get("limit")
        offset = params.get("offset", 0)
        timing = {}

        t0 = time.perf_counter()
        card_ids = col.find_cards(query)
        timing["find_ms"] = int((time.perf_counter() - t0) * 1000)
        total = len(card_ids)

        # Server-side pagination: slice IDs before fetch
        if limit is not None:
            card_ids = card_ids[offset : offset + limit]

        t0 = time.perf_counter()
        card_data = []
        for cid in card_ids:
            card = col.get_card(cid)
            note = card.note()
            model = note.note_type()
            assert model is not None
            card_data.append(
                {
                    "id": cid,
                    "noteId": card.nid,
                    "deckName": col.decks.name(card.did),
                    "modelName": model["name"],
                    "fields": {
                        f["name"]: note.fields[i]
                        for i, f in enumerate(model["flds"])
                    },
                    "tags": list(note.tags),
                    # Card-specific
                    "flag": card.flags,
                    "queue": card.queue,  # -1 = suspended, 0 = new, 1 = learning, 2 = review
                    "due": card.due,
                    "interval": card.ivl,
                }
            )
        timing["fetch_ms"] = int((time.perf_counter() - t0) * 1000)
        timing["count"] = len(card_data)

        return {"items": card_data, "total": total, "timing": timing}

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
        assert model is not None
        field_names = [f["name"] for f in model["flds"]]
        for name, value in fields.items():
            if name in field_names:
                idx = field_names.index(name)
                note.fields[idx] = value
        col.update_note(note)
        return True

    elif action == "setSuspended":
        card_id = params["cardId"]
        suspended = params["suspended"]  # boolean
        if suspended:
            col.sched.suspend_cards([card_id])
        else:
            col.sched.unsuspend_cards([card_id])
        # Return the new queue value
        card = col.get_card(card_id)
        return card.queue

    elif action == "updateNoteTags":
        note_id = params["noteId"]
        tags = params["tags"]  # list of tag strings
        note = col.get_note(note_id)
        note.tags = tags
        col.update_note(note)
        return True

    raise ValueError(f"Unknown action: {action}")
