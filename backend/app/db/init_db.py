import asyncio
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.session import AsyncSessionFactory, engine
from app.models.category import Category
from app.models.location import District

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CATEGORIES = [
    {"name_hi": "कोचिंग और ट्यूशन", "name_en": "Coaching & Tutoring", "icon": "GraduationCap", "slug": "coaching"},
    {"name_hi": "रेटेल और सेल्स", "name_en": "Retail & Sales", "icon": "ShoppingBag", "slug": "retail"},
    {"name_hi": "सेवाएं", "name_en": "Services", "icon": "Briefcase", "slug": "services"},
    {"name_hi": "दैनिक मजदूरी", "name_en": "Daily Wage", "icon": "Clock", "slug": "daily-wage"},
    {"name_hi": "टेक और आईटी", "name_en": "Tech & IT", "icon": "Laptop", "slug": "tech"},
    {"name_hi": "सरकारी नौकरी", "name_en": "Government", "icon": "Building2", "slug": "government"},
    {"name_hi": "डिलीवरी", "name_en": "Delivery", "icon": "Truck", "slug": "delivery"},
    {"name_hi": "सुरक्षा", "name_en": "Security", "icon": "Shield", "slug": "security"},
    {"name_hi": "स्वास्थ्य सेवा", "name_en": "Healthcare", "icon": "Heart", "slug": "healthcare"},
    {"name_hi": "आतिथ्य", "name_en": "Hospitality", "icon": "Hotel", "slug": "hospitality"},
    {"name_hi": "फैक्ट्री और विनिर्माण", "name_en": "Factory & Manufacturing", "icon": "Factory", "slug": "factory"},
    {"name_hi": "अन्य", "name_en": "Other", "icon": "MoreHorizontal", "slug": "other"}
]

DISTRICTS = [
    {"name": "Patna", "slug": "patna"}, {"name": "Gaya", "slug": "gaya"}, {"name": "Bhagalpur", "slug": "bhagalpur"},
    {"name": "Muzaffarpur", "slug": "muzaffarpur"}, {"name": "Darbhanga", "slug": "darbhanga"},
    {"name": "Bihar Sharif", "slug": "bihar-sharif"}, {"name": "Purnia", "slug": "purnia"}, {"name": "Katihar", "slug": "katihar"},
    {"name": "Saharsa", "slug": "saharsa"}, {"name": "Hajipur", "slug": "hajipur"}, {"name": "Chapra", "slug": "chapra"},
    {"name": "Motihari", "slug": "motihari"}, {"name": "Bettiah", "slug": "bettiah"}, {"name": "Bagaha", "slug": "bagaha"},
    {"name": "Siwan", "slug": "siwan"}, {"name": "Gopalganj", "slug": "gopalganj"}, {"name": "Nalanda", "slug": "nalanda"},
    {"name": "Nawada", "slug": "nawada"}, {"name": "Jehanabad", "slug": "jehanabad"}, {"name": "Aurangabad", "slug": "aurangabad"},
    {"name": "Madhubani", "slug": "madhubani"}, {"name": "Samastipur", "slug": "samastipur"}, {"name": "Begusarai", "slug": "begusarai"},
    {"name": "Jamui", "slug": "jamui"}, {"name": "Kishanganj", "slug": "kishanganj"}, {"name": "Araria", "slug": "araria"},
    {"name": "Supaul", "slug": "supaul"}, {"name": "Madhepura", "slug": "madhepura"}, {"name": "Khagaria", "slug": "khagaria"},
    {"name": "Munger", "slug": "munger"}, {"name": "Lakhisarai", "slug": "lakhisarai"}, {"name": "Sheikhpura", "slug": "sheikhpura"},
    {"name": "Kaimur", "slug": "kaimur"}, {"name": "Rohtas", "slug": "rohtas"}, {"name": "Buxar", "slug": "buxar"},
    {"name": "Vaishali", "slug": "vaishali"}, {"name": "Saran", "slug": "saran"}
]

async def init_db():
    async with engine.begin() as conn:
        logger.info("Ensuring pgvector extension is installed...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create tables
        logger.info("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionFactory() as session:        # Seed categories
        logger.info("Seeding categories...")
        for cat_data in CATEGORIES:
            from sqlalchemy import select
            result = await session.execute(select(Category).where(Category.slug == cat_data["slug"]))
            if not result.scalar_one_or_none():
                session.add(Category(**cat_data))
        
        # Seed districts
        logger.info("Seeding districts...")
        for dist_data in DISTRICTS:
            result = await session.execute(select(District).where(District.slug == dist_data["slug"]))
            if not result.scalar_one_or_none():
                session.add(District(**dist_data))
        
        await session.commit()
        logger.info("Database initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
