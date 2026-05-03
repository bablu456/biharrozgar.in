export type UserRole = 'seeker' | 'employer' | 'admin';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'daily-wage';

export type JobStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'hired';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type SalaryType = 'monthly' | 'daily' | 'hourly';

export type ApplicationMethod = 'whatsapp' | 'form' | 'email';

export interface Profile {
  id: string;
  phone?: string | null;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  resume_url?: string;
  resume_parsed?: Record<string, unknown>;
  district?: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  expected_salary_min?: number;
  expected_salary_max?: number;
  whatsapp_notifications: boolean;
  email_notifications: boolean;
  is_premium: boolean;
  premium_plan?: string;
  premium_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements?: string;
  category: string;
  job_type: JobType;
  district: string;
  city?: string;
  locality?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: SalaryType;
  is_fresher_friendly: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  is_premium: boolean;
  application_method: ApplicationMethod;
  whatsapp_number?: string;
  application_link?: string;
  apply_instructions?: string;
  views_count: number;
  applicants_count: number;
  status: JobStatus;
  approved_by?: string;
  approved_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  employer?: Profile;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  cover_letter?: string;
  applied_at: string;
  updated_at: string;
  job?: Job;
  applicant?: Profile;
}

export interface JobAlert {
  id: string;
  user_id: string;
  keywords?: string;
  district?: string;
  category?: string;
  job_type?: JobType;
  salary_min?: number;
  frequency: 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: PaymentStatus;
  features?: Record<string, unknown>;
  job_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name_hi: string;
  name_en: string;
  icon: string;
  slug: string;
}

export interface District {
  id: number;
  name: string;
  slug: string;
}
