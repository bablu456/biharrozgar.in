from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    SEEKER = "seeker"
    EMPLOYER = "employer"
    ADMIN = "admin"


class OtpPurpose(str, Enum):
    REGISTER = "register"
    LOGIN = "login"


class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    DAILY_WAGE = "daily-wage"


class SalaryType(str, Enum):
    MONTHLY = "monthly"
    DAILY = "daily"
    HOURLY = "hourly"


class ApplicationMethod(str, Enum):
    WHATSAPP = "whatsapp"
    FORM = "form"
    EMAIL = "email"


class JobStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    HIRED = "hired"
