# Seed articles script

from app.database.session import SessionLocal, Base, engine
from app.models.models import Article
import app.models.models  # noqa

ARTICLES = [
    ("Every Drop Has a Story", "water-stories", "Awareness",
     "Follow a single glass of water from source to tap.",
     "Water reaches a home after being collected, treated and carried through pipes. "
     "Each step takes effort and energy, which is why wasting it matters.",
     ["Fix dripping taps promptly", "Turn the tap off while brushing"]),
    ("What Happens When a City Runs Out of Water?", "city-runs-out", "Awareness",
     "A thought experiment about shortages and how communities respond.",
     "This is an illustrative scenario, not a forecast. When supply falls short, tankers, "
     "rationing and storage become daily concerns.", ["Know your tank capacity", "Plan usage together"]),
    ("The Hidden Cost of a Leaking Tap", "leaking-tap", "Practical",
     "Small leaks add up across a building over weeks.",
     "A slow drip looks harmless. Over a month, and across many flats, the volume becomes noticeable. "
     "Measuring is the first step to finding it.", ["Check taps and flush tanks monthly"]),
    ("Your Society, Your Responsibility", "your-society", "Community",
     "Why shared infrastructure needs shared accountability.",
     "Societies manage tanks, pumps and common areas. Transparent records help committees "
     "spot problems early.", ["Read the inlet meter on a fixed date each month"]),
    ("Rainwater Harvesting: Turning Rain into a Resource", "rainwater-harvesting", "Practical",
     "How collecting rain can supplement a society's supply.",
     "Rooftop collection can feed storage or recharge systems. Check local rules and "
     "get a qualified installer.", ["Keep roof catchments clean", "Inspect filters before monsoon"]),
    ("The Water You Don't See", "water-you-dont-see", "Awareness",
     "Water embedded in food and goods.",
     "Everyday products need water to produce. Thinking about this broadens how we see consumption.",
     ["Avoid food waste"]),
    ("From Competition to Conservation", "competition-to-conservation", "Community",
     "How a fair leaderboard can motivate without shaming.",
     "Rankings that compare per-person use and a society's own improvement reward effort, "
     "not just size.", ["Set a society target together"]),
    ("Building a Water-Smart Mumbai", "water-smart-mumbai", "Community",
     "What a community-led approach could look like.",
     "Many small, well-measured improvements across buildings can add up. "
     "This is a vision, not a claim of measured results.", ["Share what works with neighbouring societies"]),
]

Base.metadata.create_all(bind=engine)
db = SessionLocal()
for title, slug, cat, summ, body, actions in ARTICLES:
    if not db.query(Article).filter_by(slug=slug).first():
        db.add(Article(title=title, slug=slug, category=cat, summary=summ, body=body,
                       actions=actions, sources=[], reading_minutes=3, cover_image=None))
db.commit()
print("Articles seeded.")