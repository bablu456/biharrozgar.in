from fastapi import APIRouter

from app.api.v1.endpoints import applications, auth, chat, health, jobs, locations, profile

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profile.router, prefix="/auth", tags=["profile"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
