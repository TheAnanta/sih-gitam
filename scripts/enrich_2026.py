import json
import re

BASE = "/Users/manasmalla/dev/web/projects/sih-gitam-nav"

LABEL_RE = re.compile(
    r"^(?:[•\-•]\s*)?(?:Background|Description|Expected Solution)s?:?\s*",
    re.IGNORECASE,
)


def clean_start(text):
    prev = None
    while prev != text:
        prev = text
        text = LABEL_RE.sub("", text).strip()
    return text


def summarize(description, title, limit=280):
    text = re.sub(r"\s+", " ", description or title).strip()
    text = clean_start(text)
    if not text:
        text = title
    if len(text) <= limit:
        return text
    sentences = re.split(r"(?<=[.!?])\s+", text)
    out = []
    total = 0
    for s in sentences:
        if out and total + len(s) > limit:
            break
        out.append(s)
        total += len(s) + 1
    summary = " ".join(out).strip()
    if not summary or len(summary) > limit * 1.6:
        cut = text[:limit]
        last_space = cut.rfind(" ")
        summary = cut[: last_space if last_space > 0 else limit].rstrip(".,;: ") + "…"
    return summary


# Canonical tag vocabularies, matching the existing 2025 dataset taxonomy.
TECHNOLOGY_RULES = [
    ("Artificial Intelligence (AI)", ["artificial intelligence", r"\bai\b", "ai-based", "ai/ml", "al-based", "al-powered"]),
    ("Machine Learning (ML)", ["machine learning", r"\bml\b", "predictive model", "predictive analytics"]),
    ("Deep Learning (DL)", ["deep learning", "neural network", "cnn", "lstm", "transformer model"]),
    ("Natural Language Processing (NLP)", ["natural language processing", r"\bnlp\b", "chatbot", "speech recognition", "text-to-speech", "language model"]),
    ("Computer Vision", ["computer vision", "image processing", "image recognition", "object detection", "video analytics"]),
    ("Robotics", ["robot", "robotic", "manipulator arm", "autonomous vehicle", "drone-based", "uav "]),
    ("IoT (Internet of Things)", ["iot", "internet of things", "sensor network", "smart sensor"]),
    ("Blockchain", ["blockchain", "distributed ledger", "smart contract"]),
    ("Cybersecurity", ["cybersecurity", "cyber security", "encryption", "vulnerability", "malware", "penetration test", "network security", "cryptograph"]),
    ("Cloud Computing", ["cloud computing", "cloud-based", "cloud platform", "cloud infrastructure"]),
    ("Edge Computing", ["edge computing", "edge device", "on-device processing"]),
    ("Embedded Systems", ["embedded system", "microcontroller", "firmware", "pcb design"]),
    ("Augmented Reality (AR)", ["augmented reality", r"\bar\b overlay", "ar-based", "ar application"]),
    ("Virtual Reality (VR)", ["virtual reality", r"\bvr\b", "vr simulator", "immersive simulation"]),
    ("GIS / Remote Sensing", ["gis", "geospatial", "remote sensing", "satellite imagery", "satellite data", "geo-tagged", "geo-fencing"]),
    ("Mobile App Development", ["mobile app", "mobile application", "android app", "ios app", "smartphone app"]),
    ("Web Development", ["web application", "web-based platform", "web portal", "website", "web dashboard"]),
    ("Frontend Dev", ["frontend", "front-end", "user interface design", "responsive ui"]),
    ("Backend Dev", ["backend", "back-end", "api development", "server-side"]),
    ("Full Stack Development", ["full stack", "full-stack"]),
    ("Data Analytics", ["data analytics", "data analysis", "dashboard", "data visualization", "business intelligence"]),
    ("Game Dev", ["game development", "gamified", "gamification", "video game"]),
    ("Video Data", ["video feed", "video surveillance", "cctv footage", "video stream"]),
    ("Audio Data", ["audio signal", "audio recording", "acoustic data", "voice data"]),
    ("Sensor Data", ["sensor data", "sensor reading", "iot sensor", "wearable sensor"]),
]

