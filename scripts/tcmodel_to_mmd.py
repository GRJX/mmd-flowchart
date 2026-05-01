#!/usr/bin/env python3
"""Convert a .tcModel JSON file into the .mmd format used by mmd-flowchart.

Usage:
    python tcmodel_to_mmd.py input.tcModel [output.mmd]

If output is omitted, writes alongside the input with a .mmd extension.
"""

from __future__ import annotations

import json
import math
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Defaults sourced from src/config/blockConfig.ts (BLOCK_CONFIG.defaultSize).
DEFAULT_SIZE = {
    "start": (64, 64),
    "end": (64, 64),
    "action": (160, 112),
    "decision": (160, 112),
    "result": (160, 112),
}

TC_TYPE_TO_KIND = {
    "START": "start",
    "STATEMENT": "action",
    "DECISION": "decision",
    "RESULT": "result",
    "END": "end",
}

ID_PREFIX = {
    "start": "S",
    "action": "A",
    "decision": "D",
    "result": "R",
    "end": "E",
}

# Order in which node lines are emitted in the Mermaid body.
KIND_EMIT_ORDER = ["start", "action", "decision", "result", "end"]


_MERMAID_ENTITIES = {"&": "#amp;", '"': "#quot;", "<": "#lt;", ">": "#gt;"}


def escape_label(text: str) -> str:
    """Escape a label for the visible Mermaid shape literal.

    Matches src/lib/mermaid/serialize.ts: collapse whitespace, then replace
    & " < > with the numeric-style entities the app's parser decodes.
    """
    if text is None:
        return ""
    import re
    s = re.sub(r"[\r\n\t]+", " ", text)
    return re.sub(r"[&\"<>]", lambda m: _MERMAID_ENTITIES[m.group(0)], s)


def combine_fields(*parts: tuple[str, str]) -> str | None:
    """Join (label, value) pairs into a single multiline string. Empty values dropped."""
    lines = []
    for label, value in parts:
        if value is None:
            continue
        v = value.strip()
        if not v:
            continue
        lines.append(f"{label}: {v}" if label else v)
    return "\n".join(lines) if lines else None


def node_center(n: dict[str, Any]) -> tuple[float, float]:
    return (n["x"] + n["w"] / 2.0, n["y"] + n["h"] / 2.0)


def nearest_real_node(comment: dict, real_nodes: list[dict]) -> dict | None:
    if not real_nodes:
        return None
    cx, cy = node_center(comment)
    return min(
        real_nodes,
        key=lambda n: math.hypot(node_center(n)[0] - cx, node_center(n)[1] - cy),
    )


def derive_connection_kind(src_kind: str, start_side: str) -> str:
    """Decision: RIGHT/LEFT -> yes, BOTTOM -> no. Everything else -> default."""
    if src_kind != "decision":
        return "default"
    s = (start_side or "").upper()
    if s in ("RIGHT", "LEFT"):
        return "yes"
    if s == "BOTTOM":
        return "no"
    return "default"


def shape_for(kind: str, label: str) -> str:
    esc = escape_label(label)
    if kind == "start":
        return f"([{esc}])"
    if kind == "end":
        return f"([{esc}])"
    if kind == "action":
        return f'["{esc}"]'
    if kind == "decision":
        return f'{{"{esc}"}}'
    if kind == "result":
        return f'[/"{esc}"/]'
    raise ValueError(f"unknown kind: {kind}")


