import json
import re

BASE = "/Users/manasmalla/dev/web/projects/sih-gitam-nav"

HARD_ORG_KEYWORDS = [
    "ntro",
    "national technical research",
    "ministry of home affairs",
    "ministry of defence",
    "defence",
    "drdo",
    "military",
    "army",
    "navy",
    "air force",
    "intelligence bureau",
    "crpf",
    "bsf",
    "cisf",
    "central reserve police",
    "border security force",
]

HARD_KEYWORDS = [
    "quantum",
    "cryptograph",
    "encryption",
    "decryption",
    "malware",
    "trojan",
    "ransomware",
    "de-anonymis",
    "deanonymis",
    "vulnerabilit",
    "exploit",
    "firmware",
    " sdr ",
    "gnu radio",
    "forward error correction",
    "demodulat",
    "ipsec",
    "ipv6",
    "phishing",
    "hidden server",
    "tor network",
    "anonymous channel",
    "biometric",
    "myoelectric",
    "bionic",
    "prosthe",
    "avalanche",
    "terrain recognition",
    "computational complexity",
    "digital twin",
    "underwater",
    "generative design",
    "semiconductor",
    "satellite",
    "gnss",
    "radar",
    "sonar",
    "spectroscop",
    "chromatograph",
    "desalination",
    "cryogenic",
    "drone swarm",
    "autonomous navigation",
    "signal processing",
    "up/down-converter",
    "network security",
    "log-collection",
    "security operation centre",
    "hazardous atmosphere",
    "co-electrolyzer",
    "electrolysis",
    "microgrid",
    "digital forensic",
    "steganograph",
    "side-channel",
    "post-quantum",
    "airgapped",
    "air-gapped",
]

EASY_KEYWORDS = [
    "locator",
    "directory",
    "catalog",
    "awareness",
    "virtual zoo",
    "feedback software",
    "translator tool",
    "dubbing",
    "price comparison",
    "image correctness",
    "certificate generation",
    "e-waste facility",
    "tracking app",
    "student innovation",
    "portal",
    "dashboard for real-time monitoring",
    "gamified",
]


def classify_difficulty(text, org):
    t = f" {text.lower()} "
    o = f" {org.lower()} "
    for kw in HARD_ORG_KEYWORDS:
        if kw in o:
            return "Hard"
    for kw in HARD_KEYWORDS:
        if kw in t:
            return "Hard"
    for kw in EASY_KEYWORDS:
        if kw in t:
            return "Easy"
    return "Medium"


def summarize(description, title, limit=260):
    text = re.sub(r"\s+", " ", description or title).strip()
    text = re.sub(r"^Background:\s*", "", text)
    if len(text) <= limit:
        return text
    cut = text[:limit]
    last_space = cut.rfind(" ")
    return cut[:last_space].rstrip(".,;: ") + "…"


def base_problem(**kwargs):
    p = {
        "ps_id": "",
        "title": "",
        "summary": "",
        "description": "",
        "difficulty": "Medium",
        "technology": [],
        "stakeholders": [],
        "impact_area": [],
        "data_resource_type": [],
        "solution_type": [],
        "organization": "",
        "department": "",
        "category": "Software",
        "theme": "Miscellaneous",
        "submission_count": None,
        "year": 2026,
        "hidden": False,
    }
    p.update(kwargs)
    return p


data_2026_raw = json.load(open(f"{BASE}/scripts/data_2026.json"))

problems_2026 = []
for d in data_2026_raw:
    text = f"{d['title']} {d['description']} {d['theme']}"
    difficulty = classify_difficulty(text, f"{d['organization']} {d['department']}")
    problems_2026.append(
        base_problem(
            ps_id=d["ps_id"],
            title=d["title"],
            summary=summarize(d["description"], d["title"]),
            description=d["description"],
            difficulty=difficulty,
            organization=d["organization"] or d["department"] or "Unknown",
            department=d["department"] or d["organization"] or "Unknown",
            category=d["category"],
            theme=d["theme"],
            submission_count=d["submission_count"],
            year=2026,
            hidden=False,
        )
    )

existing = json.load(open(f"{BASE}/src/data/problems.json"))

# hide every problem statement from prior years
hidden_count = 0
for p in existing:
    if p.get("year") != 2026:
        if not p.get("hidden"):
            hidden_count += 1
        p["hidden"] = True

all_problems = existing + problems_2026

ids = [p["ps_id"] for p in all_problems]
print("2026 rows added:", len(problems_2026))
print("previously-visible rows now hidden:", hidden_count)
print("total problems:", len(all_problems))
print("duplicate ids overall:", len(ids) - len(set(ids)))

by_year_hidden = {}
for p in all_problems:
    key = (p["year"], p["hidden"])
    by_year_hidden[key] = by_year_hidden.get(key, 0) + 1
for k in sorted(by_year_hidden):
    print(k, by_year_hidden[k])

diffs = {}
for p in problems_2026:
    diffs[p["difficulty"]] = diffs.get(p["difficulty"], 0) + 1
print("2026 difficulty distribution:", diffs)

json.dump(all_problems, open(f"{BASE}/src/data/problems.json", "w"), indent=2, ensure_ascii=False)
