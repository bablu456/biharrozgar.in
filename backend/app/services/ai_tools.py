import json
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import Job
from app.models.enums import JobStatus
from typing import Any
import uuid

# Tool schema for OpenRouter / OpenAI API
SEARCH_JOBS_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "search_jobs",
        "description": "Search for active jobs in the biharrozgar.in database based on location and role.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The district or city to search for jobs in (e.g., Patna, Gaya).",
                },
                "role": {
                    "type": "string",
                    "description": "The job title or category (e.g., Driver, Teacher, Data Entry).",
                },
            },
            "required": [],
        },
    },
}

async def search_jobs_in_db(db: AsyncSession, location: str | None = None, role: str | None = None) -> str:
    """
    Query the active jobs from the database based on the provided filters.
    Returns the results as a JSON string to be consumed by the LLM.
    """
    # Only return approved/active jobs
    stmt = select(Job).where(Job.status == JobStatus.APPROVED)
    
    if location:
        loc_filter = f"%{location}%"
        stmt = stmt.where(or_(Job.district.ilike(loc_filter), Job.city.ilike(loc_filter)))
        
    if role:
        role_filter = f"%{role}%"
        stmt = stmt.where(or_(Job.title.ilike(role_filter), Job.category.ilike(role_filter)))
        
    # Limit results to keep context small
    stmt = stmt.limit(5)
    
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    
    if not jobs:
        return json.dumps({"message": "No active jobs found matching the search criteria."})
        
    job_results = []
    for job in jobs:
        job_results.append({
            "title": job.title,
            "category": job.category,
            "district": job.district,
            "city": job.city,
            "salary_range": f"{job.salary_min} - {job.salary_max} {job.salary_type}" if job.salary_min else "Not specified",
            "job_type": job.job_type,
            "description_snippet": job.description[:150] + "..." if len(job.description) > 150 else job.description
        })
        
    return json.dumps({"jobs": job_results})

UPDATE_PROFILE_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "update_profile",
        "description": "Update the logged-in user's profile with their skills or bio. Do not use this if the user is asking about someone else.",
        "parameters": {
            "type": "object",
            "properties": {
                "skills": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "A list of skills to update the profile with.",
                },
                "bio": {
                    "type": "string",
                    "description": "A short biography or summary of the user.",
                },
            },
            "required": [],
        },
    },
}

async def update_user_profile_via_ai(
    db: AsyncSession, 
    current_user_id: uuid.UUID | str | int, 
    skills: list[str] | None = None, 
    bio: str | None = None
) -> str:
    from app.models.profile import Profile
    stmt = select(Profile).where(Profile.id == current_user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        return json.dumps({"message": "Error: User profile not found."})
        
    updated = False
    if skills is not None:
        profile.skills = skills
        updated = True
    if bio is not None:
        profile.bio = bio
        updated = True
        
    if updated:
        await db.commit()
        return json.dumps({"message": "Profile successfully updated with new skills/bio."})
    else:
        return json.dumps({"message": "No changes provided to update."})
