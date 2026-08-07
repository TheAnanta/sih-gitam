import json
import openpyxl

wb = openpyxl.load_workbook(
    "/Users/manasmalla/Downloads/SIH_PS_2024.xlsx", data_only=True
)
ws = wb.active
rows = list(ws.iter_rows(min_row=2, values_only=True))

out = []
for r in rows:
    ps_id, title, category, tech_bucket, _dataset, description, department, organisation = r
    out.append(
        {
            "ps_id": ps_id.strip(),
            "title": title.strip(),
            "category": category.strip(),
            "theme": tech_bucket.strip() if tech_bucket else "Miscellaneous",
            "description": (description or title).strip(),
            "department": (department or "").strip(),
            "organization": (organisation or "").strip(),
        }
    )

print(len(out))
json.dump(out, open("/Users/manasmalla/dev/web/projects/sih-gitam-nav/scripts/data_2024.json", "w"), indent=2)
