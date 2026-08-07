import json
import re
import pdfplumber

def clean(s):
    return re.sub(r"\s+", " ", s.replace("\n", " ")).strip()

def extract(pdf_path):
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for r in table:
                    fields = [c for c in r[1:] if c is not None and str(c).strip() != ""]
                    if len(fields) != 5:
                        continue
                    org, title, category, ps_number, domain = fields
                    if not re.match(r"^SIH\d+$", ps_number.strip()):
                        continue
                    if category.strip() not in ("Software", "Hardware"):
                        continue
                    rows.append(
                        {
                            "ps_id": ps_number.strip(),
                            "organization": clean(org),
                            "title": clean(title),
                            "category": category.strip(),
                            "theme": clean(domain),
                        }
                    )
    return rows

software = extract("/Users/manasmalla/Downloads/Software Problem Statements.pdf")
hardware = extract("/Users/manasmalla/Downloads/Hardware Problem Statements.pdf")

all_rows = software + hardware
ids = [r["ps_id"] for r in all_rows]
print("software:", len(software), "hardware:", len(hardware), "total:", len(all_rows))
print("duplicate ids:", len(ids) - len(set(ids)))

with open("/Users/manasmalla/dev/web/projects/sih-gitam-nav/scripts/data_2023.json", "w") as f:
    json.dump(all_rows, f, indent=2)
