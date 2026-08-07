import json

BASE = "/Users/manasmalla/dev/web/projects/sih-gitam-nav"

# High-confidence canonical merges: typos, truncations, abbreviation
# parenthetical variants, singular/plural, US/UK spelling. Applied to both
# the `organization` and `department` fields.
CANONICAL = {
    # typos / stray spaces
    "Governmen t of Gujarat": "Government of Gujarat",
    "Governmen t of Kerala": "Government of Kerala",
    "Governmen t of Jammu and": "Government of Jammu and Kashmir",
    "Govt of Himachal Pradesh": "Government of Himachal Pradesh",
    "Government of Himachal Pardesh": "Government of Himachal Pradesh",
    # garbled OCR text
    "MMiendiisutrmy of Micro, Small and Medium Enterprises": "Ministry of Micro, Small and Medium Enterprises",
    "Ministry of Micro, Small and": "Ministry of Micro, Small and Medium Enterprises",
    # truncated (missing suffix word(s))
    "National Technical Research Organisatio": "National Technical Research Organisation (NTRO)",
    "Ministry of Social Justice and Empowerm": "Ministry of Social Justice and Empowerment",
    "Ministry of Social Justice and Empowerm ent": "Ministry of Social Justice and Empowerment",
    "Ministry of Social Justice and": "Ministry of Social Justice and Empowerment",
    "Ministry of Social Justice and Empowerm ent ": "Ministry of Social Justice and Empowerment",
    "Ministry of Housing and Urban": "Ministry of Housing and Urban Affairs",
    "Ministry of Fisheries, Animal Husbandry": "Ministry of Fisheries, Animal Husbandry and Dairying",
    "Ministry of Fisheries, Animal Husbandry & Dairying": "Ministry of Fisheries, Animal Husbandry and Dairying",
    "Department of Animal Husbandry & Dairying (DoAH&D)": "Department of Animal Husbandry and Dairying",
    "Department of Animal Husbandry and Dairying": "Department of Animal Husbandry and Dairying",
    "Ministry of Agriculture & Farmers Welfare (MoA&FW)": "Ministry of Agriculture and Farmers Welfare",
    "Ministry of Consumer Affairs, Food & Public Distribution (MoCA,F&PD)": "Ministry of Consumer Affairs, Food and Public Distribution",
    "Ministry of Youth Affairs & Sports": "Ministry of Youth Affairs and Sports",
    "Ministry of Law & Justice": "Ministry of Law and Justice",
    # singular/plural, spelling variants
    "Ministry of Communication": "Ministry of Communications",
    "Ministry of Railway": "Ministry of Railways",
    "Indian Space Research Organisation (ISRO)": "Indian Space Research Organization (ISRO)",
    "Indian National Center for Ocean Information Services (INCOIS)": "Indian National Centre for Ocean Information Services (INCOIS)",
    "Education Department": "Eduction Department",  # normalize the misspelling out
    "Eduction Department": "Education Department",
    "Department of Higher and Technical Education": "Department of Higher and Technical Education",
    "Department of Higher & Technical Education": "Department of Higher and Technical Education",
    "Department of Higher and Technical Education ": "Department of Higher and Technical Education",
    # abbreviation expansions already unified via exact-normalize pass below
    "MathWorks India Private Limited": "MathWorks India Pvt. Ltd.",
    "AICTE, MIC- Student Innovation": "AICTE, MIC-Student Innovation",
    "Bharat Electronics Limited (BEL)": "Bharat Electronics Limited(BEL)",
    "Ministry of AYUSH": "Ministry of Ayush",
    "Ministry of Coal": "Ministry of Coal (MoC)",
    "Ministry of coal": "Ministry of Coal (MoC)",
    "Ministry of Defence": "Ministry of Defence (MoD)",
    "Ministry of Development of North Eastern Region": "Ministry of Development of North Eastern Region (MoDoNER)",
    "Ministry of Earth Sciences": "Ministry of Earth Sciences (MoES)",
    "Ministry of Home Affairs": "Ministry of Home Affairs (MHA)",
    "Ministry of Jal Shakti": "Ministry of Jal Shakti (MoJS)",
    "Ministry of Power": "Ministry of Power (MoP)",
    "Ministry of power": "Ministry of Power (MoP)",
    "Ministry of Social Justice & Empowerment (MoSJE)": "Ministry of Social Justice & Empowerment(MoSJE)",
    "Ministry of Steel": "Ministry of Steel (MoS)",
    "National Technical Research Organisation,(NTRO )": "National Technical Research Organisation (NTRO)",
    "National Technical Research Organisation,(NTRO)": "National Technical Research Organisation (NTRO)",
    "Central Ground Water Board": "Central Ground Water Board (CGWB)",
    "Central Mine Planning & Design Institute Limited": "Central Mine Planning & Design Institute Limited (CMPDI)",
    "Department of Consumer Affairs": "Department of Consumer Affairs (DoCA)",
    "Department of Science and Technology": "Department of Science and Technology (DST)",
    "Department of Water Resources & Ganga Rejuvenation/Central water commission": "Department of Water Resources & Ganga Rejuvenation/Central Water commission",
    "National Security Guard": "National Security Guard (NSG)",
}

# fix a self-referential typo-normalization above (Education/Eduction should
# both resolve to the correctly spelled "Education Department")
CANONICAL["Education Department"] = "Education Department"
CANONICAL["Eduction Department"] = "Education Department"

data = json.load(open(f"{BASE}/src/data/problems.json"))

changed_org = 0
changed_dept = 0
for p in data:
    new_org = CANONICAL.get(p["organization"], p["organization"])
    if new_org != p["organization"]:
        changed_org += 1
    p["organization"] = new_org

    new_dept = CANONICAL.get(p["department"], p["department"])
    if new_dept != p["department"]:
        changed_dept += 1
    p["department"] = new_dept

print("organization values changed:", changed_org)
print("department values changed:", changed_dept)

orgs_after = sorted(set(p["organization"] for p in data))
depts_after = sorted(set(p["department"] for p in data))
print("unique orgs after:", len(orgs_after))
print("unique depts after:", len(depts_after))

json.dump(data, open(f"{BASE}/src/data/problems.json", "w"), indent=2, ensure_ascii=False)
