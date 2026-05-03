'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Users, TrendingUp, Star, Zap } from 'lucide-react';
import { GoogleAccountCard } from '@/components/auth/GoogleAccountCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ full_name: string; role: string; is_premium: boolean } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await apiFetch<{ full_name: string; role: string; is_premium: boolean }>('/auth/me').then(res => res.profile);
        setUser(profile);

        const jobsData = await apiFetch<Job[]>('/jobs/my');
        
        if (jobsData) setJobs(jobsData);
      } catch (err) {
        console.error('Error fetching employer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalViews = jobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants_count || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'approved').length;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Employer Dashboard</h1>
              <p className="text-bihar-green-light mt-1">Manage your job postings</p>
            </div>
            {user?.is_premium && (
              <Badge variant="featured" className="bg-white text-bihar-green">
                <Star className="w-4 h-4 mr-1" /> Premium
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-bihar-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                <div className="text-sm text-gray-500">Total Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-yellow-light rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-bihar-yellow-dark" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
                <div className="text-sm text-gray-500">Total Views</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalApplicants}</div>
                <div className="text-sm text-gray-500">Applicants</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{activeJobs}</div>
                <div className="text-sm text-gray-500">Active Jobs</div>
              </div>
            </div>
          </div>
        </div>

        {!user?.is_premium && (
          <div className="bg-gradient-to-r from-bihar-yellow-light to-bihar-yellow rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Upgrade to Premium
                </h3>
                <p className="text-gray-600 text-sm mt-1">Get more visibility, featured badges & unlimited posts</p>
              </div>
              <Link href="/pricing">
                <Button variant="secondary">View Plans</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">My Job Posts</h2>
            <Link href="/jobs/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Post New Job
              </Button>
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Job Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">District</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Views</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Applicants</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Posted</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.category}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{job.district}</td>
                      <td className="py-3 px-4 text-gray-600">{job.views_count}</td>
                      <td className="py-3 px-4 text-gray-600">{job.applicants_count}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          job.status === 'approved' ? 'bg-green-100 text-green-700' :
                          job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          job.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{job.status}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(job.created_at)}</td>
                      <td className="py-3 px-4">
                        <Link href={`/jobs/${job.id}`} className="text-bihar-green hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No jobs posted yet</p>
              <Link href="/jobs/create">
                <Button>Post Your First Job</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8">
          <GoogleAccountCard />
        </div>
      </div>
    </div>
  );
}