STAKEHOLDER_RULES = [
    ("Citizens", ["citizen", "general public", "community member", "resident"]),
    ("Doctors / Patients", ["patient", "doctor", "clinician", "healthcare worker", "hospital staff", "nurse"]),
    ("Farmers", ["farmer", "agricultur", "farming community", "fpo"]),
    ("Government Agencies", ["government", "ministry", "district administration", "state department", "public authorit", "regulatory bod"]),
    ("Industry / Enterprises", ["industry", "enterprise", "manufacturer", "business", "corporate", "msme"]),
    ("Law Enforcement", ["police", "law enforcement", "security force", "border security", "investigation agency"]),
    ("Local Communities", ["local communit", "village", "rural population", "tribal", "remote area"]),
    ("Military / Defense", ["military", "defence", "defense", "armed forces", "army", "navy", "air force", "soldier"]),
    ("NGOs", ["ngo", "non-governmental", "civil society"]),
    ("Students / Teachers", ["student", "teacher", "school", "college", "faculty", "academic institution"]),
    ("Travelers", ["traveler", "traveller", "tourist", "passenger", "commuter"]),
]

IMPACT_AREA_RULES = [
    ("Accessibility", ["accessib", "disabilit", "specially abled", "divyang"]),
    ("Awareness & Education", ["awareness", "education", "training", "literacy", "outreach"]),
    ("Cost Reduction", ["cost reduction", "cost-effective", "reduce cost", "affordable", "low-cost"]),
    ("Efficiency Improvement", ["efficien", "streamlin", "optimi", "automat", "faster processing"]),
    ("Inclusivity", ["inclusiv", "equitable access", "underserved", "marginalized"]),
    ("Productivity", ["productivity", "throughput", "output improvement"]),
    ("Safety", ["safety", "hazard", "risk mitigation", "accident prevention", "rescue"]),
    ("Security", ["security", "surveillance", "threat detection", "fraud detection", "intrusion"]),
    ("Sustainability", ["sustainab", "environment", "renewable", "carbon", "climate", "conservation", "green technology"]),
    ("Transparency", ["transparen", "accountab", "audit trail", "traceab"]),
]

DATA_RESOURCE_RULES = [
    ("Real-time Streaming", ["real-time", "real time monitoring", "live feed", "live tracking", "streaming data"]),
    ("Geospatial Data", ["geospatial", "gis mapping", "geo-tagged", "geographic information"]),
    ("Satellite Data", ["satellite imagery", "satellite data", "remote sensing"]),
    ("Sensor Data", ["sensor data", "iot sensor", "wearable sensor", "sensor reading"]),
    ("Image Data", ["image data", "photograph", "image processing", "image recognition"]),
    ("Video Data", ["video feed", "video data", "cctv footage", "video stream"]),
    ("Audio Data", ["audio data", "audio signal", "acoustic", "voice recording"]),
    ("Text Data", ["text data", "document analysis", "text mining", "report analysis"]),
    ("Social Media Data", ["social media", "twitter", "facebook data"]),
    ("Open Data", ["open data", "open-source dataset", "public dataset"]),
]

SOLUTION_TYPE_KEYWORDS = {
    "mobile": ["mobile app", "mobile application", "android app", "ios app", "smartphone app"],
    "web": ["web application", "web portal", "web-based platform", "web dashboard", "website"],
}


def matches_any(text, keywords):
    return any(re.search(kw, text) for kw in keywords)


def tag_from_rules(text, rules):
    tags = []
    for label, keywords in rules:
        if matches_any(text, keywords):
            tags.append(label)
    return tags


def solution_type(text):
    has_mobile = matches_any(text, SOLUTION_TYPE_KEYWORDS["mobile"])
    has_web = matches_any(text, SOLUTION_TYPE_KEYWORDS["web"])
    if has_mobile and has_web:
        return ["Mobile and Web Solutions"]
    if has_mobile:
        return ["Mobile Solutions"]
    if has_web:
        return ["Web Solutions"]
    return []


def enrich(problem):
    text = f"{problem['title']} {problem['description']}".lower()

    problem["summary"] = summarize(problem["description"], problem["title"])
    problem["technology"] = tag_from_rules(text, TECHNOLOGY_RULES)
    problem["stakeholders"] = tag_from_rules(text, STAKEHOLDER_RULES)
    problem["impact_area"] = tag_from_rules(text, IMPACT_AREA_RULES)
    problem["data_resource_type"] = tag_from_rules(text, DATA_RESOURCE_RULES)
    problem["solution_type"] = solution_type(text)
    return problem


data = json.load(open(f"{BASE}/src/data/problems.json"))

updated = 0
empty_tech = 0
empty_stake = 0
for p in data:
    if p.get("year") == 2026:
        enrich(p)
        updated += 1
        if not p["technology"]:
            empty_tech += 1
        if not p["stakeholders"]:
            empty_stake += 1

print("updated:", updated)
print("2026 rows with no technology tag:", empty_tech)
print("2026 rows with no stakeholder tag:", empty_stake)

json.dump(data, open(f"{BASE}/src/data/problems.json", "w"), indent=2, ensure_ascii=False)
