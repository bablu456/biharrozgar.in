import asyncio
import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.abspath("."))

async def check_redis():
    try:
        from app.db.redis import init_redis, close_redis, redis_client
        from app.core.config import get_settings
        settings = get_settings()
        
        await init_redis()
        # Access the global redis_client
        import app.db.redis as redis_mod
        if redis_mod.redis_client is not None:
            await redis_mod.redis_client.ping()
            print("[OK] Redis connection successful")
            await close_redis()
        else:
            print("[FAILED] Redis connection (client is None)")
    except Exception as e:
        print(f"[FAILED] Redis connection ({e})")

async def check_db():
    try:
        from app.db.session import engine
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("[OK] PostgreSQL connection successful")
    except Exception as e:
        print(f"[FAILED] PostgreSQL connection ({e})")

async def main():
    print("Running Infrastructure Health Check...")
    await check_db()
    await check_redis()

if __name__ == "__main__":
    asyncio.run(main())
