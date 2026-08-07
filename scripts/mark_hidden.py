import json

BASE = "/Users/manasmalla/dev/web/projects/sih-gitam-nav"

ORG_KEYWORDS = [
    "panchayat",
    "law & justice",
    "law and justice",
    "jal shakti",
    "information and broadcasting",
    "youth affairs",
    "department of sports",
    "agricultur",
    "fisheries",
    "ministry of education",
    "department of higher",
    "higher education department",
    "higher and technical education",
    "education department",
    "eduction department",
    "directorate of technical education",
    "directorate of colleges",
    "ministry of environment",
    "ministry of culture",
    "heritage",
    "ayush",
    "ayurved",
]

THEME_KEYWORDS = [
    "medtech",
    "biotech",
    "healthtech",
    "agriculture",
    "rural",
    "smart education",
]

SKILL_DEV_KEYWORDS = [
    "skill development",
]


def as_list(v):
    return v if isinstance(v, list) else [v]


def text_of(problem):
    org = problem.get("organization", "") or ""
    dept = problem.get("department", "") or ""
    return f"{org} {dept}".lower()


def theme_text(problem):
    return " ".join(as_list(problem.get("theme", ""))).lower()


def classify(problem):
    org_dept = text_of(problem)
    theme = theme_text(problem)
    title_desc = f"{problem.get('title','')} {problem.get('description','')}".lower()

    if any(kw in org_dept for kw in ORG_KEYWORDS):
        return True
    if any(kw in theme for kw in THEME_KEYWORDS):
        return True
    if any(kw in org_dept or kw in title_desc for kw in SKILL_DEV_KEYWORDS):
        return True
    return False


data = json.load(open(f"{BASE}/src/data/problems.json"))
hidden_count = 0
for p in data:
    p["hidden"] = classify(p)
    if p["hidden"]:
        hidden_count += 1

print("total:", len(data), "hidden:", hidden_count, "visible:", len(data) - hidden_count)

by_year = {}
for p in data:
    if p["hidden"]:
        by_year[p["year"]] = by_year.get(p["year"], 0) + 1
print("hidden by year:", by_year)

json.dump(data, open(f"{BASE}/src/data/problems.json", "w"), indent=2, ensure_ascii=False)
