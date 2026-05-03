'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Search, Users, Briefcase, MapPin, Star } from 'lucide-react';
import { JobSearch } from '@/components/jobs/JobSearch';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { JOB_CATEGORIES } from '@/constants/categories';
import { BIHAR_DISTRICTS } from '@/constants/districts';
import { createClient } from '@/lib/supabase';
import { useEffect } from 'react';
import type { Job } from '@/types';

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    employer_id: 'emp1',
    title: 'Senior Frontend Engineer',
    description: 'Looking for React expertise to build scalable UI interfaces. Work with a dynamic team.',
    category: 'it-software',
    job_type: 'full-time',
    district: 'Patna',
    salary_min: 800000,
    salary_max: 1200000,
    is_fresher_friendly: false,
    is_featured: true,
    is_urgent: true,
    is_premium: true,
    application_method: 'whatsapp',
    views_count: 342,
    applicants_count: 12,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employer: {
      id: 'emp1',
      phone: '9876543210',
      full_name: 'TechFlow Solutions',
      role: 'employer',
      whatsapp_notifications: true,
      email_notifications: true,
      is_premium: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: '2',
    employer_id: 'emp2',
    title: 'Digital Marketing Lead',
    description: 'Dynamic marketing professional needed to drive state-wise campaigns.',
    category: 'marketing',
    job_type: 'full-time',
    district: 'Gaya',
    salary_min: 400000,
    salary_max: 600000,
    is_fresher_friendly: true,
    is_featured: true,
    is_urgent: false,
    is_premium: false,
    application_method: 'form',
    views_count: 156,
    applicants_count: 4,
    status: 'approved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    employer: {
      id: 'emp2',
      phone: '9876543211',
      full_name: 'Growth Bihar',
      role: 'employer',
      whatsapp_notifications: true,
      email_notifications: true,
      is_premium: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    id: '3',
    employer_id: 'emp3',
    title: 'Senior Mathematics Teacher',
    description: 'Experienced math teacher for secondary division (Classes 9-12).',
    category: 'education',
    job_type: 'full-time',
    district: 'Muzaffarpur',
    salary_min: 300000,
    salary_max: 500000,
    is_fresher_friendly: false,
    is_featured: false,
    is_urgent: true,
    is_premium: true,
    application_method: 'whatsapp',
    views_count: 89,
    applicants_count: 2,
    status: 'approved',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    employer: {
      id: 'emp3',
      phone: '9876543212',
      full_name: 'Vidya Global School',
      role: 'employer',
      whatsapp_notifications: true,
      email_notifications: true,
      is_premium: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  ShoppingBag: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.378 3h13.243a1.125 1.125 0 0 1 1.155 1.006z" />
    </svg>
  ),
  Briefcase: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.886-7.057-2.253a2.106 2.106 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  ),
  Laptop: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  ),
  Building2: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5m-16.5 3.75h16.5m-16.5 3.75h16.5m-16.5 3.75h16.5M4.5 9h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5" />
    </svg>
  ),
  Truck: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 12 9 12.75V21H9V12.75Zm0-9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 0V6a3 3 0 1 0 0-6 3 3 0 0 0 0 6v6Zm0 0h12a2.25 2.25 0 0 1 2.25 2.25v.75a2.25 2.25 0 0 1-2.25 2.25h-2.25M3.375 18.75h2.25a2.25 2.25 0 0 1 2.25 2.25v.75a2.25 2.25 0 0 1-2.25 2.25h-2.25M3.375 9h2.25a2.25 2.25 0 0 1 2.25 2.25v.75a2.25 2.25 0 0 1-2.25 2.25h-2.25" />
    </svg>
  ),
  Heart: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
  Hotel: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  Factory: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
    </svg>
  ),
  MoreHorizontal: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
};

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('jobs')
          .select('*, employer:profiles(*)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setJobs(data);
        } else {
          setJobs(MOCK_JOBS);
        }
      } catch (err) {
        console.warn('Backend fetch failed, using realistic mock data for presentation', err);
        setJobs(MOCK_JOBS);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearch = (query: string) => {
    window.location.href = `/jobs?search=${encodeURIComponent(query)}`;
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative mesh-bg section-padding flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[5%] left-[5%] w-[30rem] h-[30rem] bg-bihar-green/20 rounded-full blur-[100px] animate-blob mix-blend-multiply" />
          <div className="absolute top-[10%] right-[10%] w-[25rem] h-[25rem] bg-bihar-yellow/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply" />
          <div className="absolute bottom-[20%] left-[20%] w-[25rem] h-[25rem] bg-rose-300/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 mb-8 shadow-sm hover:shadow-md transition-shadow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bihar-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-tr from-bihar-green to-bihar-green-light"></span>
              </span>
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-bihar-green-dark to-slate-800">
                Trusted by 1000+ Employers across Bihar
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black text-slate-900 mb-6 tracking-tight leading-[1.1] drop-shadow-sm">
              Empowering Bihar through <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-bihar-green via-emerald-500 to-bihar-green-light animate-pulse-glow">Smart Employment</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Find your dream career in Patna, Gaya, Bhagalpur and all 38 districts. 
              The most trusted, local-first job portal for the youth of Bihar.
            </p>
          </div>
          
          <div className="animate-fade-up [animation-delay:200ms] w-full">
            <div className="glass-panel p-6 md:p-8 max-w-4xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-bihar-green/5 to-bihar-yellow/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <JobSearch onSearch={handleSearch} />
              
              <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Trending:</span>
                {['TCS Patna', 'Teacher', 'Retail Executive', 'Delivery Partner'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="text-sm px-5 py-2 rounded-full bg-white text-slate-700 hover:bg-bihar-green hover:text-white transition-all shadow-sm hover:shadow-md font-semibold border-none"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="hidden lg:block absolute left-20 top-1/4 animate-float">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-bihar-green rounded-lg flex items-center justify-center">
              <Star className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">4.9/5</div>
              <div className="text-xs text-gray-500">User Rating</div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute right-20 bottom-1/4 animate-float [animation-delay:1s]">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-bihar-yellow rounded-lg flex items-center justify-center">
              <Briefcase className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">5k+</div>
              <div className="text-xs text-gray-500">Active Jobs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner - Reimagined */}
      <section className="relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel py-12 px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-in mx-auto">
            <div className="group">
              <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-bihar-green to-emerald-600 mb-2 group-hover:scale-110 transition-transform">5000+</div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider">Jobs Posted</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-bihar-green to-emerald-600 mb-2 group-hover:scale-110 transition-transform">1000+</div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider">Employers</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-bihar-green to-emerald-600 mb-2 group-hover:scale-110 transition-transform">38</div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider">Districts</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-bihar-green to-emerald-600 mb-2 group-hover:scale-110 transition-transform">50k+</div>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider">Job Seekers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 drop-shadow-sm">Choose Your Path</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Explore opportunities across various sectors specially curated for the local market of Bihar.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-fade-up [animation-delay:100ms]">
            {JOB_CATEGORIES.slice(0, 6).map((cat) => {
              const IconComponent = iconMap[cat.icon] || Briefcase;
              return (
                <Link
                  key={cat.id}
                  href={`/jobs?category=${cat.slug}`}
                  className="bg-white rounded-[2rem] p-7 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-2 transition-all duration-300 group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-bihar-green/10 to-transparent rounded-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150" />
                  <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-bihar-green/10 to-teal-100/50 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-bihar-green group-hover:to-bihar-green-dark group-hover:shadow-lg transition-all relative z-10">
                    <IconComponent className="w-8 h-8 text-bihar-green group-hover:text-white transition-colors" />
                  </div>
                  <div className="font-bold text-slate-900 relative z-10 text-[0.95rem]">{cat.name_en}</div>
                  <div className="text-xs text-bihar-green-dark font-semibold relative z-10 mt-1 opacity-80">{cat.name_hi}</div>
                </Link>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/jobs">
              <button className="btn-outline">
                See All Categories <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12 animate-fade-up">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Jobs</h2>
              <p className="text-gray-500">Fresh opportunities updated every hour.</p>
            </div>
            <Link href="/jobs" className="text-bihar-green font-bold hover:underline flex items-center gap-2 group">
              Explore All <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-6 animate-fade-up [animation-delay:100ms]">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} variant="default" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
              <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-6" />
              <p className="text-xl font-medium text-gray-500 mb-6">No jobs available yet. Be the first to post!</p>
              <Link href="/register?role=employer">
                <button className="btn-primary">Post a Job Fast</button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Gradient Card */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-bihar-green to-bihar-green-dark rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">
              Hiring for your Business?
            </h2>
            <p className="text-bihar-green-light font-medium text-xl mb-12 max-w-2xl mx-auto relative z-10">
              Post your job in 2 minutes and find the best verified candidates across Bihar. Zero hassle, maximum reach.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
              <Link href="/register?role=employer">
                <button className="btn-secondary px-10 py-5 text-xl shadow-2xl">
                  Post a Job Free
                </button>
              </Link>
              <Link href="/pricing">
                <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-xl">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500">Our simple 3-step process to get you hired or help you hire.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto bg-bihar-green/5 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:bg-bihar-green group-hover:rotate-12 transition-all duration-500">
                <Search className="w-10 h-10 text-bihar-green group-hover:text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-4 group-hover:text-bihar-green transition-colors">1. Search Jobs</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse thousands of jobs across categories and districts. Filter by your preferences with our smart search.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto bg-bihar-green/5 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:bg-bihar-green group-hover:rotate-12 transition-all duration-500">
                <svg className="w-10 h-10 text-bihar-green group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25-9 3.694-9 8.25c0 1.618.504 3.125 1.364 4.375L3 21l4.625-1.299c1.056.353 2.197.549 3.375.549z" />
                </svg>
              </div>
              <h3 className="font-bold text-2xl mb-4 group-hover:text-bihar-green transition-colors">2. Apply via WhatsApp</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect directly with employers through WhatsApp. No complicated forms, just direct talk.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-24 h-24 mx-auto bg-bihar-green/5 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:bg-bihar-green group-hover:rotate-12 transition-all duration-500">
                <Users className="w-10 h-10 text-bihar-green group-hover:text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-4 group-hover:text-bihar-green transition-colors">3. Get Hired</h3>
              <p className="text-gray-600 leading-relaxed">
                Join the thousands of successful candidates who found their career journey via Bihar Rozgar.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}