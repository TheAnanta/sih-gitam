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
    "abrasion / corrosion of\nunderwater",
    "drone swarm",
    "autonomous navigation",
    "signal processing",
    "up/down-converter",
    "network security",
    "log-collection",
    "security operation centre",
    "soc' in the",
    "threat zone of an explosion",
    "hazardous atmosphere",
    "co-electrolyzer",
    "electrolysis",
    "microgrid",
    "cyber-security enabled smart controller",
    "reasoning about computational",
    "explainable ai",
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
        "year": 2025,
    }
    p.update(kwargs)
    return p


# ---- 2025 (already rich) ----
data_2025 = json.load(open(f"{BASE}/scripts/data_2025_original.json"))
problems_2025 = []
for d in data_2025:
    d = dict(d)
    d["year"] = 2025
    problems_2025.append(d)

# ---- 2024 ----
data_2024 = json.load(open(f"{BASE}/scripts/data_2024.json"))
problems_2024 = []
for d in data_2024:
    text = f"{d['title']} {d['description']} {d['theme']}"
    difficulty = classify_difficulty(text, f"{d['organization']} {d['department']}")
    problems_2024.append(
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
            submission_count=None,
            year=2024,
        )
    )

# ---- 2023 ----
data_2023 = json.load(open(f"{BASE}/scripts/data_2023.json"))
problems_2023 = []
for d in data_2023:
    text = f"{d['title']} {d['theme']}"
    difficulty = classify_difficulty(text, d["organization"])
    problems_2023.append(
        base_problem(
            ps_id=d["ps_id"],
            title=d["title"],
            summary=d["title"],
            description=d["title"],
            difficulty=difficulty,
            organization=d["organization"],
            department=d["organization"],
            category=d["category"],
            theme=d["theme"],
            submission_count=None,
            year=2023,
        )
    )

all_problems = problems_2025 + problems_2024 + problems_2023

ids = [p["ps_id"] for p in all_problems]
years = {}
for p in all_problems:
    years[p["year"]] = years.get(p["year"], 0) + 1

diffs = {}
for p in all_problems:
    key = (p["year"], p["difficulty"] if isinstance(p["difficulty"], str) else p["difficulty"][0])
    diffs[key] = diffs.get(key, 0) + 1

print("total:", len(all_problems))
print("by year:", years)
print("duplicate ids across years:", len(ids) - len(set(ids)))
for k in sorted(diffs):
    print(k, diffs[k])

json.dump(all_problems, open(f"{BASE}/src/data/problems.json", "w"), indent=2, ensure_ascii=False)
