#!/usr/bin/env python3
"""Build data/tgi.json — per-segment TGI media + lifestyle profile.

Reads the three TGI export workbooks in data-src/ (Demographics, Lifestyle,
Media_Consumption). Each workbook is a flat TGI crosstab: rows are
"Item ~ Battery" blocks of five stat rows (Audience(000), Resps, %Col, %Row,
Index); columns 7-10 are the four Compass segments as built in TGI
(ADAPTERS, STRIVERS, COASTERS, RETREATERS), which map to the published
segment names (Architects, Hustlers, Coasters, Retreaters).

Run from repo root:  python3 scripts/build_tgi_json.py
"""

import json
import re
from pathlib import Path

import pandas as pd

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "data-src"
OUT = REPO / "data" / "tgi.json"

SEGMENT_COLUMNS = {"architects": 7, "hustlers": 8, "coasters": 9, "retreaters": 10}
TOTALS_COLUMN = 2
STAT_ROWS = ("Audience(000)", "Resps", "%Col", "%Row", "Index")

MIN_SEGMENT_RESPS = 100
MEDIA_MIN_TOTAL_PCT = 4.0
LIFESTYLE_MIN_TOTAL_PCT = 10.0
ARCHETYPE_MIN_TOTAL_PCT = 8.0
DEMO_MIN_TOTAL_PCT = 5.0
MEDIA_SPLIT = (8, 4)  # top over-indexing, top under-indexing
LIFESTYLE_SPLIT = (7, 3)
DEMO_SPLIT = (4, 2)

DECK_SHARE_PCT = {"architects": 17, "hustlers": 28, "coasters": 27, "retreaters": 28}

DATE_TAG = re.compile(r"\s*\(\+\d{2}/\d{2}\)")


def loadWorkbook(name):
    """Parse a TGI export into {(item, battery): {totalPct, segments:{...}}}."""
    frame = pd.read_excel(SRC / f"State_of_Independance_TGI_{name}.xlsx", header=None)
    parsed = {}
    for label, block in frame.groupby(0, sort=False):
        label = str(label).strip()
        if "~" not in label and label != "Totals":
            continue
        stats = {str(r[1]).strip(): r for _, r in block.iterrows()}
        if not all(s in stats for s in STAT_ROWS):
            continue
        if label == "Totals":
            item, battery = "Totals", ""
        else:
            item, battery = (part.strip() for part in label.split("~", 1))
        key = (item, battery)
        if key in parsed:
            continue  # workbook repeats whole sections verbatim
        segments = {}
        for segment, col in SEGMENT_COLUMNS.items():
            segments[segment] = {
                "resps": pd.to_numeric(stats["Resps"][col], errors="coerce"),
                "pct": pd.to_numeric(stats["%Col"][col], errors="coerce"),
                "index": pd.to_numeric(stats["Index"][col], errors="coerce"),
            }
        parsed[key] = {
            "totalPct": pd.to_numeric(stats["%Col"][TOTALS_COLUMN], errors="coerce"),
            "totalRowPct": {
                seg: pd.to_numeric(stats["%Row"][col], errors="coerce")
                for seg, col in SEGMENT_COLUMNS.items()
            },
            "audience000": {
                seg: pd.to_numeric(stats["Audience(000)"][col], errors="coerce")
                for seg, col in SEGMENT_COLUMNS.items()
            },
            "segments": segments,
        }
    return parsed


def cleanText(text):
    return DATE_TAG.sub("", text).strip()


def mediaCandidates(rows):
    """Yield (label, rowData) for the curated media channel batteries."""
    for (item, battery), row in rows.items():
        item = cleanText(item)
        if battery == "Social Media-Sites Used" and item != "Other":
            yield item, row
        elif battery == "A.I.R.":
            yield f"{item} (print readership)", row
        elif battery == "Reading News Online-Newspaper Websites/Apps Visited":
            if item != "None of These":
                yield f"{item} (news online)", row
        elif battery == "Podcasts-Topics" and item != "Other":
            yield f"{item} podcasts", row
        elif battery == "Radio Shows-Programme Types":
            if not item.startswith("Other"):
                yield f"{item} radio shows", row
        elif battery.startswith("Online Subscription Viewing Services-Have/Pay For-"):
            service = battery.rsplit("-", 1)[1]
            if service != "Other" and item.lower().startswith("have"):
                yield f"{service} (subscription household)", row
        elif battery == "Live TV-Number Of Days Watched Last Week":
            if item == "Every day":
                yield "Watches live TV every day", row
        elif battery == "Podcasts-Watch" and item.startswith("Always"):
            yield "Watches (not just listens to) podcasts", row
        elif battery == "Music Streaming-Listen" and item == "Yes":
            yield "Streams music", row
        elif battery == "Radio Listening-Listen" and item == "Yes":
            yield "Listens to radio", row


