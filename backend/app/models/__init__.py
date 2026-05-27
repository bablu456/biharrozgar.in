from app.models.application import Application
from app.models.auth_otp import AuthOTP
from app.models.base import Base
from app.models.category import Category
from app.models.job import Job
from app.models.job_embedding import JobEmbedding
from app.models.location import District
from app.models.profile import Profile
from app.models.recommendation import JobRecommendation
from app.models.user import User

__all__ = [
    "Application",
    "AuthOTP",
    "Base",
    "Category",
    "Job",
    "JobEmbedding",
    "District",
    "JobRecommendation",
    "Profile",
    "User",
]
