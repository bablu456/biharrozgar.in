'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Heart, Bell, User, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import type { Job, Application } from '@/types';

export default function SeekerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, appsRes] = await Promise.all([
          apiFetch<{ profile: { full_name: string; role: string } }>('/auth/me').then(
            (res) => res.profile
          ),
          apiFetch<Application[]>('/applications/my'),
        ]);

        setUser(profile);
        setApplications(appsRes || []);

        // Fetch recent jobs
        const jobsRes = await apiFetch<Job[]>('/jobs', {
          params: { limit: 5 }
        });
        setJobs(jobsRes || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-bihar-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-bihar-green text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name || 'Job Seeker'}!</h1>
          <p className="text-bihar-green-light mt-1">Find your next job in Bihar</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/jobs" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-bihar-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Browse Jobs</div>
                <div className="text-sm text-gray-500">Find opportunities</div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/seeker/applications" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-yellow-light rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-bihar-yellow-dark" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                <div className="text-sm text-gray-500">My Applications</div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/seeker/alerts" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Job Alerts</div>
                <div className="text-sm text-gray-500">Get notified</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/jobs" className="text-bihar-green text-sm hover:underline">View All</Link>
            </div>

            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block p-3 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-500">{job.district} • {job.job_type}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No jobs available</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
              <Link href="/dashboard/seeker/applications" className="text-bihar-green text-sm hover:underline">View All</Link>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="font-medium text-gray-900">{app.job?.title}</div>
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        app.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{app.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No applications yet</p>
                <Link href="/jobs">
                  <Button>Find Jobs</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