def edge_line(src_id: str, tgt_id: str, kind: str) -> str:
    if kind == "yes":
        return f"    {src_id} -- Y --> {tgt_id}"
    if kind == "no":
        return f"    {src_id} -- N --> {tgt_id}"
    return f"    {src_id} --> {tgt_id}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def convert(tc: dict[str, Any]) -> str:
    raw_nodes = tc.get("nodes", [])
    raw_links = tc.get("links", [])

    real_nodes: list[dict] = []
    comment_nodes: list[dict] = []
    for n in raw_nodes:
        if n.get("type") == "COMMENT":
            comment_nodes.append(n)
        elif n.get("type") in TC_TYPE_TO_KIND:
            real_nodes.append(n)

    # Assign new ids per kind. Start is singleton ("S"); others get numeric suffix.
    counters: dict[str, int] = {k: 0 for k in ID_PREFIX}
    id_map: dict[int, dict[str, str]] = {}
    seen_start = False
    for n in raw_nodes:
        t = n.get("type")
        if t not in TC_TYPE_TO_KIND:
            continue
        kind = TC_TYPE_TO_KIND[t]
        if kind == "start":
            if seen_start:
                counters[kind] += 1
                new_id = f"S{counters[kind] + 1}"
            else:
                new_id = "S"
                seen_start = True
        else:
            counters[kind] += 1
            new_id = f"{ID_PREFIX[kind]}{counters[kind]}"
        id_map[n["id"]] = {"id": new_id, "kind": kind}

    # Attach each comment to the spatially-nearest real node.
    comments_by_new_id: dict[str, list[dict]] = {info["id"]: [] for info in id_map.values()}
    for c in comment_nodes:
        target = nearest_real_node(c, real_nodes)
        if target is None:
            continue
        new_id = id_map[target["id"]]["id"]
        text = (c.get("label") or "").strip()
        if not text:
            continue
        comments_by_new_id[new_id].append({
            "id": str(uuid.uuid4()),
            "text": text,
            "timestamp": now_iso(),
        })

    # Build per-node meta and Mermaid node lines.
    meta: dict[str, Any] = {}
    node_lines_by_kind: dict[str, list[str]] = {k: [] for k in KIND_EMIT_ORDER}

    for n in raw_nodes:
        if n.get("type") not in TC_TYPE_TO_KIND:
            continue
        kind = TC_TYPE_TO_KIND[n["type"]]
        new_id = id_map[n["id"]]["id"]

        # Visible label.
        if kind == "end":
            visible_label = "End"
        elif kind == "start":
            visible_label = (n.get("label") or "Start").strip() or "Start"
        else:
            visible_label = (n.get("label") or "").strip()

        node_lines_by_kind[kind].append(f"    {new_id}{shape_for(kind, visible_label)}")

        # Data-field flattening.
        desc = n.get("description") or ""
        pre = n.get("preconditions") or ""
        pre_no = n.get("preconditionsNo") or ""
        data = n.get("data") or ""
        data_no = n.get("dataNo") or ""

        block_meta: dict[str, Any] = {
            "position": {"x": n["x"], "y": n["y"]},
            "width": DEFAULT_SIZE[kind][0],
            "height": DEFAULT_SIZE[kind][1],
            "comments": comments_by_new_id.get(new_id, []),
        }

        if kind in ("start", "action"):
            block_meta["dataField"] = combine_fields(
                ("Description", desc),
                ("Preconditions", pre),
                ("Data", data),
            )
            block_meta["expectedOutcome"] = None
        elif kind == "decision":
            block_meta["yesDataField"] = combine_fields(
                ("Description", desc),
                ("Preconditions", pre),
                ("Data", data),
            )
            block_meta["noDataField"] = combine_fields(
                ("Preconditions", pre_no),
                ("Data", data_no),
            )
        elif kind == "result":
            block_meta["dataField"] = None
            block_meta["expectedOutcome"] = combine_fields(
                ("Description", desc),
                ("Preconditions", pre),
                ("Data", data),
            )
        elif kind == "end":
            block_meta["dataField"] = None
            block_meta["expectedOutcome"] = None

        meta[new_id] = block_meta

    # Build connections meta + edge lines.
    connections: dict[str, Any] = {}
    edge_lines: list[str] = []
    for link in raw_links:
        src = id_map.get(link["startNode"])
        tgt = id_map.get(link["endNode"])
        if not src or not tgt:
            continue  # skip dangling links (shouldn't happen)
        kind = derive_connection_kind(src["kind"], link.get("startSide", ""))
        key = f"{src['id']}-{tgt['id']}-{kind}"
        connections[key] = {
            "dataField": None,
            "sourceSide": (link.get("startSide") or "bottom").lower(),
            "targetSide": (link.get("endSide") or "top").lower(),
            "kind": kind,
        }
        edge_lines.append(edge_line(src["id"], tgt["id"], kind))

    header_payload = {"version": "1", "meta": meta, "connections": connections}
    header_json = json.dumps(header_payload, ensure_ascii=False)

    body_lines: list[str] = ["flowchart TD"]
    for k in KIND_EMIT_ORDER:
        body_lines.extend(node_lines_by_kind[k])
    body_lines.extend(edge_lines)

    return (
        "%% MMD_META_START\n"
        f"%% {header_json}\n"
        "%% MMD_META_END\n"
        + "\n".join(body_lines)
        + "\n"
    )


def main(argv: list[str]) -> int:
    if len(argv) < 2 or len(argv) > 3:
        print(__doc__, file=sys.stderr)
        return 2
    in_path = Path(argv[1])
    out_path = Path(argv[2]) if len(argv) == 3 else in_path.with_suffix(".mmd")

    tc = json.loads(in_path.read_text(encoding="utf-8"))
    out_path.write_text(convert(tc), encoding="utf-8")
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
