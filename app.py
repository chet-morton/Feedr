/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 174: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 199: cannot create temp file for here document: Operation not permitted
"""Flask API for Fieldfare, a feed-ration planning calculator."""
from __future__ import annotations

import os
from pathlib import Path
from flask import Flask, jsonify, request, render_template, send_from_directory

app = Flask(__name__, static_folder=None, template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 256 * 1024


def _number(value, name, *, minimum=0, maximum=1_000_000):
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a number.")
    if not minimum <= result <= maximum:
        raise ValueError(f"{name} must be between {minimum:g} and {maximum:g}.")
    return result


@app.get("/")
def home():
    return render_template("index.html", pocketbase_url=os.environ.get("POCKETBASE_URL", "").rstrip("/"))


@app.get("/static/<path:filename>")
def local_static(filename):
    # Vercel serves public/** from its CDN; this route provides the same path locally.
    return send_from_directory(Path(__file__).parent / "public" / "static", filename)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "fieldfare-api"})


@app.post("/api/calculate")
def calculate():
    """Analyze entered as-fed amounts against feed analyses (all nutrient % on DM)."""
    try:
        payload = request.get_json(force=True, silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Send ration inputs as a JSON object."}), 400
        animals = _number(payload.get("head_count", 1), "Head count", minimum=1, maximum=100_000)
        if not animals.is_integer():
            raise ValueError("Head count must be a whole number.")
        body_weight = _number(payload.get("body_weight", 0), "Body weight", minimum=0.01)
        feeds = payload.get("feeds", [])
        if not isinstance(feeds, list) or not 1 <= len(feeds) <= 24:
            raise ValueError("Add between 1 and 24 feeds.")
        targets = payload.get("targets", {})
        if not isinstance(targets, dict):
            raise ValueError("Targets must be a JSON object.")

        totals = {"as_fed": 0.0, "dry_matter": 0.0, "protein": 0.0, "energy": 0.0, "calcium": 0.0, "phosphorus": 0.0, "forage_dm": 0.0, "cost": 0.0}
        rows = []
        for feed in feeds:
            if not isinstance(feed, dict):
                raise ValueError("Each feed must be a JSON object.")
            name = str(feed.get("name", "Feed")).strip()[:80] or "Feed"
            amount = _number(feed.get("amount", 0), f"{name} amount", maximum=5000)
            dm_pct = _number(feed.get("dm_pct", 90), f"{name} dry matter", maximum=100)
            dm = amount * dm_pct / 100
            row = {"name": name, "amount": amount, "dm": dm, "protein": dm * _number(feed.get("protein_pct", 0), f"{name} protein", maximum=100) / 100,
                   "energy": dm * 0.45359237 * _number(feed.get("energy_mcal_kg", 0), f"{name} energy", maximum=20),
                   "calcium": dm * _number(feed.get("calcium_pct", 0), f"{name} calcium", maximum=100) / 100,
                   "phosphorus": dm * _number(feed.get("phosphorus_pct", 0), f"{name} phosphorus", maximum=100) / 100,
                   "cost": amount * _number(feed.get("cost_per_lb", 0), f"{name} cost per pound", maximum=1000),
                   "forage": feed.get("is_forage") is True}
            rows.append(row)
            for key in ("as_fed", "dry_matter", "protein", "energy", "calcium", "phosphorus"):
                totals[key] += row["amount"] if key == "as_fed" else row["dm"] if key == "dry_matter" else row[key]
            totals["cost"] += row["cost"]
            if row["forage"]:
                totals["forage_dm"] += dm

        daily_dm = _number(targets.get("daily_dm", body_weight * 0.02), "Daily dry matter target", minimum=0.01)
        daily_protein = _number(targets.get("daily_protein", 0), "Daily protein target")
        daily_energy = _number(targets.get("daily_energy", 0), "Daily energy target")
        daily_calcium = _number(targets.get("daily_calcium", 0), "Daily calcium target")
        daily_phosphorus = _number(targets.get("daily_phosphorus", 0), "Daily phosphorus target")
        per_head = {"as_fed": totals["as_fed"], "dry_matter": totals["dry_matter"], "protein": totals["protein"], "energy": totals["energy"], "calcium": totals["calcium"], "phosphorus": totals["phosphorus"], "forage_dm": totals["forage_dm"], "cost": totals["cost"]}
        metrics = [
            {"key":"dry_matter", "label":"Dry matter", "value":per_head["dry_matter"], "target":daily_dm, "unit":"lb", "higher_is_better":True},
            {"key":"protein", "label":"Crude protein", "value":per_head["protein"], "target":daily_protein, "unit":"lb", "higher_is_better":True},
            {"key":"energy", "label":"Digestible energy", "value":per_head["energy"], "target":daily_energy, "unit":"Mcal", "higher_is_better":True},
            {"key":"calcium", "label":"Calcium", "value":per_head["calcium"], "target":daily_calcium, "unit":"lb", "higher_is_better":True},
            {"key":"phosphorus", "label":"Phosphorus", "value":per_head["phosphorus"], "target":daily_phosphorus, "unit":"lb", "higher_is_better":True},
        ]
        for metric in metrics:
            metric["coverage_pct"] = (metric["value"] / metric["target"] * 100) if metric["target"] else None
        return jsonify({"per_head": per_head, "herd": {k: v * animals for k, v in per_head.items()}, "head_count": int(animals), "body_weight": body_weight, "metrics": metrics,
                        "forage_share_pct": (per_head["forage_dm"] / per_head["dry_matter"] * 100) if per_head["dry_matter"] else 0,
                        "body_weight_dm_pct": per_head["dry_matter"] / body_weight * 100,
                        "rows": rows, "units": payload.get("units", "lb")})
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=os.environ.get("FLASK_DEBUG") == "1")