LIFESTYLE_STATEMENT_BATTERIES = {
    "Shopping And Retail",
    "Internet And Communications",
    "Financial Services",
    "Food And Diet",
    "Technology",
    "Leisure",
    "Holidays And Travel",
    "Personal - Social, Political And Ethical",
    "Personal - Appearance",
    "Health And Pharmaceuticals",
    "Motoring",
    "Newspapers And Magazines",
}

ARCHETYPE_BATTERIES = {
    "Shopper Archetypes-FMCG Shopper Archetypes": "FMCG shopper archetype",
    "Finance Archetypes": "finance archetype",
    "Holiday Archetypes": "holiday archetype",
    "Ecommerce Clusters-E-Commerce Clusters": "e-commerce cluster",
}


def lifestyleCandidates(rows):
    for (item, battery), row in rows.items():
        item = cleanText(item)
        if battery in LIFESTYLE_STATEMENT_BATTERIES and item.startswith("A/A "):
            minPct = LIFESTYLE_MIN_TOTAL_PCT
            yield f"“{item[4:]}”", row, minPct
        elif battery in ARCHETYPE_BATTERIES:
            yield f"{item} ({ARCHETYPE_BATTERIES[battery]})", row, ARCHETYPE_MIN_TOTAL_PCT


DEMO_BATTERIES = {
    "Sex And Status-Sex": "",
    "Age-Age Group": "aged ",
    "Income-Total Family Income Before Tax": "family income ",
    "Working Status": "",
    "Relationship Status": "",
    "Education-Highest Level Of Education Achieved (HLEA)": "education: ",
    "Home Ownership": "home: ",
    "Regions-Government Office Regions": "lives in ",
}


def demoCandidates(rows):
    for (item, battery), row in rows.items():
        prefix = DEMO_BATTERIES.get(battery)
        if prefix is None:
            continue
        item = cleanText(item)
        if item.endswith("(Net)") or item == "Totals":
            continue
        yield f"{prefix}{item}", row


def pickBalanced(candidates, segment, split, defaultMinPct):
    """Pick the strongest over-indexing and under-indexing items for a segment."""
    scored = []
    for entry in candidates:
        label, row = entry[0], entry[1]
        minPct = entry[2] if len(entry) > 2 else defaultMinPct
        stats = row["segments"][segment]
        valid = (
            pd.notna(stats["index"])
            and pd.notna(stats["pct"])
            and pd.notna(row["totalPct"])
            and stats["resps"] >= MIN_SEGMENT_RESPS
            and row["totalPct"] >= minPct
        )
        if not valid:
            continue
        scored.append(
            {"label": label, "index": round(float(stats["index"])), "pct": round(float(stats["pct"]), 1)}
        )
    overCount, underCount = split
    over = [c for c in sorted(scored, key=lambda c: c["index"], reverse=True) if c["index"] >= 110]
    under = [c for c in sorted(scored, key=lambda c: c["index"]) if c["index"] <= 90]
    picked = over[:overCount] + list(reversed(under[:underCount]))
    return picked


def buildSegment(segment, demoRows, lifestyleRows, mediaRows):
    totalsRow = demoRows[("Totals", "")]
    demographics = {
        "tgiAudienceThousands": int(totalsRow["audience000"][segment]),
        "tgiShareOfAdultsPct": round(float(totalsRow["totalRowPct"][segment]), 1),
        "deckSharePct": DECK_SHARE_PCT[segment],
        "skews": pickBalanced(demoCandidates(demoRows), segment, DEMO_SPLIT, DEMO_MIN_TOTAL_PCT),
    }
    return {
        "media": pickBalanced(mediaCandidates(mediaRows), segment, MEDIA_SPLIT, MEDIA_MIN_TOTAL_PCT),
        "lifestyle": pickBalanced(lifestyleCandidates(lifestyleRows), segment, LIFESTYLE_SPLIT, LIFESTYLE_MIN_TOTAL_PCT),
        "demographics": demographics,
    }


def main():
    demoRows = loadWorkbook("Demographics")
    lifestyleRows = loadWorkbook("Lifestyle")
    mediaRows = loadWorkbook("Media_Consumption")
    payload = {
        "source": "TGI / Compass",
        "sourceDetail": "TGB2604A TGI GB 2026 April (March 2025 - February 2026), population weight. "
        "Compass segments recreated in TGI as Boolean attitude audiences (see data-src/Compass_Audience_Settings.md); "
        "TGI names Adapters/Strivers map to the published Architects/Hustlers.",
        "indexNote": "Index = segment % divided by all-GB-adults %, x100. 100 = average; read >120 or <80 as strongly differentiating. "
        "pct = % of segment. TGI audience shares differ from the survey segmentation sizes (deckSharePct); the deck is canonical on sizing.",
        "segments": {
            segment: buildSegment(segment, demoRows, lifestyleRows, mediaRows)
            for segment in SEGMENT_COLUMNS
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    counts = {
        s: (len(payload["segments"][s]["media"]), len(payload["segments"][s]["lifestyle"]), len(payload["segments"][s]["demographics"]["skews"]))
        for s in payload["segments"]
    }
    print(json.dumps(counts))


if __name__ == "__main__":
    main()
